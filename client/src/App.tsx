import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import type { User } from '@supabase/supabase-js'

import Header from './components/Header'
import MediaDetail from './components/MediaDetail'
import MediaRow from './components/MediaRow'
import AuthModal from './components/AuthModal'
import { supabase } from './lib/supabase'
import AddMediaModal from './components/AddMediaModal'
import CollectionDashboard from './components/CollectionDashboard'
import WelcomePage from './components/WelcomePage'
import EmptyCollection from './components/EmptyCollection'
import ResetPassword from './components/ResetPassword'
import ProfilePage from './components/ProfilePage'
import FindCollectors from './components/FindCollectors'
import PublicProfilePage from './components/PublicProfilePage'
import FeedPage from './components/FeedPage'
import InboxPage from './components/InboxPage'
import SettingsPage from './components/SettingsPage'
import MediaLibrary from './components/MediaLibrary'

import type { MediaItem } from './data/sampleMedia'
import './App.css'

type View =
  | 'collection'
  | 'movies'
  | 'games'
  | 'books'
  | 'music'
  | 'favorites'
  | 'profile'
  | 'collectors'
  | 'feed'
  | 'inbox'
  | 'settings'

interface CustomOption {
  id: string
  label: string
}


interface LibraryOptionRow {
  id: string
  user_id: string
  media_type: 'movie' | 'game'
  option_type: 'genre' | 'format'
  label: string
  created_at: string
}


interface MediaItemRow {
  id: string
  user_id: string

  title: string
type: MediaItem['type']
  format: string
formats: string[]

year: number

genre: string
genres: string[]

description: string
  favorite: boolean
  orientation: 'spine' | 'cover'

  spine_image: string | null
  cover_image: string | null

  personal_rating: number | null
personal_review: string | null
review_updated_at: string | null

  source: MediaItem['source'] | null

  external_id: string | null

  backdrop_image: string | null
  logo_image: string | null

  release_date: string | null
  rating: number | null
  runtime: number | null

  director: string | null

  cast_members: string[] | null
  production_companies: string[] | null
  countries: string[] | null
  languages: string[] | null

  developers: string[] | null
  publishers: string[] | null
  platforms: string[] | null
  game_modes: string[] | null
  player_perspectives: string[] | null
  themes: string[] | null

  screenshots: string[] | null

  videos:
    | MediaItem['videos']
    | null


  
metadata: {
  authors?: string[]
  isbn10?: string
  isbn13?: string
  bookPublisher?: string
  pageCount?: number
  bookLanguage?: string
  bookEdition?: string

  artists?: string[]
  albumType?: string
  recordLabel?: string
  catalogNumber?: string
  trackCount?: number

  openLibraryWorkId?: string
  openLibraryEditionId?: string
  musicBrainzReleaseGroupId?: string
  musicBrainzReleaseId?: string
} | null


  created_at: string
  updated_at: string
}



/* =====================================================
   DATABASE DATE NORMALIZATION
   ===================================================== */

function normalizeDatabaseDate(
  value?: string | null
): string | null {
  if (!value) return null

  const date = value.trim()

  // Year only: 1963 -> 1963-01-01
  if (/^\d{4}$/.test(date)) {
    return `${date}-01-01`
  }

  // Year and month: 1963-05 -> 1963-05-01
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(date)) {
    return `${date}-01`
  }

  // Complete date: validate before saving
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const parsed = new Date(`${date}T00:00:00Z`)

    if (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === date
    ) {
      return date
    }
  }

  // Reject unsupported dates
  return null
}


