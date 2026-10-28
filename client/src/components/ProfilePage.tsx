
import { useEffect, useMemo, useState } from 'react'
import type { MediaItem } from '../data/sampleMedia'
import { supabase } from '../lib/supabase'
import EditProfileModal from './EditProfileModal'
import type { ProfileChanges } from './EditProfileModal'
import TopFiveEditor from './TopFiveEditor'

interface ProfilePageProps {
  userId: string
  userEmail: string
  collection: MediaItem[]
  onSignOut: () => void
  onSelectMedia: (item: MediaItem) => void
}

function ProfilePage({
  userId,
  userEmail,
  collection,
  onSignOut,
  onSelectMedia,
}: ProfilePageProps) {

  /* =====================================================
     PROFILE STATE
     ===================================================== */

  const [profileName, setProfileName] = useState('')
  const [bio, setBio] = useState('')

  const [username, setUsername] = useState('')
const [isPublic, setIsPublic] = useState(false)

  const [avatarPath, setAvatarPath] =
    useState<string | null>(null)

  const [avatarUrl, setAvatarUrl] =
    useState<string | null>(null)

  const [editing, setEditing] = useState(false)

  const [profileLoading, setProfileLoading] =
    useState(true)

  const [profileError, setProfileError] =
    useState('')

    const [topMovieIds, setTopMovieIds] =
  useState<string[]>([])

const [topGameIds, setTopGameIds] =
  useState<string[]>([])

const [editingTopFive, setEditingTopFive] =
  useState<'movie' | 'game' | null>(null)

  /* =====================================================
     LOAD PROFILE FROM SUPABASE
     ===================================================== */

  useEffect(() => {
    let cancelled = false

    const loadProfile = async () => {
      setProfileLoading(true)
      setProfileError('')

      const { data, error } = await supabase
        .from('profiles')
.select(
  'display_name, bio, avatar_path, top_movies, top_games, username, is_public'
)
        .eq('user_id', userId)
        .maybeSingle()

      if (cancelled) return

      if (error) {
        console.error(
          'Failed to load profile:',
          error,
        )

        setProfileError(
          'Unable to load your profile.'
        )

        setProfileLoading(false)
        return
      }

      setProfileName(data?.display_name ?? '')
      setBio(data?.bio ?? '')
      setAvatarPath(data?.avatar_path ?? null)
      setUsername(data?.username ?? '')
setIsPublic(data?.is_public ?? false)
      setTopMovieIds(data?.top_movies ?? [])
setTopGameIds(data?.top_games ?? [])

      setProfileLoading(false)
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [userId])

  /* =====================================================
     LOAD PROFILE PICTURE
     ===================================================== */

  useEffect(() => {
    let cancelled = false

    if (!avatarPath) {
      setAvatarUrl(null)
      return
    }

    const loadAvatar = async () => {
      const { data, error } =
        await supabase.storage
          .from('avatars')
          .createSignedUrl(avatarPath, 3600)

      if (cancelled) return

      if (error) {
        console.error(
          'Failed to load profile picture:',
          error,
        )

        setAvatarUrl(null)
        return
      }

      setAvatarUrl(data.signedUrl)
    }

    void loadAvatar()

    return () => {
      cancelled = true
    }
  }, [avatarPath])

  /* =====================================================
     COLLECTION STATISTICS
     ===================================================== */

  const movies = useMemo(
    () =>
      collection.filter(
        (item) => item.type === 'movie'
      ),
    [collection],
  )

  const games = useMemo(
    () =>
      collection.filter(
        (item) => item.type === 'game'
      ),
    [collection],
  )


  /* =====================================================
   PROFILE - REVIEW STATISTICS
   ===================================================== */

const totalReviews = useMemo(
  () =>
    collection.filter(
      (item) =>
        typeof item.personalReview === 'string' &&
        item.personalReview.trim().length > 0
    ).length,
  [collection],
)

  const mostOwnedFormat = useMemo(() => {
    const counts = new Map<string, number>()

    collection.forEach((item) => {
      const formats = item.formats?.length
        ? item.formats
        : [item.format]

      new Set(
        formats.map((format) =>
          format.toLowerCase()
        )
      ).forEach((format) => {
        counts.set(
          format,
          (counts.get(format) ?? 0) + 1,
        )
      })
    })

    const sorted = [...counts.entries()].sort(
      (a, b) => b[1] - a[1],
    )

    const topFormat = sorted[0]?.[0]

    return topFormat
      ? topFormat.toUpperCase()
      : 'None yet'
  }, [collection])

  /* =====================================================
     TOP FIVE PREVIEWS
     ===================================================== */

  // Temporary: uses favorited titles until manual
  // Top 5 selection and ranking are implemented.

 const topMovies = useMemo(
  () =>
    topMovieIds
      .map((id) =>
        movies.find((item) => item.id === id)
      )
      .filter(
        (item): item is MediaItem => Boolean(item)
      ),
  [topMovieIds, movies],
)

const topGames = useMemo(
  () =>
    topGameIds
      .map((id) =>
        games.find((item) => item.id === id)
      )
      .filter(
        (item): item is MediaItem => Boolean(item)
      ),
  [topGameIds, games],
)

  /* =====================================================
     DISPLAY NAME
     ===================================================== */

  const displayName =
    profileName ||
    userEmail.split('@')[0] ||
    'Collector'

  /* =====================================================
     SAVE PROFILE
     ===================================================== */

  const handleSaveProfile = async (
    changes: ProfileChanges,
  ): Promise<void> => {
    let nextAvatarPath = avatarPath
    let uploadedPath: string | null = null

    if (changes.avatarFile) {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
      ]

      if (
        !allowedTypes.includes(
          changes.avatarFile.type
        )
      ) {
        throw new Error(
          'Please select a JPG, PNG, or WebP image.'
        )
      }

      if (
        changes.avatarFile.size >
        2 * 1024 * 1024
      ) {
        throw new Error(
          'Profile pictures must be under 2 MB.'
        )
      }

      const extension =
        changes.avatarFile.type === 'image/jpeg'
          ? 'jpg'
          : changes.avatarFile.type === 'image/webp'
            ? 'webp'
            : 'png'

      const path =
        `${userId}/${crypto.randomUUID()}.${extension}`

      const { error: uploadError } =
        await supabase.storage
          .from('avatars')
          .upload(path, changes.avatarFile, {
            upsert: false,
            contentType: changes.avatarFile.type,
          })

      if (uploadError) {
        console.error(
          'Failed to upload avatar:',
          uploadError,
        )

        throw new Error(
          'Unable to upload your profile picture.'
        )
      }

      nextAvatarPath = path
      uploadedPath = path
    }

    const { error: saveError } =
      await supabase
        .from('profiles')
        .upsert(
         {
  user_id: userId,
  display_name: changes.displayName,
  bio: changes.bio,
  username: changes.username || null,
  is_public: changes.isPublic,
  avatar_path: nextAvatarPath,
  updated_at: new Date().toISOString(),
},
          {
            onConflict: 'user_id',
          }
        )


/* =====================================================
   HANDLE PROFILE SAVE ERRORS
   ===================================================== */

if (saveError) {
  console.error(
    'Failed to save profile:',
    saveError
  )

  // Remove newly uploaded avatar if saving fails.
  if (uploadedPath) {
    const { error: cleanupError } =
      await supabase.storage
        .from('avatars')
        .remove([uploadedPath])

    if (cleanupError) {
      console.error(
        'Failed to clean up avatar:',
        cleanupError
      )
    }
  }

  // Username already exists.
  if (saveError.code === '23505') {
    throw new Error(
      'That username is already taken. Please choose another.'
    )
  }

  throw new Error(
    'Unable to save your profile. Please try again.'
  )
}


    setProfileName(changes.displayName)
    setBio(changes.bio)
    setAvatarPath(nextAvatarPath)
    setUsername(changes.username)
setIsPublic(changes.isPublic)
  }

  /* =====================================================
     RENDER TOP FIVE
     ===================================================== */

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
            onClick={() =>
              onSelectMedia(item)
            }
            title={item.title}
          >
            <div className="profile-top-five-cover">
              {item.coverImage ? (
                <img
                  src={item.coverImage}
                  alt={item.title}
                  loading="lazy"
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

  /* =====================================================
     PROFILE PAGE
     ===================================================== */


/* =====================================================
   SAVE TOP FIVE RANKINGS
   ===================================================== */

const handleSaveTopFive = async (
  type: 'movie' | 'game',
  ids: string[],
): Promise<void> => {
  const eligibleIds = new Set(
    collection
      .filter((item) => item.type === type)
      .map((item) => item.id)
  )

  if (
    ids.length > 5 ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !eligibleIds.has(id))
  ) {
    throw new Error(
      'Please select up to five unique titles from your collection.'
    )
  }


const column =
  type === 'movie'
    ? 'top_movies'
    : 'top_games'

const { data, error } = await supabase
  .from('profiles')
  .upsert(
    {
      user_id: userId,
      [column]: ids,
    },
    {
      onConflict: 'user_id',
    }
  )
  .select('top_movies, top_games')
  .single()

if (error) {
  console.error(
    'Failed to save Top 5:',
    error
  )

  throw new Error(
    'Unable to save your Top 5.'
  )
}

if (type === 'movie') {
  setTopMovieIds(data.top_movies ?? [])
} else {
  setTopGameIds(data.top_games ?? [])
}
}



  return (
    <section className="profile-page">

      {/* PROFILE HEADER */}

      <div className="profile-hero">

        <div className="profile-avatar">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${displayName}'s profile`}
              className="profile-avatar-image"
            />
          ) : (
            displayName
              .charAt(0)
              .toUpperCase()
          )}
        </div>

        <div className="profile-identity">
          <span className="profile-eyebrow">
            MEDIAVAULT PROFILE
          </span>

         
<h1>{displayName}</h1>

{username && (
  <span className="profile-username">
    @{username}
  </span>
)}

<p>
  {bio ||
    'Add a Bio for your friends and enemies'}
</p>


          <span className="profile-email">
            {userEmail}
          </span>
        </div>

        {/* PROFILE ACTIONS */}

        <div className="profile-header-actions">
          <button
            type="button"
            className="profile-edit-button"
            onClick={() =>
              setEditing(true)
            }
            disabled={
              profileLoading ||
              Boolean(profileError)
            }
          >
            Edit Profile
          </button>

          <button
            type="button"
            className="profile-signout"
            onClick={onSignOut}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* PROFILE STATISTICS */}

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

          <div className="profile-stat">
    <span>TOTAL REVIEWS</span>
    <strong>{totalReviews}</strong>
  </div>

      </div>

      {/* TOP FIVE MOVIES */}

      <div className="profile-favorites-section">
        <div className="profile-section-heading">
  <h2>Top 5 Movies</h2>

  <button
    type="button"
    className="profile-edit-top-five"
    onClick={() => setEditingTopFive('movie')}
  >
    Edit Top 5
  </button>
</div>

        {renderTopFive(
          topMovies,
          'movies'
        )}
      </div>

      {/* TOP FIVE GAMES */}

      <div className="profile-favorites-section">
              <div className="profile-section-heading">
  <h2>Top 5 Games</h2>

  <button
    type="button"
    className="profile-edit-top-five"
    onClick={() => setEditingTopFive('game')}
  >
    Edit Top 5
  </button>
</div>

        {renderTopFive(
          topGames,
          'games'
        )}
      </div>

      {/* PROFILE ERROR */}

      {profileError && (
        <p
          className="auth-error"
          role="alert"
        >
          {profileError}
        </p>
      )}

      {/* EDIT PROFILE MODAL */}

     
{editing && (
  <EditProfileModal
    displayName={displayName}
    bio={bio}
    username={username}
    isPublic={isPublic}
    onClose={() =>
      setEditing(false)
    }
    onSave={handleSaveProfile}
  />
)}



{editingTopFive && (
  <TopFiveEditor
    type={editingTopFive}
    items={collection}
    selectedIds={
      editingTopFive === 'movie'
        ? topMovieIds
        : topGameIds
    }
    onClose={() => setEditingTopFive(null)}
    onSave={(ids: string[]) =>
  handleSaveTopFive(editingTopFive, ids)
}
  />
)}


    </section>
  )
}

export default ProfilePage
