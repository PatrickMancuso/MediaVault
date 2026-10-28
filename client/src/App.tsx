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

import type { MediaItem } from './data/sampleMedia'
import './App.css'

type View =
  | 'collection'
  | 'movies'
  | 'games'
  | 'favorites'
  | 'profile'
  | 'collectors'

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
  type: 'movie' | 'game'
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

  source:
    | 'tmdb'
    | 'igdb'
    | 'manual'
    | null

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

  created_at: string
  updated_at: string
}

function rowToMediaItem(
  row: MediaItemRow,
): MediaItem {
  return {
    id: row.id,

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
      media.releaseDate ?? null,

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

const [selectedCollectorId, setSelectedCollectorId] =
  useState<string | null>(null)

    const [librarySearch, setLibrarySearch] =
  useState('')

const [libraryGenre, setLibraryGenre] =
  useState('all')

const [libraryFormat, setLibraryFormat] =
  useState('all')

  const [libraryDecade, setLibraryDecade] =
  useState('all')

const [librarySort, setLibrarySort] =
  useState<'title-asc' | 'title-desc' | 'year-new' | 'year-old'>(
    'title-asc',
  )

  /* =========================================================
   LIBRARY DISPLAY MODE
   ========================================================= */

const [libraryDisplayMode, setLibraryDisplayMode] =
  useState<'cover' | 'spine'>('cover')

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

const [collection, setCollection] =
  useState<MediaItem[]>([])

const [
  collectionLoading,
  setCollectionLoading,
] = useState(true)

  useEffect(() => {
  let mounted = true

  supabase.auth.getSession().then(
    ({ data }) => {
      if (!mounted) {
        return
      }

      setUser(data.session?.user ?? null)
      setAuthLoading(false)
    },
  )


 

  const {
    data: authListener,
  } =
    supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(
          session?.user ?? null,
        )

        setAuthLoading(false)
      },
    )

  return () => {
    mounted = false

    authListener.subscription.unsubscribe()
  }
}, [])

useEffect(() => {
  let cancelled = false

  const loadCollection =
    async () => {
      if (authLoading) {
        return
      }

      if (!user) {
        setCollection([])
        setCollectionLoading(false)

        return
      }

      setCollectionLoading(true)

      const {
        data,
        error,
      } = await supabase
        .from('media_items')
        .select('*')
        .order(
          'created_at',
          {
            ascending: true,
          },
        )

      if (cancelled) {
        return
      }

      if (error) {
        console.error(
          'Failed to load collection from Supabase:',
          error,
        )

        setCollection([])
        setCollectionLoading(false)

        return
      }

      const items =
        (data ?? []).map(
          (row) =>
            rowToMediaItem(
              row as MediaItemRow,
            ),
        )

      setCollection(items)
      setCollectionLoading(false)
    }

  void loadCollection()

  return () => {
    cancelled = true
  }
}, [
  user,
  authLoading,
])

  const [selectedMedia, setSelectedMedia] =
    useState<MediaItem | null>(null)

  const [isAddMediaOpen, setIsAddMediaOpen] =
    useState(false)

    const [editingMedia, setEditingMedia] =
  useState<MediaItem | null>(null)

  
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
      : []

const libraryGenreOptions = Array.from(
  new Set(
    libraryItems.flatMap((item) =>
      item.genres?.length
        ? item.genres
        : [item.genre],
    ),
  ),
).sort((a, b) => a.localeCompare(b))

const libraryFormatOptions = Array.from(
  new Set(
    libraryItems.flatMap((item) =>
      item.formats?.length
        ? item.formats
        : [item.format],
    ),
  ),
).sort((a, b) => a.localeCompare(b))



/* =====================================================
   LIBRARY - AVAILABLE DECADES
   ===================================================== */

const libraryDecadeOptions = Array.from(
  new Set(
    libraryItems
      .filter(
        (item) =>
          Number.isFinite(item.year) &&
          item.year > 0
      )
      .map(
        (item) =>
          Math.floor(item.year / 10) * 10
      )
  )
).sort((a, b) => b - a)



/* =====================================================
   LIBRARY - FILTER AND SORT
   ===================================================== */

const isLibraryFiltered =
  librarySearch.trim() !== '' ||
  libraryGenre !== 'all' ||
  libraryFormat !== 'all' ||
  libraryDecade !== 'all'