function rowToMediaItem(
  row: MediaItemRow,
): MediaItem {
  return {
    id: row.id,

    
/* Book and Music metadata */

...(row.metadata ?? {}),


    title: row.title,

    type: row.type,

    format: row.format,

    personalRating: row.personal_rating,
personalReview: row.personal_review,
reviewUpdatedAt: row.review_updated_at,

formats:
  row.formats?.length
    ? row.formats
    : [row.format],

year: row.year,

genre: row.genre,

genres:
  row.genres?.length
    ? row.genres
    : [row.genre],

description: row.description,

    favorite: row.favorite,

    orientation: row.orientation,

    spineImage:
      row.spine_image ?? undefined,

    coverImage:
      row.cover_image ?? undefined,

    source:
      row.source ?? undefined,

    externalId:
      row.external_id ?? undefined,

    backdropImage:
      row.backdrop_image ?? undefined,

    logoImage:
      row.logo_image ?? undefined,

    releaseDate:
      row.release_date ?? undefined,

    rating:
      row.rating ?? undefined,

    runtime:
      row.runtime ?? undefined,

    director:
      row.director ?? undefined,

    cast:
      row.cast_members ?? undefined,

    productionCompanies:
      row.production_companies ??
      undefined,

    countries:
      row.countries ?? undefined,

    languages:
      row.languages ?? undefined,

    developers:
      row.developers ?? undefined,

    publishers:
      row.publishers ?? undefined,

    platforms:
      row.platforms ?? undefined,

    gameModes:
      row.game_modes ?? undefined,

    playerPerspectives:
      row.player_perspectives ??
      undefined,

    themes:
      row.themes ?? undefined,

    screenshots:
      row.screenshots ?? undefined,

    videos:
      row.videos ?? undefined,
  }
}


function mediaItemToRow(
  media: MediaItem,
  userId: string,
) {
  return {
    id: media.id,
    user_id: userId,

    
/* Book and Music metadata */

metadata: {
  authors: media.authors,
  isbn10: media.isbn10,
  isbn13: media.isbn13,
  bookPublisher: media.bookPublisher,
  pageCount: media.pageCount,
  bookLanguage: media.bookLanguage,
  bookEdition: media.bookEdition,
  openLibraryWorkId: media.openLibraryWorkId,
  openLibraryEditionId: media.openLibraryEditionId,

  artists: media.artists,
  albumType: media.albumType,
  recordLabel: media.recordLabel,
  catalogNumber: media.catalogNumber,
  trackCount: media.trackCount,
  musicBrainzReleaseGroupId:
    media.musicBrainzReleaseGroupId,
  musicBrainzReleaseId:
    media.musicBrainzReleaseId,
},


    title: media.title,
    type: media.type,
    format: media.format,


    personal_rating: media.personalRating ?? null,
personal_review: media.personalReview ?? null,
review_updated_at: media.reviewUpdatedAt ?? null,

formats:
  media.formats?.length
    ? media.formats
    : [media.format],

year: media.year,

genre: media.genre,

genres:
  media.genres?.length
    ? media.genres
    : [media.genre],

description: media.description,
    favorite: media.favorite,
    orientation: media.orientation,

    spine_image:
      media.spineImage ?? null,

    cover_image:
      media.coverImage ?? null,

    source:
      media.source ?? null,

    external_id:
      media.externalId ?? null,

    backdrop_image:
      media.backdropImage ?? null,

    logo_image:
      media.logoImage ?? null,

   
release_date:
  normalizeDatabaseDate(media.releaseDate),


    rating:
      media.rating ?? null,

    runtime:
      media.runtime ?? null,

    director:
      media.director ?? null,

    cast_members:
      media.cast ?? null,

    production_companies:
      media.productionCompanies ?? null,

    countries:
      media.countries ?? null,

    languages:
      media.languages ?? null,

    developers:
      media.developers ?? null,

    publishers:
      media.publishers ?? null,

    platforms:
      media.platforms ?? null,

    game_modes:
      media.gameModes ?? null,

    player_perspectives:
      media.playerPerspectives ?? null,

    themes:
      media.themes ?? null,

    screenshots:
      media.screenshots ?? null,

    videos:
      media.videos ?? null,
  }
}






