
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

interface PublicProfile {
  user_id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_path: string | null
  top_movies: string[]
  top_games: string[]
}

interface PublicMedia {
  id: string
  title: string
  type: string
  format: string
  year: number
  genre: string
  cover_image: string | null
  favorite: boolean
  personal_rating: number | null
  personal_review: string | null
  external_id: string | null
  source: string | null
}

interface PublicProfilePageProps {
  collectorId: string
  onBack: () => void
}

function PublicProfilePage({
  collectorId,
  onBack,
}: PublicProfilePageProps) {
  const [profile, setProfile] =
    useState<PublicProfile | null>(null)

  const [media, setMedia] =
    useState<PublicMedia[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [collectionType, setCollectionType] =
  useState<'movie' | 'game'>('movie')

const [collectionDisplay, setCollectionDisplay] =
  useState<'covers' | 'list'>('covers')

  useEffect(() => {
    let cancelled = false

    const loadPublicProfile = async () => {
      setLoading(true)
      setError('')
      setProfile(null)
      setMedia([])

      const [profileResult, mediaResult] =
        await Promise.all([
          supabase.rpc('get_public_profile', {
            collector_id: collectorId,
          }),
          supabase.rpc('get_public_collection', {
            collector_id: collectorId,
          }),
        ])

      if (cancelled) return

      if (profileResult.error || mediaResult.error) {
        console.error(
          'Public profile load failed:',
          profileResult.error,
          mediaResult.error
        )

        setError('Unable to load this profile.')
        setLoading(false)
        return
      }

      const publicProfile =
        profileResult.data?.[0] ?? null

      if (!publicProfile) {
        setError(
          'This profile is private or unavailable.'
        )
        setLoading(false)
        return
      }

      setProfile(publicProfile)
      setMedia(mediaResult.data ?? [])
      setLoading(false)
    }

    void loadPublicProfile()

    return () => {
      cancelled = true
    }
  }, [collectorId])

  const movies = useMemo(
    () => media.filter((item) => item.type === 'movie'),
    [media]
  )

  const games = useMemo(
    () => media.filter((item) => item.type === 'game'),
    [media]
  )

  const totalReviews = useMemo(
    () =>
      media.filter(
        (item) =>
          typeof item.personal_review === 'string' &&
          item.personal_review.trim().length > 0
      ).length,
    [media]
  )

  const topMovies = useMemo(
    () =>
      (profile?.top_movies ?? [])
        .map((id) => movies.find((item) => item.id === id))
        .filter((item): item is PublicMedia => Boolean(item)),
    [profile, movies]
  )

  const topGames = useMemo(
    () =>
      (profile?.top_games ?? [])
        .map((id) => games.find((item) => item.id === id))
        .filter((item): item is PublicMedia => Boolean(item)),
    [profile, games]
  )

  const renderMediaGrid = (items: PublicMedia[]) => (
    <div className="public-media-grid">
      {items.map((item) => (
        <div className="public-media-card" key={item.id}>
          <div className="public-media-art">
            {item.cover_image ? (
              <img src={item.cover_image} alt={item.title} />
            ) : (
              <span>{item.title}</span>
            )}
          </div>

          <strong>{item.title}</strong>
          <small>
            {item.year} · {item.format}
          </small>
        </div>
      ))}
    </div>
  )

  
/* =====================================================
   PUBLIC PROFILE - COMPACT COLLECTION
   ===================================================== */

const collectionItems = (
  collectionType === 'movie' ? movies : games
).slice().sort((a, b) =>
  a.title.localeCompare(b.title)
)

const renderCompactCollection = () => (
  <div className="public-collection-scroll">
    {collectionDisplay === 'covers' ? (
      <div className="public-collection-grid">
        {collectionItems.map((item) => (
          <div
            key={item.id}
            className="public-collection-item"
            title={item.title}
          >
            <div className="public-collection-art">
              {item.cover_image ? (
                <img
                  src={item.cover_image}
                  alt={item.title}
                  loading="lazy"
                />
              ) : (
                <span>{item.title}</span>
              )}
            </div>

            <strong>{item.title}</strong>

            <small>
              {item.year} · {item.format}
            </small>
          </div>
        ))}
      </div>
    ) : (
      <div className="public-collection-list">
        {collectionItems.map((item) => (
          <div
            key={item.id}
            className="public-collection-list-item"
          >
            <strong>{item.title}</strong>

            <span>
              {item.year} · {item.format}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
)


  if (loading) {
    return (
      <div className="profile-page">
        Loading collector profile...
      </div>
    )
  }

  if (error || !profile) {
    return (
      <section className="profile-page">
        <button type="button" onClick={onBack}>
          ← Back to Collectors
        </button>
        <p>{error || 'Profile unavailable.'}</p>
      </section>
    )
  }

  const displayName =
    profile.display_name || profile.username

  return (
    <section className="profile-page public-profile-page">
      <button
        type="button"
        className="public-profile-back"
        onClick={onBack}
      >
        ← Back to Collectors
      </button>

      <div className="profile-hero">
        <div className="profile-avatar">
          {displayName.charAt(0).toUpperCase()}
        </div>

        <div className="profile-identity">
          <span className="profile-eyebrow">
            MEDIAVAULT COLLECTOR
          </span>

          <h1>{displayName}</h1>

          <span className="profile-username">
            @{profile.username}
          </span>

          <p>{profile.bio || 'No bio added yet.'}</p>
        </div>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span>TOTAL TITLES</span>
          <strong>{media.length}</strong>
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
          <span>TOTAL REVIEWS</span>
          <strong>{totalReviews}</strong>
        </div>
      </div>

      <div className="profile-favorites-section">
        <div className="profile-section-heading">
          <h2>Top 5 Movies</h2>
        </div>
        {renderMediaGrid(topMovies)}
      </div>

      <div className="profile-favorites-section">
        <div className="profile-section-heading">
          <h2>Top 5 Games</h2>
        </div>
        {renderMediaGrid(topGames)}
      </div>

    
{/* =====================================================
    PUBLIC COLLECTION BROWSER
    ===================================================== */}

<div className="public-collection-section">

  <div className="public-collection-header">
    <div>
      <h2>Collection</h2>
      <p>
        Browse this collector's complete archive
      </p>
    </div>

    <div className="public-collection-controls">

      {/* MOVIES / GAMES */}

      <div className="public-collection-toggle">
        <button
          type="button"
          className={
            collectionType === 'movie'
              ? 'active'
              : ''
          }
          onClick={() =>
            setCollectionType('movie')
          }
        >
          Movies ({movies.length})
        </button>

        <button
          type="button"
          className={
            collectionType === 'game'
              ? 'active'
              : ''
          }
          onClick={() =>
            setCollectionType('game')
          }
        >
          Games ({games.length})
        </button>
      </div>

      {/* COVERS / LIST */}

      <div className="public-collection-toggle">
        <button
          type="button"
          className={
            collectionDisplay === 'covers'
              ? 'active'
              : ''
          }
          onClick={() =>
            setCollectionDisplay('covers')
          }
        >
          Covers
        </button>

        <button
          type="button"
          className={
            collectionDisplay === 'list'
              ? 'active'
              : ''
          }
          onClick={() =>
            setCollectionDisplay('list')
          }
        >
          List
        </button>
      </div>

    </div>
  </div>

  {renderCompactCollection()}

</div>

    </section>
  )
}

export default PublicProfilePage
