
import { useMemo } from 'react'
import type { MediaItem } from '../data/sampleMedia'

interface ProfilePageProps {
  userEmail: string
  collection: MediaItem[]
  onSignOut: () => void
  onSelectMedia: (item: MediaItem) => void
}

function ProfilePage({
  userEmail,
  collection,
  onSignOut,
  onSelectMedia,
}: ProfilePageProps) {
  const movies = useMemo(
    () => collection.filter((item) => item.type === 'movie'),
    [collection],
  )

  const games = useMemo(
    () => collection.filter((item) => item.type === 'game'),
    [collection],
  )

  const mostOwnedFormat = useMemo(() => {
    const counts = new Map<string, number>()

    collection.forEach((item) => {
      const formats = item.formats?.length
        ? item.formats
        : [item.format]

      new Set(formats).forEach((format) => {
        counts.set(
          format,
          (counts.get(format) ?? 0) + 1,
        )
      })
    })

    const sorted = [...counts.entries()].sort(
      (a, b) => b[1] - a[1],
    )

    return sorted[0]?.[0] ?? 'None yet'
  }, [collection])

  // Temporary previews until manual Top 5 selection is added.
  const topMovies = useMemo(
    () => movies.filter((item) => item.favorite).slice(0, 5),
    [movies],
  )

  const topGames = useMemo(
    () => games.filter((item) => item.favorite).slice(0, 5),
    [games],
  )

  const displayName =
    userEmail.split('@')[0] || 'Collector'

  const renderTopFive = (
    items: MediaItem[],
    type: 'movies' | 'games',
  ) => (
    <div className="profile-top-five-grid">
      {Array.from({ length: 5 }, (_, index) => {
        const item = items[index]

        return item ? (
          <button
            key={item.id}
            type="button"
            className="profile-top-five-item"
            onClick={() => onSelectMedia(item)}
            title={item.title}
          >
            <div className="profile-top-five-cover">
              {item.coverImage ? (
                <img
                  src={item.coverImage}
                  alt={item.title}
                />
              ) : (
                <span>{item.title}</span>
              )}
            </div>

            <span className="profile-top-five-title">
              {item.title}
            </span>
          </button>
        ) : (
          <div
            key={`${type}-empty-${index}`}
            className="profile-top-five-empty"
          >
            <span>#{index + 1}</span>
            <small>Not selected</small>
          </div>
        )
      })}
    </div>
  )

  return (
    <section className="profile-page">
      <div className="profile-hero">
        <div className="profile-avatar">
          {displayName.charAt(0).toUpperCase()}
        </div>

        <div className="profile-identity">
          <span className="profile-eyebrow">
            MEDIAVAULT PROFILE
          </span>

          <h1>{displayName}</h1>

          <p>
            Your personal collection of movies,
            games, and entertainment.
          </p>

          <span className="profile-email">
            {userEmail}
          </span>
        </div>

        <button
          type="button"
          className="profile-edit-button"
          disabled
          title="Profile editing will be added next"
        >
          Edit Profile
        </button>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span>TOTAL TITLES</span>
          <strong>{collection.length}</strong>
        </div>

        <div className="profile-stat">
          <span>MOVIES</span>
          <strong>{movies.length}</strong>
        </div>

        <div className="profile-stat">
          <span>GAMES</span>
          <strong>{games.length}</strong>
        </div>

        <div className="profile-stat">
          <span>MOST OWNED FORMAT</span>
          <strong>{mostOwnedFormat}</strong>
        </div>
      </div>

      <div className="profile-favorites-section">
        <div className="profile-section-heading">
          <h2>Top 5 Movies</h2>
          <span>Your personal picks</span>
        </div>

        {renderTopFive(topMovies, 'movies')}
      </div>

      <div className="profile-favorites-section">
        <div className="profile-section-heading">
          <h2>Top 5 Games</h2>
          <span>Your personal picks</span>
        </div>

        {renderTopFive(topGames, 'games')}
      </div>

      <div className="profile-footer">
        <span>
          Signed in as {userEmail}
        </span>

        <button
          type="button"
          className="profile-signout"
          onClick={onSignOut}
        >
          Sign Out
        </button>
      </div>
    </section>
  )
}

export default ProfilePage