function App() {
  const [activeView, setActiveView] =
    useState<View>('collection')

  
/* =========================================
   RESET SCROLL WHEN CHANGING PAGES
   ========================================= */

useEffect(() => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'instant',
  })

  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}, [activeView])


  /* =========================================
     DASHBOARD PERSONALIZATION
     ========================================= */

  const [dashboardLayout, setDashboardLayout] =
    useState<'standard' | 'compact'>(() => {
      const saved = localStorage.getItem(
        'mediavault-dashboard-layout'
      )

      return saved === 'compact'
        ? 'compact'
        : 'standard'
    })

  const [openProfileEditor, setOpenProfileEditor] =
    useState(false)

const [selectedCollectorId, setSelectedCollectorId] =
  useState<string | null>(null)






  
/* =========================================================
   AUTHENTICATION STATE
   ========================================================= */

const [user, setUser] =
  useState<User | null>(null)

const [isAuthModalOpen, setIsAuthModalOpen] =
  useState(false)

const [authLoading, setAuthLoading] =
  useState(true)

const [isPasswordRecovery, setIsPasswordRecovery] =
  useState(
    window.location.pathname === '/reset-password'
  )

/* =========================================================
   COLLECTION STATE
   ========================================================= */

const [collection, setCollection] =
  useState<MediaItem[]>([])

const [
  collectionLoading,
  setCollectionLoading,
] = useState(true)

/* =========================================================
   LOAD AUTHENTICATION SESSION
   ========================================================= */

useEffect(() => {
  let mounted = true

  supabase.auth.getSession().then(
    ({ data }) => {
      if (!mounted) return

      setUser(data.session?.user ?? null)
      setAuthLoading(false)
    }
  )

  const { data: authListener } =
    supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setAuthLoading(false)
      }
    )

  return () => {
    mounted = false
    authListener.subscription.unsubscribe()
  }
}, [])

/* =========================================================
   LOAD COLLECTION
   ========================================================= */

useEffect(() => {
  let cancelled = false

  const loadCollection = async () => {
    if (authLoading) return

    if (!user) {
      setCollection([])
      setCollectionLoading(false)
      return
    }

    setCollectionLoading(true)

    const { data, error } = await supabase
      .from('media_items')
      .select('*')
      .order('created_at', {
        ascending: true,
      })

    if (cancelled) return

    if (error) {
      console.error(
        'Failed to load collection from Supabase:',
        error
      )

      setCollection([])
      setCollectionLoading(false)
      return
    }

    const items = (data ?? []).map(
      (row) =>
        rowToMediaItem(row as MediaItemRow)
    )

    setCollection(items)
    setCollectionLoading(false)
  }

  void loadCollection()

  return () => {
    cancelled = true
  }
}, [user, authLoading])

/* =========================================================
   MEDIA STATE
   ========================================================= */

const [selectedMedia, setSelectedMedia] =
  useState<MediaItem | null>(null)

const [isAddMediaOpen, setIsAddMediaOpen] =
  useState(false)

const [editingMedia, setEditingMedia] =
  useState<MediaItem | null>(null)

/* =========================================================
   CUSTOM LIBRARY OPTIONS
   ========================================================= */

const [customMovieGenres, setCustomMovieGenres] =
  useState<CustomOption[]>([])

const [customGameGenres, setCustomGameGenres] =
  useState<CustomOption[]>([])

const [customMovieFormats, setCustomMovieFormats] =
  useState<CustomOption[]>([])

const [customGameFormats, setCustomGameFormats] =
  useState<CustomOption[]>([])



/* =========================================================
   LOAD PERSONAL LIBRARY OPTIONS
   ========================================================= */

