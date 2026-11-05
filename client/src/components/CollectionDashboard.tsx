import CollageArtwork from './CollageArtwork'
import { useEffect, useState } from 'react'
import type { MediaItem } from '../data/sampleMedia'

import DiagonalArchiveArtwork from './DiagonalArchiveArtwork'

import RecentReviews from './RecentReviews'

interface CollectionDashboardProps {
  recentlyAdded: MediaItem[]
  movies: MediaItem[]
  games: MediaItem[]
  books: MediaItem[]
  music: MediaItem[]
  favorites: MediaItem[]
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
}: CollectionDashboardProps) {
  const formatCounts = new Map<
    string,
    number
  >()

;[
  ...movies,
  ...games,
  ...books,
  ...music,
].forEach((item) => {
    formatCounts.set(
      item.format,
      (formatCounts.get(item.format) ?? 0) + 1,
    )
  })


/* =====================================================
   DASHBOARD - ROTATING ARTWORK
   ===================================================== */

const ROTATION_INTERVAL = 35000
const FADE_DURATION = 1400

const [rotationIndex, setRotationIndex] = useState(0)

const [isTransitioning, setIsTransitioning] =
  useState(false)

const [randomMovies, setRandomMovies] =
  useState<MediaItem[]>(() =>
    shuffleMedia(movies).slice(0, 20)
  )

const [randomGames, setRandomGames] =
  useState<MediaItem[]>(() =>
    shuffleMedia(games).slice(0, 20)
  )

  const [randomBooks, setRandomBooks] =
  useState<MediaItem[]>(() =>
    shuffleMedia(books).slice(0, 20)
  )

const [randomMusic, setRandomMusic] =
  useState<MediaItem[]>(() =>
    shuffleMedia(music).slice(0, 20)
  )

const [favoritePreview, setFavoritePreview] =
  useState<MediaItem[]>(() =>
    shuffleMedia(favorites).slice(0, 6)
  )

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
  getNextMediaSelection(movies, previous, 20)
)

setRandomGames((previous) =>
  getNextMediaSelection(games, previous, 20)
)

setRandomMusic((previous) =>
  getNextMediaSelection(music, previous, 20)
)

setRandomBooks((previous) =>
  getNextMediaSelection(books, previous, 20

  )
)

/* Favorites - six unique selections */

setFavoritePreview((previous) =>
  getNextMediaSelection(
    favorites,
    previous,
    6
  )
)


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
    shuffleMedia(movies).slice(0, 20)
  )

  setRandomGames(
    shuffleMedia(games).slice(0, 20)
  )

  setRandomMusic(
    shuffleMedia(music).slice(0, 20)
  )

  setRandomBooks(
    shuffleMedia(books).slice(0, 20)
  )

  setFavoritePreview(
    shuffleMedia(favorites).slice(0, 6)
  )
}, [movies, games, books, music, favorites])



  return (
    <div className="collection-dashboard">
      {/* =================================================
          INTRO
          ================================================= */}
<section className="dashboard-intro dashboard-intro-compact">
  <div className="dashboard-intro-heading">
    <h1>The Collection</h1>
  </div>

  <div className="dashboard-summary">
    <div className="dashboard-summary-stat">
      <strong>{movies.length + games.length + books.length + music.length}</strong>
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
      <span>Browse the Archives</span>

    </div>
  </div>

        <div className="dashboard-category-grid">
       
{/* =================================================
    MOVIE ARCHIVE
    ================================================= */}

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
    <em>Browse shelf →</em>
  </div>
</button>

{/* =================================================
    GAME ARCHIVE
    ================================================= */}

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
    <em>Browse shelf →</em>
  </div>
</button>



{/* =================================================
    MUSIC ARCHIVE
    ================================================= */}

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
{randomMusic.map((item, index) => {
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
    <em>Browse shelf →</em>
  </div>
</button>

{/* =================================================
    BOOK ARCHIVE
    ================================================= */}

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
    <em>Browse shelf →</em>
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

<div
  className={`favorite-grid ${
    isTransitioning ? 'artwork-fading' : ''
  }`}
>            {favoritePreview.map(
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
  <span>Books</span>
  <strong>{books.length}</strong>
</div>

<div>
  <span>Music</span>
  <strong>{music.length}</strong>
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
{formatLabels[format.toLowerCase()] ?? format}
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
