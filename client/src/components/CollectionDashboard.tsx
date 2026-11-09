import CollageArtwork from './CollageArtwork'
import { useEffect, useState } from 'react'
import type { MediaItem } from '../data/sampleMedia'

import DiagonalArchiveArtwork from './DiagonalArchiveArtwork'

import RecentReviews from './RecentReviews'
import CollectionOverview from './CollectionOverview'



type FavoriteCategory =
  | 'movie'
  | 'game'
  | 'music'
  | 'book'

const FAVORITE_CATEGORIES: FavoriteCategory[] = [
  'movie',
  'game',
  'music',
  'book',
]

const FAVORITE_LABELS: Record<
  FavoriteCategory,
  string
> = {
  movie: 'Movies',
  game: 'Games',
  music: 'Music',
  book: 'Books',
}


interface CollectionDashboardProps {
  recentlyAdded: MediaItem[]
  movies: MediaItem[]
  games: MediaItem[]
  books: MediaItem[]
  music: MediaItem[]
  favorites: MediaItem[]
  dashboardLayout: 'standard' | 'compact'
  onSelect: (media: MediaItem) => void
  onViewChange: (
    view: 'movies' | 'games' | 'books' | 'music' | 'favorites'
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

  
// Books
hardcover: 'Hardcover',
paperback: 'Paperback',
' mass market paperback': 'Mass Market Paperback',
ebook: 'eBook',
audiobook: 'Audiobook',
'special edition': 'Special Edition',

// Music
vinyl: 'Vinyl',
cd: 'CD',
cassette: 'Cassette',
digital: 'Digital',
'8-track': '8-Track',
minidisc: 'MiniDisc',

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


/* =====================================================
   BUILD DECORATIVE BROWSE COLLAGE
   ===================================================== */


/* =====================================================
   BUILD STABLE BROWSE COLLAGE
   ===================================================== */

function buildCollageItems(
  items: MediaItem[],
  count = 35
): MediaItem[] {
  if (items.length === 0) {
    return []
  }

  if (items.length >= count) {
    return items.slice(0, count)
  }

  return Array.from(
    { length: count },
    (_, index) => items[index % items.length]
  )
}



/* =====================================================
   ROTATION - PREVENT CONSECUTIVE DUPLICATES
   ===================================================== */

function getNextMediaSelection(
  items: MediaItem[],
  previousItems: MediaItem[],
  count: number
): MediaItem[] {

  if (items.length === 0) {
    return []
  }

  const previousIds = new Set(
    previousItems.map((item) => item.id)
  )

  // Prioritize titles that were not
  // displayed in the previous rotation.

  const availableItems = items.filter(
    (item) => !previousIds.has(item.id)
  )

  const shuffledAvailable =
    shuffleMedia(availableItems)

  // If enough new titles exist,
  // avoid all previous entries.

  if (shuffledAvailable.length >= count) {
    return shuffledAvailable.slice(0, count)
  }

  // For smaller collections, reuse previous
  // entries only when necessary.

  const remainingCount =
    count - shuffledAvailable.length

  const previousPool = items.filter(
    (item) => previousIds.has(item.id)
  )

  return [
    ...shuffledAvailable,
    ...shuffleMedia(previousPool).slice(
      0,
      remainingCount
    )
  ]
}


function CollectionDashboard({
  recentlyAdded,
  movies,
  games,
  books,
  music,
  favorites,
  onSelect,
  onViewChange,
  dashboardLayout,
}: CollectionDashboardProps) {


  
/* =====================================================
   ACTIVE MEDIA CATEGORIES
   ===================================================== */

const activeCategoryCount = [
  movies.length > 0,
  games.length > 0,
  music.length > 0,
  books.length > 0,
].filter(Boolean).length




/* =====================================================
   DASHBOARD - ROTATING ARTWORK
   ===================================================== */

const ROTATION_INTERVAL = 30000
const FADE_DURATION = 1200

const [rotationIndex, setRotationIndex] = useState(0)

const [isTransitioning, setIsTransitioning] =
  useState(false)

const [randomMovies, setRandomMovies] =
  useState<MediaItem[]>(() =>
    shuffleMedia(movies).slice(0, 25)
  )

const [randomGames, setRandomGames] =
  useState<MediaItem[]>(() =>
    shuffleMedia(games).slice(0, 25)
  )

  const [randomBooks, setRandomBooks] =
  useState<MediaItem[]>(() =>
    shuffleMedia(books).slice(0, 25)
  )

const [randomMusic, setRandomMusic] =
  useState<MediaItem[]>(() =>
    shuffleMedia(music).slice(0, 25)
  )



/* =====================================================
   FAVORITES - CATEGORY ROTATION
   ===================================================== */

const [favoriteCategoryIndex, setFavoriteCategoryIndex] =
  useState(0)

const [favoriteShuffleIndex, setFavoriteShuffleIndex] =
  useState(0)

const availableFavoriteCategories =
  FAVORITE_CATEGORIES.filter((category) =>
    favorites.some((item) => item.type === category)
  )

const activeFavoriteCategory =
  availableFavoriteCategories.length > 0
    ? availableFavoriteCategories[
        favoriteCategoryIndex %
          availableFavoriteCategories.length
      ]
    : undefined


const [favoritePreview, setFavoritePreview] =
  useState<MediaItem[]>([])

useEffect(() => {
  if (!activeFavoriteCategory) {
    setFavoritePreview([])
    return
  }

  const categoryFavorites = favorites.filter(
    (item) => item.type === activeFavoriteCategory
  )

  const count =
    activeFavoriteCategory === 'music' ? 5 : 6

  setFavoritePreview(
    shuffleMedia(categoryFavorites).slice(0, count)
  )
}, [
  activeFavoriteCategory,
  favoriteShuffleIndex,
  favorites,
])




/* =====================================================
   ROTATION TIMER
   ===================================================== */

useEffect(() => {
  const interval = window.setInterval(() => {
    setRotationIndex((current) => current + 1)
  }, ROTATION_INTERVAL)

  return () => {
    window.clearInterval(interval)
  }
}, [])

/* =====================================================
   ROTATE ARTWORK WITH FADE
   ===================================================== */


/* =====================================================
   ROTATE ARTWORK WITH SMOOTH FADE
   ===================================================== */

useEffect(() => {
  if (rotationIndex === 0) return

  // Stage 1: Fade out existing artwork
  setIsTransitioning(true)

  const swapTimeout = window.setTimeout(() => {
    // Stage 2: Replace the artwork
  
/* Movies - four unique selections */


setRandomMovies((previous) =>
  getNextMediaSelection(movies, previous, 25)
)

setRandomGames((previous) =>
  getNextMediaSelection(games, previous, 25)
)

setRandomMusic((previous) =>
  getNextMediaSelection(music, previous, 25)
)

setRandomBooks((previous) =>
  getNextMediaSelection(books, previous, 25

  )
)

/* Favorites - six unique selections */

setFavoriteCategoryIndex((current) => current + 1)
setFavoriteShuffleIndex((current) => current + 1)

    // Stage 3: Wait for the new images to render
    // before starting the fade-in.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsTransitioning(false)
      })
    })
  }, FADE_DURATION)

