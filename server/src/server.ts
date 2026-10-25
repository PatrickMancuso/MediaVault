
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

dotenv.config();

console.log("Working directory:", process.cwd());
console.log(
  "TMDB token loaded:",
  Boolean(process.env.TMDB_ACCESS_TOKEN),
);

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const TMDB_ACCESS_TOKEN =
  process.env.TMDB_ACCESS_TOKEN;

  const TWITCH_CLIENT_ID =
  process.env.TWITCH_CLIENT_ID;

const TWITCH_CLIENT_SECRET =
  process.env.TWITCH_CLIENT_SECRET;

app.use(cors());
app.use(express.json());

let igdbAccessToken:
  | string
  | null = null;

let igdbTokenExpiresAt = 0;

async function getIgdbAccessToken() {
  if (
    igdbAccessToken &&
    Date.now() < igdbTokenExpiresAt
  ) {
    return igdbAccessToken;
  }

  if (
    !TWITCH_CLIENT_ID ||
    !TWITCH_CLIENT_SECRET
  ) {
    throw new Error(
      'TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET is not configured.',
    );
  }

  const tokenResponse = await fetch(
    'https://id.twitch.tv/oauth2/token',
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id:
          TWITCH_CLIENT_ID,
        client_secret:
          TWITCH_CLIENT_SECRET,
        grant_type:
          'client_credentials',
      }),
    },
  );

  if (!tokenResponse.ok) {
    const errorText =
      await tokenResponse.text();

    console.error(
      'Twitch token request failed:',
      tokenResponse.status,
      errorText,
    );

    throw new Error(
      'Unable to authenticate with IGDB.',
    );
  }

  const tokenData =
    await tokenResponse.json();

  igdbAccessToken =
    tokenData.access_token;

  igdbTokenExpiresAt =
    Date.now() +
    Number(tokenData.expires_in) * 1000 -
    60_000;

  return igdbAccessToken;
}

app.get("/api/health", (_req, res) => {
  res.json({
  status: 'ok',

  tmdbConfigured:
    Boolean(TMDB_ACCESS_TOKEN),

  igdbConfigured:
    Boolean(
      TWITCH_CLIENT_ID &&
      TWITCH_CLIENT_SECRET,
    ),
});
});

/**
 * Search TMDB for movies.
 *
 * Example:
 * GET /api/media/search/movie?q=Alien
 */
app.get("/api/media/search/movie", async (req, res) => {
  try {
    const query = String(req.query.q ?? "").trim();

    if (!query) {
      return res.status(400).json({
        error: "A search query is required.",
      });
    }

    if (!TMDB_ACCESS_TOKEN) {
      return res.status(500).json({
        error: "TMDB_ACCESS_TOKEN is not configured.",
      });
    }

    const url = new URL(
      "https://api.themoviedb.org/3/search/movie",
    );

    url.searchParams.set("query", query);
    url.searchParams.set("include_adult", "false");
    url.searchParams.set("language", "en-US");
    url.searchParams.set("page", "1");

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
        accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "TMDB search failed:",
        response.status,
        errorText,
      );

      return res.status(response.status).json({
        error: "TMDB search failed.",
      });
    }

    const data = await response.json();

    const results = Array.isArray(data.results)
  ? data.results
      .slice(0, 12)
      .map((movie: any) => ({
            externalId: movie.id,
            title:
              movie.title ??
              movie.original_title ??
              "",
            releaseDate:
              movie.release_date ?? "",
            year: movie.release_date
              ? Number(
                  movie.release_date.slice(0, 4),
                )
              : null,
            description:
              movie.overview ?? "",
            posterPath:
              movie.poster_path ?? null,
            backdropPath:
              movie.backdrop_path ?? null,
            posterImage: movie.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : null,
            backdropImage:
              movie.backdrop_path
                ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
                : null,
          }))
      : [];

    return res.json({
      source: "tmdb",
      results,
    });
  } catch (error) {
    console.error(
      "Unexpected TMDB search error:",
      error,
    );

    return res.status(500).json({
      error: "Unexpected server error.",
    });
  }
});

/**
 * Search IGDB for video games.
 *
 * Example:
 * GET /api/media/search/game?q=Halo
 */