useEffect(() => {
  let cancelled = false

  const loadLibraryOptions = async () => {
    if (authLoading) return

    if (!user) {
      setCustomMovieGenres([])
      setCustomGameGenres([])
      setCustomMovieFormats([])
      setCustomGameFormats([])
      return
    }

    const { data, error } = await supabase
      .from('library_options')
      .select('*')
      .eq('user_id', user.id)
      .order('label', { ascending: true })

    if (cancelled) return

    if (error) {
      console.error(
        'Failed to load library options:',
        error,
      )
      return
    }

    const options =
      (data ?? []) as LibraryOptionRow[]

    const extract = (
      mediaType: 'movie' | 'game',
      optionType: 'genre' | 'format',
    ): CustomOption[] =>
      options
        .filter(
          (option) =>
            option.media_type === mediaType &&
            option.option_type === optionType,
        )
        .map((option) => ({
          id: option.id,
          label: option.label,
        }))

    setCustomMovieGenres(extract('movie', 'genre'))
    setCustomGameGenres(extract('game', 'genre'))
    setCustomMovieFormats(extract('movie', 'format'))
    setCustomGameFormats(extract('game', 'format'))
  }

  void loadLibraryOptions()

  return () => {
    cancelled = true
  }
}, [user?.id, authLoading])




  /* =========================================================
     COLLECTION FILTERS
     ========================================================= */

  const movies = useMemo(
    () =>
      collection.filter(
        (item) => item.type === 'movie',
      ),
    [collection],
  )

  const games = useMemo(
    () =>
      collection.filter(
        (item) => item.type === 'game',
      ),
    [collection],
  )

  
/* =====================================================
   BOOK AND MUSIC COLLECTIONS
   ===================================================== */

const books = useMemo(
  () =>
    collection.filter(
      (item) => item.type === 'book'
    ),
  [collection]
)

const music = useMemo(
  () =>
    collection.filter(
      (item) => item.type === 'music'
    ),
  [collection]
)


  
/* =====================================================
   DYNAMIC LIBRARY CATEGORY VISIBILITY
   ===================================================== */

const availableMediaTypes = useMemo(
  () => ({
    movies: movies.length > 0,
    games: games.length > 0,
    music: music.length > 0,
    books: books.length > 0,
  }),
  [movies.length, games.length, music.length, books.length]
)

  

/* =====================================================
   PREVENT NAVIGATION TO EMPTY LIBRARIES
   ===================================================== */

useEffect(() => {
  if (collectionLoading) return

  const libraryViews = [
    'movies',
    'games',
    'music',
    'books',
  ] as const

  if (
    libraryViews.some(
      (view) =>
        view === activeView &&
        !availableMediaTypes[view]
    )
  ) {
    setActiveView('collection')
  }
}, [
  activeView,
  availableMediaTypes,
  collectionLoading,
])


  const favorites = useMemo(
    () =>
      collection.filter(
        (item) => item.favorite,
      ),
    [collection],
  )

  /*
   * Most recently added items are simply the newest
   * entries in the current collection.
   */
  const recentlyAdded = useMemo(
    () =>
      [...collection]
        .slice(-15)
        .reverse(),
    [collection],
  )

  

    /* =========================================================
   LIBRARY SEARCH AND FILTERS
   ========================================================= */


const libraryItems =
  activeView === 'movies'
    ? movies
    : activeView === 'games'
      ? games
      : activeView === 'books'
        ? books
        : activeView === 'music'
          ? music
          : []


  /* =========================================================
     HANDLERS
     ========================================================= */


  const handleDashboardLayoutChange = (
  layout: 'standard' | 'compact'
) => {
  setDashboardLayout(layout)

  localStorage.setItem(
    'mediavault-dashboard-layout',
    layout
  )
}

  const handleSelect = (
    item: MediaItem,
  ) => {
    setSelectedMedia(item)
  }


const handleAddMedia = async (
  newMedia: MediaItem,
): Promise<boolean> => {
  if (!user) {
    window.alert(
      'You must be signed in to add media.'
    )
    return false
  }

  const row = mediaItemToRow(
    newMedia,
    user.id
  )

  const { data, error } = await supabase
    .from('media_items')
    .insert(row)
    .select()
    .single()

  if (error) {
    console.error(
      'Failed to save media to Supabase:',
      error
    )

    window.alert(
      'Unable to save this media item. Please try again.'
    )

    return false
  }

  const savedMedia = rowToMediaItem(
    data as MediaItemRow
  )

  setCollection((current) => [
    ...current,
    savedMedia,
  ])

  return true
}




  const handleSignOut = async () => {
  const {
    error,
  } = await supabase.auth.signOut()

  if (error) {
    console.error(
      'Failed to sign out:',
      error,
    )

    return
  }

  setIsAuthModalOpen(false)
}

