
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


interface Friendship {
  id: string
  requester_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'declined'
}


/* =====================================================
   MEDIAVAULT - FORMAT DISPLAY NAMES
   ===================================================== */

const getFormatDisplayName = (format: string): string => {
  const labels: Record<string, string> = {
    vhs: 'VHS',
    dvd: 'DVD',
    bluray: 'Blu-ray',
    'blu-ray': 'Blu-ray',
    laserdisc: 'LaserDisc',

    nes: 'NES',
    snes: 'SNES',
    n64: 'Nintendo 64',
    gamecube: 'GameCube',
    wii: 'Wii',
    wiiu: 'Wii U',
    switch: 'Nintendo Switch',

    ps1: 'PlayStation',
    ps2: 'PlayStation 2',
    ps3: 'PlayStation 3',
    ps4: 'PlayStation 4',
    ps5: 'PlayStation 5',

    xbox: 'Xbox',
    xbox360: 'Xbox 360',
    xboxone: 'Xbox One',
    xboxseries: 'Xbox Series X/S',

    pc: 'PC',
    steam: 'Steam',
  }

  return (
    labels[format.toLowerCase()] ??
    format
  )
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


const [currentUserId, setCurrentUserId] =
  useState<string | null>(null)

const [friendship, setFriendship] =
  useState<Friendship | null>(null)

const [friendshipLoading, setFriendshipLoading] =
  useState(true)

const [friendshipSaving, setFriendshipSaving] =
  useState(false)

const [friendshipError, setFriendshipError] =
  useState('')
  
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


  /* =====================================================
     LOAD FRIENDSHIP STATUS
     ===================================================== */

  useEffect(() => {
    let cancelled = false

    const loadFriendship = async () => {
      setFriendshipLoading(true)
      setFriendshipError('')
      setFriendship(null)
      setCurrentUserId(null)

      const { data: userData, error: userError } =
        await supabase.auth.getUser()

      if (cancelled) return

      if (userError || !userData.user) {
        setFriendshipError(
          'Sign in to manage friendships.'
        )
        setFriendshipLoading(false)
        return
      }

      const userId = userData.user.id
      setCurrentUserId(userId)

      if (userId === collectorId) {
        setFriendshipLoading(false)
        return
      }

      const { data, error: lookupError } =
        await supabase
          .from('friendships')
          .select(
            'id, requester_id, receiver_id, status'
          )
          .or(
            `and(requester_id.eq.${userId},receiver_id.eq.${collectorId}),and(requester_id.eq.${collectorId},receiver_id.eq.${userId})`
          )
          .maybeSingle()

      if (cancelled) return

      if (lookupError) {
        console.error(lookupError)
        setFriendshipError(
          'Unable to load friendship status.'
        )
      } else {
        setFriendship(data as Friendship | null)
      }

      setFriendshipLoading(false)
    }

    void loadFriendship()

    return () => {
      cancelled = true
    }
  }, [collectorId])




  
/* =====================================================
   FRIENDSHIP ACTIONS
   ===================================================== */

const handleFriendshipAction = async (
  action: 'send' | 'accept' | 'decline' | 'cancel' | 'remove'
) => {
  if (
    friendshipSaving ||
    friendshipLoading ||
    !currentUserId
  ) return

  setFriendshipSaving(true)
  setFriendshipError('')

  try {
    let result

    switch (action) {
      case 'send':
        result = await supabase.rpc(
          'send_friend_request',
          { target_user_id: collectorId }
        )
        break

      case 'accept':
      case 'decline':
        if (!friendship) return

        result = await supabase.rpc(
          'respond_to_friend_request',
          {
            request_id: friendship.id,
            response:
              action === 'accept'
                ? 'accepted'
                : 'declined',
          }
        )
        break

      case 'cancel':
        if (!friendship) return

        result = await supabase.rpc(
          'cancel_friend_request',
          { request_id: friendship.id }
        )
        break

      case 'remove':
        if (!friendship) return

        result = await supabase.rpc(
          'remove_friend',
          { friendship_id: friendship.id }
        )
        break
    }

    if (result?.error) throw result.error

    const { data, error } = await supabase
      .from('friendships')
      .select(
        'id, requester_id, receiver_id, status'
      )
      .or(
        `and(requester_id.eq.${currentUserId},receiver_id.eq.${collectorId}),and(requester_id.eq.${collectorId},receiver_id.eq.${currentUserId})`
      )
      .maybeSingle()

    if (error) throw error

    setFriendship(data as Friendship | null)
  } catch (err) {
    setFriendshipError(
      err instanceof Error
        ? err.message
        : 'Unable to update friendship.'
    )
  } finally {
    setFriendshipSaving(false)
  }
}



  /* =====================================================
     EXISTING MOVIES AND GAMES
     ===================================================== */

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
{item.year} · {getFormatDisplayName(item.format)}         
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
{item.year} · {getFormatDisplayName(item.format)}           
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
{item.year} · {getFormatDisplayName(item.format)}           
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

        {/* PROFILE PICTURE */}

        <div className="profile-avatar">
          {displayName.charAt(0).toUpperCase()}
        </div>

        {/* PROFILE INFORMATION */}

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

        {/* FRIENDSHIP CONTROLS */}

        {currentUserId !== collectorId && (
          <div className="public-profile-friendship">

            {friendshipLoading ? (
              <button
                type="button"
                className="public-friend-button"
                disabled
              >
                Loading...
              </button>
            ) : friendship?.status === 'accepted' ? (
              <button
                type="button"
                className="public-friend-button connected"
                disabled={friendshipSaving}
                onClick={() => {
  if (
    window.confirm(
      'Are you sure you want to remove this friend?'
    )
  ) {
    void handleFriendshipAction('remove')
  }
}}
              >
                ✓ Friends
              </button>
            ) : friendship?.status === 'pending' ? (
              friendship.requester_id === currentUserId ? (
                <button
                  type="button"
                  className="public-friend-button pending"
                  disabled={friendshipSaving}
                  onClick={() =>
                    handleFriendshipAction('cancel')
                  }
                >
                  Request Pending · Cancel
                </button>
              ) : (
                <div className="public-friend-actions">
                  <button
                    type="button"
                    className="public-friend-button"
                    disabled={friendshipSaving}
                    onClick={() =>
                      handleFriendshipAction('accept')
                    }
                  >
                    Accept Request
                  </button>

                  <button
                    type="button"
                    className="public-friend-button secondary"
                    disabled={friendshipSaving}
                    onClick={() =>
                      handleFriendshipAction('decline')
                    }
                  >
                    Decline
                  </button>
                </div>
              )
            ) : friendship?.status === 'declined' ? (
              <span className="public-friend-status">
                Request declined
              </span>
            ) : (
              <button
                type="button"
                className="public-friend-button"
                disabled={friendshipSaving || !currentUserId}
                onClick={() =>
                  handleFriendshipAction('send')
                }
              >
                + Add Friend
              </button>
            )}

            {friendshipError && (
              <p
                className="public-friend-error"
                role="alert"
              >
                {friendshipError}
              </p>
            )}

          </div>
        )}

      </div>

      {/* PROFILE STATISTICS */}

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