  return () => {
    window.clearTimeout(swapTimeout)
  }
}, [rotationIndex, movies, games, books, music, favorites])


/* =====================================================
   UPDATE ARTWORK WHEN COLLECTION CHANGES
   ===================================================== */


useEffect(() => {
  setRandomMovies(
    shuffleMedia(movies).slice(0, 25)
  )

  setRandomGames(
    shuffleMedia(games).slice(0, 25)
  )

  setRandomMusic(
    shuffleMedia(music).slice(0, 25)
  )

  setRandomBooks(
    shuffleMedia(books).slice(0, 25)
  )

 
}, [movies, games, books, music])



  return (
    <div className="collection-dashboard">
      {/* =================================================
          INTRO
          ================================================= */}

<section className="dashboard-intro dashboard-intro-compact">
  <div className="dashboard-intro-heading">
    <h1>The Collection</h1>
    <p className="dashboard-intro-subtitle">
      Browse the Archives
    </p>
  </div>

  <div className="dashboard-summary">
    <div className="dashboard-summary-stat">
      <strong>
        {movies.length + games.length + books.length + music.length}
      </strong>
      <span>Total Titles</span>
    </div>
  </div>
</section>

      
      {/* =================================================
          MOVIES / GAMES
          ================================================= */}

<section className="dashboard-section dashboard-archives-section">

  <p style={{ color: '#ffffff', fontSize: '14px' }}>
  Current dashboard layout: {dashboardLayout}
</p>

<div
  className={`dashboard-category-grid category-count-${activeCategoryCount} ${
    dashboardLayout === 'compact'
      ? 'dashboard-category-grid-compact'
      : ''
  }`}
>
       
{/* =================================================
    MOVIE ARCHIVE
    ================================================= */}

{movies.length > 0 && (
  <button
    type="button"
    className="dashboard-category-card dashboard-category-movies"
    onClick={() => onViewChange('movies')}
  >
    <DiagonalArchiveArtwork
      items={randomMovies}
      type="movie"
      isTransitioning={isTransitioning}
    />

    <div className="category-overlay" />

    <div className="category-content">
      <strong>Movies</strong>
      <em>View Shelf →</em>
    </div>
  </button>
)}


{/* =================================================
    GAME ARCHIVE
    ================================================= */}


{games.length > 0 && (
  <button
    type="button"
    className="dashboard-category-card dashboard-category-games"
    onClick={() => onViewChange('games')}
  >
    <DiagonalArchiveArtwork
      items={randomGames}
      type="game"
      isTransitioning={isTransitioning}
    />

    <div className="category-overlay" />

    <div className="category-content">
      <strong>Games</strong>
      <em>View Shelf →</em>
    </div>
  </button>
)}




{/* =================================================
    MUSIC ARCHIVE
    ================================================= */}
{music.length > 0 && (

<button
  type="button"
  className="dashboard-category-card dashboard-category-music"
  onClick={() => onViewChange('music')}
>
  <div
    className={`category-art category-art-diagonal ${
      isTransitioning ? 'artwork-fading' : ''
    }`}
  >
{buildCollageItems(randomMusic, 32).map((item, index) => {
      const artwork = getArtwork(item)

      return (
        <div
key={`${item.id}-${index}`}
          className="category-art-item category-diagonal-item"
        >
       <CollageArtwork
  src={artwork}
  title={item.title}
  className="category-music-poster"
/>
        </div>
      )
    })}
  </div>

  <div className="category-overlay" />

  <div className="category-content">
    <strong>Music</strong>
    <em>View Shelf →</em>
  </div>
</button>
  )}

{/* =================================================
    BOOK ARCHIVE
    ================================================= */}
{books.length > 0 && (

<button
  type="button"
  className="dashboard-category-card dashboard-category-books"
  onClick={() => onViewChange('books')}
>
  <div
    className={`category-art category-art-diagonal ${
      isTransitioning ? 'artwork-fading' : ''
    }`}
  >
{buildCollageItems(randomBooks).map((item, index) => {
  const artwork = getArtwork(item)

      return (
        <div
key={`${item.id}-${index}`}
          className="category-art-item category-diagonal-item"
        >
          {artwork ? (
            <img
              src={artwork}
              alt=""
              className="category-book-poster"
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
    <strong>Books</strong>
    <em>View shelf →</em>
  </div>
</button>

       )}   
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
className={`recent-media-card recent-media-card-${item.type}`}
          onClick={() => onSelect(item)}
        >
          <div className="recent-media-art">
            {artwork ? (
              
<img
  src={artwork}
  alt=""
  className={`recent-media-image recent-media-image-${item.type}`}
  loading="lazy"
/>

            ) : (
              <>
              <span className="recent-art-type">
  {{
    movie: 'FILM',
    game: 'GAME',
    book: 'BOOK',
    music: 'MUSIC',
  }[item.type]}
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
  {{
    movie: 'Movie',
    game: 'Game',
    book: 'Book',
    music: 'Music',
  }[item.type]}
  {' · '}
  {item.genre}
  {' · '}
  {formatLabels[item.format.toLowerCase()] ??
    item.format}
  {' · '}
  {item.year}
</span>

          </div>
        </button>
      )
    })}
  </div>
</section>

      

{/* =================================================
    RECENT REVIEWS
    ================================================= */}

<RecentReviews
  items={[...movies, ...games, ...books, ...music]}
  onSelect={onSelect}
/>


{/* =================================================
          FAVORITES
          ================================================= */}

{availableFavoriteCategories.length > 0 && (
          <section className="dashboard-section">
    

<div className="dashboard-section-header favorites-section-header">
  <div className="favorites-heading">
    <h2>Favorites</h2>

    <div
      className="favorites-category-tabs"
      role="group"
      aria-label="Favorite media categories"
    >
      {FAVORITE_CATEGORIES.map((category) => {
        const isAvailable =
          availableFavoriteCategories.includes(category)

        if (!isAvailable) return null

        return (
          <button
            key={category}
            type="button"
            className={`favorites-category-tab ${
              activeFavoriteCategory === category
                ? 'active'
                : ''
            }`}
            onClick={() => {
              setFavoriteCategoryIndex(
                availableFavoriteCategories.indexOf(category)
              )

              setFavoriteShuffleIndex(
                (current) => current + 1
              )
            }}
            aria-pressed={
              activeFavoriteCategory === category
            }
          >
            {FAVORITE_LABELS[category]}
          </button>
        )
      })}
    </div>
  </div>

  <button
    type="button"
    className="dashboard-text-button"
    onClick={() => onViewChange('favorites')}
  >
    View all →
  </button>
</div>



<div
  className={`favorite-grid ${
    activeFavoriteCategory === 'music'
      ? 'favorite-grid-music'
      : ''
  } ${
    isTransitioning ? 'artwork-fading' : ''
  }`}
>         {favoritePreview.map(
              (item) => {
                const artwork =
                  getArtwork(item)

                return (
                  <button
                    key={item.id}
                    type="button"
className={`favorite-card ${
  item.type === 'music' ? 'favorite-card-music' : ''
}`}
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
          COLLECTION OVERVIEW
          ================================================= */}

      
<CollectionOverview
  movies={movies}
  games={games}
  books={books}
  music={music}
  favorites={favorites}
/>

    </div>
  )
}

export default CollectionDashboard