const filteredLibraryItems = libraryItems
  .filter((item) => {
    const search =
      librarySearch.trim().toLowerCase()

    const itemGenres =
      item.genres?.length
        ? item.genres
        : [item.genre]

    const itemFormats =
      item.formats?.length
        ? item.formats
        : [item.format]

    const searchableValues = [
      item.title,
      String(item.year),
      ...itemGenres,
      ...itemFormats,
    ]

    const matchesSearch =
      search === '' ||
      searchableValues.some((value) =>
        value.toLowerCase().includes(search)
      )

    const matchesGenre =
      libraryGenre === 'all' ||
      itemGenres.includes(libraryGenre)

    const matchesFormat =
      libraryFormat === 'all' ||
      itemFormats.includes(libraryFormat)

    const matchesDecade =
      libraryDecade === 'all' ||
      Math.floor(item.year / 10) * 10 ===
        Number(libraryDecade)

    return (
      matchesSearch &&
      matchesGenre &&
      matchesFormat &&
      matchesDecade
    )
  })
  .sort((a, b) => {
    switch (librarySort) {
      case 'title-desc':
        return b.title.localeCompare(a.title)

      case 'year-new':
        return (
          b.year - a.year ||
          a.title.localeCompare(b.title)
        )

      case 'year-old':
        return (
          a.year - b.year ||
          a.title.localeCompare(b.title)
        )

      default:
        return a.title.localeCompare(b.title)
    }
  })


const clearLibraryFilters = () => {
  setLibrarySearch('')
  setLibraryGenre('all')
  setLibraryFormat('all')
  setLibraryDecade('all')
  setLibrarySort('title-asc')
}

  /* =========================================================
     HANDLERS
     ========================================================= */

  const handleSelect = (
    item: MediaItem,
  ) => {
    setSelectedMedia(item)
  }

 const handleAddMedia = async (
  newMedia: MediaItem,
) => {
  if (!user) {
    console.error(
      'Cannot add media without a signed-in user.',
    )

    return
  }

  const row =
    mediaItemToRow(
      newMedia,
      user.id,
    )

  const {
    data,
    error,
  } = await supabase
    .from('media_items')
    .insert(row)
    .select()
    .single()

  if (error) {
    console.error(
      'Failed to save media to Supabase:',
      error,
    )

    window.alert(
      'Unable to save this media item. Please try again.',
    )

    return
  }

  const savedMedia =
    rowToMediaItem(
      data as MediaItemRow,
    )

  setCollection(
    (current) => [
      ...current,
      savedMedia,
    ],
  )
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
      (item) => item.id !== mediaToRemove.id,
    ),
  )

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



/* =====================================================
   LIBRARY - FORMAT DISPLAY LABELS
   ===================================================== */

const getFormatDisplayName = (format: string) => {
  const labels: Record<string, string> = {
    nes: 'NES',
    snes: 'SNES',
    n64: 'Nintendo 64',
    gamecube: 'GameCube',
    wii: 'Wii',
    wiiu: 'Wii U',
    switch: 'Nintendo Switch',

    ps1: 'PS1',
    ps2: 'PS2',
    ps3: 'PS3',
    ps4: 'PS4',
    ps5: 'PS5',

    xbox: 'Xbox',
    xbox360: 'Xbox 360',
    xboxone: 'Xbox One',
    xboxseries: 'Xbox Series X/S',

    pc: 'PC',
    steam: 'Steam',

    vhs: 'VHS',
    dvd: 'DVD',
    bluray: 'Blu-ray',
    'blu-ray': 'Blu-ray',
    laserdisc: 'LaserDisc',
  }

  return (
    labels[format.toLowerCase()] ??
    format
  )
}


  /* =========================================================
   LIBRARY SEARCH CONTROLS
   ========================================================= */