app.get(
  "/api/media/search/game",
  async (req, res) => {
    try {
      const query =
        String(
          req.query.q ?? "",
        ).trim();

      if (!query) {
        return res.status(400).json({
          error:
            "A search query is required.",
        });
      }

      if (
        !TWITCH_CLIENT_ID ||
        !TWITCH_CLIENT_SECRET
      ) {
        return res.status(500).json({
          error:
            "IGDB credentials are not configured.",
        });
      }

      const accessToken =
        await getIgdbAccessToken();

   const igdbQuery = `
  search "${query.replace(
    /"/g,
    '\\"',
  )}";

  fields
    name,
    summary,
    storyline,
    first_release_date,

    cover.image_id,

    genres.name,
    platforms.name,

    rating,
    rating_count,

    involved_companies.developer,
    involved_companies.publisher,
    involved_companies.company.name,

    game_modes.name,
    player_perspectives.name,
    themes.name,

    screenshots.image_id,
    screenshots.width,
    screenshots.height,

    videos.name,
    videos.video_id,

    slug;

  where version_parent = null;

  limit 17;
`;

      const response =
        await fetch(
          "https://api.igdb.com/v4/games",
          {
            method: "POST",

            headers: {
              Accept:
                "application/json",

              "Client-ID":
                TWITCH_CLIENT_ID,

              Authorization:
                `Bearer ${accessToken}`,

              "Content-Type":
                "text/plain",
            },

            body: igdbQuery,
          },
        );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "IGDB search failed:",
          response.status,
          errorText,
        );

        return res
          .status(response.status)
          .json({
            error:
              "IGDB search failed.",
          });
      }

      const data =
        await response.json();

     const results =
  Array.isArray(data)
    ? data.map(
        (game: any) => {
          const developers =
            game.involved_companies
              ?.filter(
                (entry: any) =>
                  entry.developer,
              )
              ?.map(
                (entry: any) =>
                  entry.company?.name,
              )
              ?.filter(Boolean) ?? [];

          const publishers =
            game.involved_companies
              ?.filter(
                (entry: any) =>
                  entry.publisher,
              )
              ?.map(
                (entry: any) =>
                  entry.company?.name,
              )
              ?.filter(Boolean) ?? [];

          return {
            externalId:
              game.id,

            title:
              game.name ?? "",

            year:
              game.first_release_date
                ? new Date(
                    game.first_release_date *
                      1000,
                  ).getFullYear()
                : null,

            releaseDate:
              game.first_release_date
                ? new Date(
                    game.first_release_date *
                      1000,
                  )
                    .toISOString()
                    .slice(0, 10)
                : null,

            description:
              game.summary ?? "",

            storyline:
              game.storyline ?? "",

            genres:
              game.genres?.map(
                (genre: any) =>
                  genre.name,
              ) ?? [],

            platforms:
              game.platforms?.map(
                (platform: any) =>
                  platform.name,
              ) ?? [],

            developers,

            publishers,

            rating:
              typeof game.rating ===
              "number"
                ? game.rating
                : null,

            ratingCount:
              typeof game.rating_count ===
              "number"
                ? game.rating_count
                : 0,

            gameModes:
              game.game_modes?.map(
                (mode: any) =>
                  mode.name,
              ) ?? [],

            playerPerspectives:
              game.player_perspectives?.map(
                (perspective: any) =>
                  perspective.name,
              ) ?? [],

            themes:
              game.themes?.map(
                (theme: any) =>
                  theme.name,
              ) ?? [],

            slug:
              game.slug ?? null,

            coverImage:
              game.cover?.image_id
                ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
                : null,

            screenshots:
              game.screenshots
                ?.filter(
                  (screenshot: any) =>
                    screenshot.image_id,
                )
                ?.slice(0, 4)
                ?.map(
                  (screenshot: any) => ({
                    imageId:
                      screenshot.image_id,

                    width:
                      screenshot.width ??
                      null,

                    height:
                      screenshot.height ??
                      null,

                    url:
                      `https://images.igdb.com/igdb/image/upload/t_screenshot_huge/${screenshot.image_id}.jpg`,
                  }),
                ) ?? [],

            videos:
              game.videos
                ?.filter(
                  (video: any) =>
                    video.video_id,
                )
                ?.slice(0, 2)
                ?.map(
                  (video: any) => ({
                    name:
                      video.name ?? "",

                    videoId:
                      video.video_id,

                    provider:
                      "youtube",

                    url:
                      `https://www.youtube.com/watch?v=${video.video_id}`,
                  }),
                ) ?? [],
          };
        },
      )
    : [];

      return res.json({
        source: "igdb",
        results,
      });
    } catch (error) {
      console.error(
        "Unexpected IGDB search error:",
        error,
      );

      return res.status(500).json({
        error:
          "Unexpected server error.",
      });
    }
  },
);



