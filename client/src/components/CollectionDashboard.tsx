import { useMemo } from 'react'

import type { MediaItem } from '../data/sampleMedia'

import RecentReviews from './RecentReviews'

interface CollectionDashboardProps {
  recentlyAdded: MediaItem[]
  movies: MediaItem[]
  games: MediaItem[]
  favorites: MediaItem[]
  onSelect: (media: MediaItem) => void
  onViewChange: (
    view: 'movies' | 'games' | 'favorites',
  ) => void
}

const formatLabels: Record<string, string> = {
  vhs: 'VHS',
  dvd: 'DVD',
  bluray: 'Blu-ray',
  laserdisc: 'LaserDisc',
  nes: 'NES',
  ps1: 'PlayStation',
  xbox360: 'Xbox 360',
}

function getArtwork(media: MediaItem) {
  return media.coverImage ?? media.spineImage
}

function shuffleMedia(items: MediaItem[]): MediaItem[] {
  const shuffled = [...items]

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))

    ;[shuffled[i], shuffled[j]] = [
      shuffled[j],
      shuffled[i],
    ]
  }

  return shuffled
}

function CollectionDashboard({
  recentlyAdded,
  movies,
  games,
  favorites,
  onSelect,
  onViewChange,
}: CollectionDashboardProps) {
  const formatCounts = new Map<
    string,
    number
  >()

  ;[
    ...movies,
    ...games,
  ].forEach((item) => {
    formatCounts.set(
      item.format,
      (formatCounts.get(item.format) ?? 0) + 1,
    )
  })

const randomMovies = useMemo(
  () => shuffleMedia(movies).slice(0, 5),
  [movies],
)

const randomGames = useMemo(
  () => shuffleMedia(games).slice(0, 5),
  [games],
)

const favoritePreview = useMemo(
  () => shuffleMedia(favorites).slice(0, 6),
  [favorites],
)

  return (
    <div className="collection-dashboard">
      {/* =================================================
          INTRO
          ================================================= */}
<section className="dashboard-intro dashboard-intro-compact">
  <div className="dashboard-intro-heading">
    <h1>The Collection</h1>
    <p>Your Movies, Games, and Entertainment </p>
  </div>

  <div className="dashboard-summary">
    <div className="dashboard-summary-stat">
      <strong>{movies.length + games.length}</strong>
      <span>Total Titles</span>
    </div>

  
  </div>
</section>
      
      {/* =================================================
          MOVIES / GAMES
          ================================================= */}

      <section className="dashboard-section dashboard-archives-section">
  <div className="dashboard-section-header">
    <div>
      <h2>Browse the Archives</h2>
    </div>
  </div>

        <div className="dashboard-category-grid">
          <button
            type="button"
            className="dashboard-category-card dashboard-category-movies"
            onClick={() =>
              onViewChange('movies')
            }
          >
            <div className="category-art">
              {randomMovies.map((item) => {
                  const artwork =
                    getArtwork(item)

                  return (
                  <div
  key={item.id}
  className="category-art-item"
>
  {artwork ? (
    <img
      src={artwork}
      alt=""
      className="category-movie-poster"
      loading="lazy"
    />
  ) : (
    <span>{item.title}</span>
  )}
</div>
                  )
                })}
            </div>

            <div className="category-overlay" />

            <div className="category-content">

              <strong>Movies</strong>

              <small>
                {movies.length} titles
              </small>

              <em>
                Browse shelf →
              </em>
            </div>
          </button>

          <button
            type="button"
            className="dashboard-category-card dashboard-category-games"
            onClick={() =>
              onViewChange('games')
            }
          >
            <div className="category-art">
             {randomGames.map((item) => {
                  const artwork =
                    getArtwork(item)

                  return (
                    <div
                      key={item.id}
                      className="category-art-item"
                      style={
                        artwork
                          ? {
                              backgroundImage:
                                `url("${artwork}")`,
                            }
                          : undefined
                      }
                    >
                      {!artwork && (
                        <span>
                          {item.title}
                        </span>
                      )}
                    </div>
                  )
                })}
            </div>

            <div className="category-overlay" />

            <div className="category-content">

              <strong>Games</strong>

              <small>
                {games.length} titles
              </small>

              <em>
                Browse shelf →
              </em>
            </div>
          </button>
        </div>
      </section>


      {/* =================================================
    RECENTLY ADDED
    ================================================= */}

<section className="dashboard-section">
  <div className="dashboard-section-header">
    <div>
      <h2>Recently Added</h2>
    </div>
  </div>

  <div className="recent-media-track">
{recentlyAdded.slice(0, 15).map((item) => {
        const artwork = getArtwork(item)

      return (
        <button
          key={item.id}
          type="button"
          className="recent-media-card"
          onClick={() => onSelect(item)}
        >
          <div className="recent-media-art">
            {artwork ? (
              <img
                src={artwork}
                alt=""
                className="recent-media-image"
              />
            ) : (
              <>
                <span className="recent-art-type">
                  {item.type === 'movie'
                    ? 'FILM'
                    : 'GAME'}
                </span>

                <strong>
                  {item.title}
                </strong>
              </>
            )}
          </div>

          <div className="recent-media-info">
            <strong>
              {item.title}
            </strong>

            <span>
              {item.type === 'movie'
                ? 'Movie'
                : 'Game'}{' '}
              · {item.genre} ·{' '}
              {formatLabels[item.format] ??
                item.format}{' '}
              · {item.year}
            </span>
          </div>
        </button>
      )
    })}
  </div>
</section>

      {/* =================================================
          FAVORITES
          ================================================= */}

      {favoritePreview.length > 0 && (
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <h2>Favorites</h2>
            </div>

            <button
              type="button"
              className="dashboard-text-button"
              onClick={() =>
                onViewChange('favorites')
              }
            >
              View all →
            </button>
          </div>

          <div className="favorite-grid">
            {favoritePreview.map(
              (item) => {
                const artwork =
                  getArtwork(item)

                return (
                  <button
                    key={item.id}
                    type="button"
                    className="favorite-card"
                    onClick={() =>
                      onSelect(item)
                    }
                  >
                    <div className="favorite-art">
  {artwork ? (
    <img
      src={artwork}
      alt={item.title}
      className="favorite-image"
    />
  ) : (
    <span>
      {item.title}
    </span>
  )}
</div>

                    <div>
                      <strong>
                        {item.title}
                      </strong>

                      <small>
                        {item.year} ·{' '}
                        {formatLabels[
                          item.format
                        ] ??
                          item.format}
                      </small>
                    </div>
                  </button>
                )
              },
            )}
          </div>
        </section>
      )}

{/* =================================================
    RECENT REVIEWS
    ================================================= */}

<RecentReviews
  items={[...movies, ...games]}
  onSelect={onSelect}
/>
      

      {/* =================================================
          COLLECTION OVERVIEW
          ================================================= */}

      <section className="dashboard-overview">
        <div className="overview-heading">
          <h2>Overview</h2>
        </div>

        <div className="overview-stats">
          <div>
            <span>Movies</span>
            <strong>
              {movies.length}
            </strong>
          </div>

          <div>
            <span>Games</span>
            <strong>
              {games.length}
            </strong>
          </div>

          <div>
            <span>Favorites</span>
            <strong>
              {favorites.length}
            </strong>
          </div>

          <div>
            <span>Formats</span>
            <strong>
              {formatCounts.size}
            </strong>
          </div>
        </div>

        <div className="overview-formats">
          {Array.from(
            formatCounts.entries(),
          ).map(
            ([format, count]) => (
              <div key={format}>
                <span>
                  {formatLabels[format] ??
                    format}
                </span>

                <strong>
                  {count}
                </strong>
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  )
}

export default CollectionDashboard