const renderLibrarySearch = () => {
  if (
    activeView !== 'movies' &&
    activeView !== 'games'
  ) {
    return null
  }

  return (
    <div className="library-search-panel">
      <div className="library-search-heading">
        <div>
          <h2>
            {activeView === 'movies'
              ? 'Movie Library'
              : 'Game Library'}
          </h2>

          <p>
            Search and explore your collection
          </p>
        </div>

      <div className="library-heading-actions">
  <div
    className="library-display-toggle"
    role="group"
    aria-label="Library display mode"
  >
    <button
      type="button"
      className={
        libraryDisplayMode === 'cover'
          ? 'active'
          : ''
      }
      onClick={() => setLibraryDisplayMode('cover')}
      aria-pressed={libraryDisplayMode === 'cover'}
    >
      Covers
    </button>

    <button
      type="button"
      className={
        libraryDisplayMode === 'spine'
          ? 'active'
          : ''
      }
      onClick={() => setLibraryDisplayMode('spine')}
      aria-pressed={libraryDisplayMode === 'spine'}
    >
      Spines
    </button>
  </div>

  <span className="library-result-count">
    {filteredLibraryItems.length} of{' '}
    {libraryItems.length} titles
  </span>
</div>
      </div>

      <div className="library-search-input-wrapper">
        <span aria-hidden="true">⌕</span>

        <input
          type="search"
          value={librarySearch}
          onChange={(event) =>
            setLibrarySearch(event.target.value)
          }
          placeholder="Search title, year, genre, or format..."
          aria-label="Search library"
        />
      </div>

      <div className="library-filter-row">
        <label>
          <span>Genre</span>

          <select
            value={libraryGenre}
            onChange={(event) =>
              setLibraryGenre(event.target.value)
            }
          >
            <option value="all">All Genres</option>

            {libraryGenreOptions.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Format</span>

          <select
            value={libraryFormat}
            onChange={(event) =>
              setLibraryFormat(event.target.value)
            }
          >
            <option value="all">All Formats</option>

          
{libraryFormatOptions.map((format) => (
  <option
    key={format}
    value={format}
  >
    {getFormatDisplayName(format)}
  </option>
))}

          </select>
        </label>

{/* DECADE FILTER */}

<label>
  <span>Decade</span>

  <select
    value={libraryDecade}
    onChange={(event) =>
      setLibraryDecade(event.target.value)
    }
  >
    <option value="all">
      All Decades
    </option>

    {libraryDecadeOptions.map((decade) => (
      <option
        key={decade}
        value={String(decade)}
      >
        {decade}s
      </option>
    ))}
  </select>
</label>

        <label>
          <span>Sort By</span>

          <select
            value={librarySort}
            onChange={(event) =>
              setLibrarySort(
                event.target.value as typeof librarySort,
              )
            }
          >
            <option value="title-asc">
              Title A-Z
            </option>

            <option value="title-desc">
              Title Z-A
            </option>

            <option value="year-new">
              Newest First
            </option>

            <option value="year-old">
              Oldest First
            </option>
          </select>
        </label>

        <button
          type="button"
          className="library-clear-filters"
          onClick={clearLibraryFilters}
        >
          Clear Filters
        </button>
      </div>
    </div>
  )
}

  
/* =========================================================
   RENDER ROWS - FILTERED AND SORTED
   ========================================================= */

const renderRows = () => {
  if (
    activeView === 'movies' ||
    activeView === 'games'
  ) {
    const currentType =
      activeView === 'movies'
        ? 'movie'
        : 'game'

    const items = filteredLibraryItems.filter(
      (item) => item.type === currentType
    )

    if (items.length === 0) {
      return (
        <div className="library-no-results">
          <h3>No matching titles found</h3>
          <p>
            Try another search or adjust your filters.
          </p>
        </div>
      )
    }

    // Keep Recently Added separate from genre shelves.
    // Only show it when no search/filter is active.

    const showRecentlyAdded = !isLibraryFiltered

    // Build genre shelves from the already
    // filtered and sorted library items.

    const genreMap = new Map<
      string,
      typeof items
    >()

    items.forEach((item) => {
      const genres =
        item.genres?.length
          ? item.genres
          : [item.genre]

      genres.forEach((genre) => {
        if (!genre) return

        const existing =
          genreMap.get(genre) ?? []

        existing.push(item)
        genreMap.set(genre, existing)
      })
    })

    const genreRows = [...genreMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))

    return (
      <>
        {showRecentlyAdded && (
          <MediaRow
            title="Recently Added"
            items={recentlyAdded.filter(
              (item) => item.type === currentType
            )}
            onSelect={handleSelect}
            displayMode={libraryDisplayMode}
          />
        )}

        {genreRows.map(([genre, genreItems]) => (
          <MediaRow
            key={genre}
            title={genre}
            items={genreItems}
            onSelect={handleSelect}
            displayMode={libraryDisplayMode}
          />
        ))}
      </>
    )
  }

  if (activeView === 'favorites') {
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

  return null
}


const renderCollectionDashboard = () => (
  <CollectionDashboard
    recentlyAdded={recentlyAdded}
    movies={movies}
    games={games}
    favorites={favorites}
    onSelect={handleSelect}
    onViewChange={setActiveView}
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
  onAddMedia={() =>
    setIsAddMediaOpen(true)
  }
  onAccount={() => {
    if (!user) {
      setIsAuthModalOpen(true)
    }
  }}

  userEmail={
    user?.email ?? null
  }
/>

      <main className="room-content">
<div className="room-glow room-glow-left" />
<div className="room-glow room-glow-right" />




{collectionLoading ? (
  <div className="collection-loading">
    Loading your collection...
  </div>
) : activeView === 'collectors' ? (
  <>
    <FindCollectors
      onSelectCollector={(userId) => {
        setSelectedCollectorId(userId)
      }}
    />

    {selectedCollectorId && (
      <p className="collector-selection-message">
        Collector selected. Public profile viewing
        will be available soon.
      </p>
    )}
  </>
) : activeView === 'profile' ? (
  <ProfilePage
    userId={user.id}
    userEmail={user.email ?? ''}
    collection={collection}
    onSignOut={() => void handleSignOut()}
    onSelectMedia={handleSelect}
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
) : (
  <div className="library">
    {renderLibrarySearch()}

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