const handlePasswordRecoveryComplete = () => {
  window.history.replaceState(
    {},
    '',
    '/'
  )

  setIsPasswordRecovery(false)
}

 const handleRemoveMedia = async (
  mediaToRemove: MediaItem,
) => {
  if (!user) {
    window.alert(
      'You must be signed in to remove media.',
    )
    return
  }

  const confirmed = window.confirm(
    `Permanently remove "${mediaToRemove.title}" from your collection?`,
  )

  if (!confirmed) {
    return
  }

  

  const { data, error } = await supabase
    .from('media_items')
    .delete()
    .eq('id', mediaToRemove.id)
    .eq('user_id', user.id)
    .select('id')

  if (error) {
    console.error(
      'Failed to remove media from Supabase:',
      error,
    )

    window.alert(
      'Unable to remove this item. Please try again.',
    )
    return
  }

  if (!data || data.length === 0) {
    console.error(
      'No matching media item was deleted.',
    )

    window.alert(
      'The item could not be found or you do not have permission to remove it.',
    )
    return
  }


setCollection((current) =>
  current.filter(
    (item) => item.id !== mediaToRemove.id
  )
)

/* Return home if the last item in the
   currently viewed category was removed. */

const remainingCategoryItems = collection.filter(
  (item) =>
    item.type === mediaToRemove.type &&
    item.id !== mediaToRemove.id
)

const categoryView = {
  movie: 'movies',
  game: 'games',
  book: 'books',
  music: 'music',
} as const

if (
  remainingCategoryItems.length === 0 &&
  activeView === categoryView[mediaToRemove.type]
) {
  setActiveView('collection')
}

setSelectedMedia(null)

}

const handleEditMedia = (
  mediaToEdit: MediaItem,
) => {
  setEditingMedia(mediaToEdit)
  setSelectedMedia(null)
  setIsAddMediaOpen(true)
}


const handleSaveEdit = async (
  updatedMedia: MediaItem,
): Promise<boolean> => {
  if (!user) {
    window.alert(
      'You must be signed in to edit media.',
    )
    return false
  }

  const row = mediaItemToRow(
    updatedMedia,
    user.id,
  )

  const { id, user_id, ...changes } = row

  const { data, error } = await supabase
    .from('media_items')
    .update(changes)
    .eq('id', id)
    .eq('user_id', user_id)
    .select()
    .single()

  if (error) {
    console.error(
      'Failed to update media:',
      error,
    )

    window.alert(
      'Unable to save changes. Please try again.',
    )

    return false
  }

  const savedMedia = rowToMediaItem(
    data as MediaItemRow,
  )

  setCollection((current) =>
    current.map((item) =>
      item.id === savedMedia.id
        ? savedMedia
        : item,
    ),
  )

  setSelectedMedia(null)

  return true
}


/* =========================================================
   SAVE PERSONAL REVIEW
   ========================================================= */

const handleSaveReview = async (
  mediaToReview: MediaItem,
  rating: number | null,
  review: string,
): Promise<void> => {
  if (!user) {
    throw new Error(
      'You must be signed in to save a review.',
    )
  }

  if (
    rating !== null &&
    (!Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5)
  ) {
    throw new Error(
      'Please select a rating between 1 and 5 stars.',
    )
  }

  const reviewText = review.trim()

  const { data, error } = await supabase
    .from('media_items')
    .update({
      personal_rating: rating,
      personal_review: reviewText || null,
      review_updated_at: new Date().toISOString(),
    })
    .eq('id', mediaToReview.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error(
      'Failed to save personal review:',
      error,
    )

    throw new Error(
      'Unable to save your review. Please try again.',
    )
  }

  const savedMedia = rowToMediaItem(
    data as MediaItemRow,
  )

  setCollection((current) =>
    current.map((item) =>
      item.id === savedMedia.id
        ? savedMedia
        : item,
    ),
  )

  setSelectedMedia((current) =>
    current?.id === savedMedia.id
      ? savedMedia
      : current,
  )
}


