
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
  openEditorOnMount?: boolean
  onEditorOpened?: () => void
}
function ProfilePage({
  userId,
  userEmail,
  collection,
  onSignOut,
  onSelectMedia,
  openEditorOnMount = false,
  onEditorOpened,
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

  useEffect(() => {
  if (
    openEditorOnMount &&
    !profileLoading &&
    !profileError
  ) {
    setEditing(true)
    onEditorOpened?.()
  }
}, [
  openEditorOnMount,
  profileLoading,
  profileError,
  onEditorOpened,
])

type TopFiveType = 'movie' | 'game' | 'book' | 'music'

const [topMovieIds, setTopMovieIds] =
  useState<string[]>([])

const [topGameIds, setTopGameIds] =
  useState<string[]>([])

const [topBookIds, setTopBookIds] =
  useState<string[]>([])

const [topMusicIds, setTopMusicIds] =
  useState<string[]>([])

const [activeTopFive, setActiveTopFive] =
  useState<TopFiveType>('movie')

const [editingTopFive, setEditingTopFive] =
  useState<TopFiveType | null>(null)

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
  'display_name, bio, avatar_path, top_movies, top_games, top_books, top_music, username, is_public'
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
      setTopBookIds(data?.top_books ?? [])
setTopMusicIds(data?.top_music ?? [])

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

  const books = useMemo(
  () =>
    collection.filter(
      (item) => item.type === 'book'
    ),
  [collection],
)

const music = useMemo(
  () =>
    collection.filter(
      (item) => item.type === 'music'
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
   UNIFIED TOP FIVE DATA
   ===================================================== */

const topFiveIds: Record<TopFiveType, string[]> = {
  movie: topMovieIds,
  game: topGameIds,
  book: topBookIds,
  music: topMusicIds,
}

const topFiveCollections: Record<TopFiveType, MediaItem[]> = {
  movie: movies,
  game: games,
  book: books,
  music: music,
}

const activeTopFiveItems = topFiveIds[activeTopFive]
  .map((id) =>
    topFiveCollections[activeTopFive].find(
      (item) => item.id === id
    )
  )
  .filter(
    (item): item is MediaItem => Boolean(item)
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
type: 'movies' | 'games' | 'books' | 'music',
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
  type: TopFiveType,
  ids: string[],
): Promise<void> => {
  const eligibleIds = new Set(
    collection
      .filter(item => item.type === type)
      .map(item => item.id)
  )

  if (
    ids.length > 5 ||
    new Set(ids).size !== ids.length ||
    ids.some(id => !eligibleIds.has(id))
  ) {
    throw new Error(
      'Please select up to five unique titles from your collection.'
    )
  }

  const columns: Record<TopFiveType, string> = {
    movie: 'top_movies',
    game: 'top_games',
    book: 'top_books',
    music: 'top_music',
  }

  const column = columns[type]

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
    .select('top_movies, top_games, top_books, top_music')
    .single()

  if (error) {
    console.error('Failed to save Top 5:', error)

    throw new Error(
      'Unable to save your Top 5.'
    )
  }

  setTopMovieIds(data.top_movies ?? [])
  setTopGameIds(data.top_games ?? [])
  setTopBookIds(data.top_books ?? [])
  setTopMusicIds(data.top_music ?? [])
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

{/* =====================================================
    UNIFIED TOP FIVE FAVORITES
    ===================================================== */}

<div className="profile-favorites-section profile-top-five-unified">

  <div className="profile-section-heading">
    <h2>Top 5 Favorites</h2>

    <button
      type="button"
      className="profile-edit-top-five"
      onClick={() => setEditingTopFive(activeTopFive)}
    >
      Edit Top 5
    </button>
  </div>

  <div
    className="profile-top-five-tabs"
    role="group"
    aria-label="Top 5 category"
  >
    {([
      ['movie', 'Movies'],
      ['game', 'Games'],
      ['music', 'Music'],
      ['book', 'Books'],
    ] as const).map(([type, label]) => (
      <button
        key={type}
        type="button"
        className={
          activeTopFive === type ? 'active' : ''
        }
        aria-pressed={activeTopFive === type}
        onClick={() => setActiveTopFive(type)}
      >
        {label}
      </button>
    ))}
  </div>

  {renderTopFive(
    activeTopFiveItems,
    activeTopFive === 'movie'
      ? 'movies'
      : activeTopFive === 'game'
        ? 'games'
        : activeTopFive === 'book'
          ? 'books'
          : 'music'
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
  selectedIds={topFiveIds[editingTopFive]}
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