/**
 * Get detailed TMDB movie information.
 *
 * Example:
 * GET /api/media/movie/550
 */
app.get("/api/media/movie/:id", async (req, res) => {
  try {
    const movieId = req.params.id;

    if (!TMDB_ACCESS_TOKEN) {
      return res.status(500).json({
        error: "TMDB_ACCESS_TOKEN is not configured.",
      });
    }

    const url = new URL(
      `https://api.themoviedb.org/3/movie/${encodeURIComponent(
        movieId,
      )}`,
    );

    url.searchParams.set("language", "en-US");
    url.searchParams.set(
      "append_to_response",
      "credits,videos,images",
    );

    url.searchParams.set(
      "include_image_language",
      "en,null",
    );

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
        accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "TMDB detail lookup failed:",
        response.status,
        errorText,
      );

      return res.status(response.status).json({
        error: "TMDB detail lookup failed.",
      });
    }

    const movie = await response.json();

    const directors =
      movie.credits?.crew
        ?.filter(
          (person: any) =>
            person.job === "Director",
        )
        ?.map(
          (person: any) => person.name,
        ) ?? [];

    const cast =
      movie.credits?.cast
        ?.slice(0, 10)
        ?.map(
          (person: any) => person.name,
        ) ?? [];

    const genres =
      movie.genres?.map(
        (genre: any) => genre.name,
      ) ?? [];

    return res.json({
      source: "tmdb",

      externalId: movie.id,

      title:
        movie.title ??
        movie.original_title ??
        "",

      originalTitle:
        movie.original_title ?? "",

      year: movie.release_date
        ? Number(
            movie.release_date.slice(0, 4),
          )
        : null,

      releaseDate:
        movie.release_date ?? null,

      description:
        movie.overview ?? "",

      runtime:
        movie.runtime ?? null,

      rating:
        typeof movie.vote_average === "number"
          ? movie.vote_average
          : null,

      genres,

      posterImage: movie.poster_path
        ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
        : null,

      backdropImage:
        movie.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
          : null,

      directors,

      cast,

      productionCompanies:
        movie.production_companies?.map(
          (company: any) => company.name,
        ) ?? [],

      countries:
        movie.production_countries?.map(
          (country: any) =>
            country.name,
        ) ?? [],

      languages:
        movie.spoken_languages?.map(
          (language: any) =>
            language.english_name ??
            language.name,
        ) ?? [],

    videos:
  movie.videos?.results
    ?.filter(
      (video: any) =>
        video.site === "YouTube" &&
        Boolean(video.key),
    )
    ?.slice(0, 10)
    ?.map((video: any) => ({
      name: video.name ?? "Movie Video",

      videoId: video.key,

      provider: "youtube",

      type: video.type,

      url:
        `https://www.youtube.com/watch?v=${video.key}`,
    })) ?? [],

      images: {
        posters:
          movie.images?.posters?.slice(0, 10)
            ?.map((image: any) => ({
              filePath:
                image.file_path,
              width: image.width,
              height: image.height,
              url: `https://image.tmdb.org/t/p/w780${image.file_path}`,
            })) ?? [],

        backdrops:
          movie.images?.backdrops
            ?.slice(0, 10)
            ?.map((image: any) => ({
              filePath:
                image.file_path,
              width: image.width,
              height: image.height,
              url: `https://image.tmdb.org/t/p/w1280${image.file_path}`,
            })) ?? [],

        logos:
          movie.images?.logos
            ?.slice(0, 10)
            ?.map((image: any) => ({
              filePath:
                image.file_path,
              width: image.width,
              height: image.height,
              url: `https://image.tmdb.org/t/p/w500${image.file_path}`,
            })) ?? [],
      },

      credits: {
        directors,
        cast,
      },
    });
  } catch (error) {
    console.error(
      "Unexpected TMDB detail error:",
      error,
    );

    return res.status(500).json({
      error: "Unexpected server error.",
    });
  }
});


app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `MediaLibrary API running on port ${PORT}`,
  );
});