const handleAddCustomGenre = async (
  type: 'movie' | 'game',
  option: CustomOption,
) => {
  if (!user) return null

  const label = option.label.trim()
  if (!label) return null

  const { data, error } = await supabase
    .from('library_options')
    .insert({
      user_id: user.id,
      media_type: type,
      option_type: 'genre',
      label,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to add genre:', error)
    window.alert('Unable to save custom genre.')
    return null
  }

  const savedOption: CustomOption = {
    id: data.id,
    label: data.label,
  }

  if (type === 'movie') {
    setCustomMovieGenres((current) => [
      ...current,
      savedOption,
    ])
  } else {
    setCustomGameGenres((current) => [
      ...current,
      savedOption,
    ])
  }

  return savedOption
}

const handleAddCustomFormat = async (
  type: 'movie' | 'game',
  option: CustomOption,
): Promise<CustomOption | null> => {
  if (!user) return null

  const label = option.label.trim()

  if (!label) return null

  const { data, error } = await supabase
    .from('library_options')
    .insert({
      user_id: user.id,
      media_type: type,
      option_type: 'format',
      label,
    })
    .select()
    .single()

  if (error) {
    console.error(
      'Failed to add format:',
      error,
    )

    window.alert(
      'Unable to save custom format.',
    )

    return null
  }

  const savedOption: CustomOption = {
    id: data.id,
    label: data.label,
  }

  if (type === 'movie') {
    setCustomMovieFormats((current) => [
      ...current,
      savedOption,
    ])
  } else {
    setCustomGameFormats((current) => [
      ...current,
      savedOption,
    ])
  }

  return savedOption
}

/* =========================================================
   RENDER FAVORITES
   ========================================================= */

const renderRows = () => {
  if (activeView !== 'favorites') {
    return null
  }

  return (
    <>
      <MediaRow
        title="Favorites"
        items={favorites}
        onSelect={handleSelect}
      />

      <MediaRow
        title="Favorite Movies"
        items={favorites.filter(
          (item) => item.type === 'movie'
        )}
        onSelect={handleSelect}
      />

      <MediaRow
        title="Favorite Games"
        items={favorites.filter(
          (item) => item.type === 'game'
        )}
        onSelect={handleSelect}
      />
    </>
  )
}



const renderCollectionDashboard = () => (
  <CollectionDashboard
    recentlyAdded={recentlyAdded}
    movies={movies}
    games={games}
    books={books}
    music={music}
    favorites={favorites}
    onSelect={handleSelect}
    onViewChange={setActiveView}
    dashboardLayout={dashboardLayout}
  />
)




/* =========================================================
   AUTHENTICATION / WELCOME PAGE
   ========================================================= */

if (authLoading) {
  return (
    <div className="app-loading-screen">
      <div className="app-loading-content">
        <strong>
          MEDIA<span>VAULT</span>
        </strong>

        <p>Loading your archive...</p>
      </div>
    </div>
  )
}

if (isPasswordRecovery) {
  return (
    <ResetPassword
      onComplete={
        handlePasswordRecoveryComplete
      }
    />
  )
}

if (!user) {
  return (
    <>
      <WelcomePage
        onSignIn={() =>
          setIsAuthModalOpen(true)
        }
        onGetStarted={() =>
          setIsAuthModalOpen(true)
        }
      />

      {isAuthModalOpen && (
        <AuthModal
          onClose={() =>
            setIsAuthModalOpen(false)
          }
        />
      )}
    </>
  )
}


  return (
    <div className="room">


<Header
  activeView={activeView}
  onViewChange={setActiveView}
  availableMediaTypes={availableMediaTypes}
  collectionLoading={collectionLoading}
  onAddMedia={() =>
    setIsAddMediaOpen(true)
  }
  onAccount={() => {
    if (!user) {
      setIsAuthModalOpen(true)
    }
  }}
  userEmail={user?.email ?? null}
/>



      <main className="room-content">
<div className="room-glow room-glow-left" />
<div className="room-glow room-glow-right" />




{collectionLoading ? (
  <div className="collection-loading">
    Loading your collection...
  </div>

) : activeView === 'collectors' ? (
  selectedCollectorId ? (
    <PublicProfilePage
      collectorId={selectedCollectorId}
      onBack={() => setSelectedCollectorId(null)}
    />
  ) : (
 <FindCollectors
  onSelectCollector={(userId) => {
    setSelectedCollectorId(userId)
  }}

  onEditProfile={() => {
    setOpenProfileEditor(true)
    setSelectedCollectorId(null)
    setActiveView('profile')
  }}
/>

  )


) : activeView === 'inbox' ? (

  <InboxPage />

) : activeView === 'settings' ? (

  <SettingsPage
    dashboardLayout={dashboardLayout}
    onDashboardLayoutChange={handleDashboardLayoutChange}
  />

) : activeView === 'feed' ? (

  <FeedPage
    onFindCollectors={() => {
      setSelectedCollectorId(null)
      setActiveView('collectors')
    }}
  />

) : activeView === 'profile' ? (

<ProfilePage
  userId={user.id}
  userEmail={user.email ?? ''}
  collection={collection}
  onSignOut={() => void handleSignOut()}
  onSelectMedia={handleSelect}
  openEditorOnMount={openProfileEditor}
  onEditorOpened={() => {
    setOpenProfileEditor(false)
  }}
/>

) : activeView === 'collection' ? (




  collection.length === 0 ? (
    <EmptyCollection
      onAddMedia={() =>
        setIsAddMediaOpen(true)
      }
    />
  ) : (
    renderCollectionDashboard()
  )
) : activeView === 'favorites' ? (
  <div className="library">
    <div className="bookcase">
      <div className="bookcase-top" />

      <div className="bookcase-content">
        <div className="bookcase-back" />

        <div className="rows">
          {renderRows()}
        </div>
      </div>

      <div className="bookcase-base" />
    </div>
  </div>
) : (
  <MediaLibrary
      key={activeView}
    title={{
      movies: 'Movie Library',
      games: 'Game Library',
      books: 'Book Library',
      music: 'Music Library',
    }[
      activeView as
        'movies' | 'games' | 'books' | 'music'
    ]}
    items={libraryItems}
    onSelect={handleSelect}
  />
)}

      </main>

      {/* =======================================================
          MEDIA DETAIL
          ======================================================= */}

  {selectedMedia && (
  <MediaDetail
    media={selectedMedia}
    onClose={() => setSelectedMedia(null)}
    onRemove={handleRemoveMedia}
    onEdit={handleEditMedia}
    onSaveReview={handleSaveReview}
  />
)}


{isAuthModalOpen && !authLoading && (
  <AuthModal
    onClose={() =>
      setIsAuthModalOpen(false)
    }
  />
)}


      {/* =======================================================
          ADD MEDIA
          ======================================================= */}

      {isAddMediaOpen && (
        <AddMediaModal
         onClose={() => {
  setIsAddMediaOpen(false)
  setEditingMedia(null)
}}
          onAdd={handleAddMedia}
          customMovieGenres={
            customMovieGenres
          }
          customGameGenres={
            customGameGenres
          }
          customMovieFormats={
            customMovieFormats
          }
          customGameFormats={
            customGameFormats
          }
          onAddCustomGenre={
            handleAddCustomGenre
          }
          editingMedia={editingMedia}
          onAddCustomFormat={
            handleAddCustomFormat
          }
          onSaveEdit={handleSaveEdit}
        />
      )}
    </div>
  )
}

export default App
