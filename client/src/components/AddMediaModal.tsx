import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'

import type {
  MediaFormat,
  MediaItem,
  MediaOrientation,
  MediaType,
} from '../data/sampleMedia'

interface CustomOption {
  id: string
  label: string
}

interface AddMediaModalProps {
  onClose: () => void
  onAdd: (media: MediaItem) => void
  onSaveEdit?: (media: MediaItem) => Promise<boolean>

  editingMedia?: MediaItem | null

  customMovieGenres: CustomOption[]
  customGameGenres: CustomOption[]

  customMovieFormats: CustomOption[]
  customGameFormats: CustomOption[]

  onAddCustomGenre: (
  type: 'movie' | 'game',
  option: CustomOption,
) => Promise<CustomOption | null>

onAddCustomFormat: (
  type: 'movie' | 'game',
  option: CustomOption,
) => Promise<CustomOption | null>
}

interface ApiVideo {
  name: string
  videoId?: string
  provider?: string
  url?: string
}

interface ApiScreenshot {
  imageId: string
  width?: number | null
  height?: number | null
  url: string
}

interface ApiSearchResult {
  externalId: number
  title: string
  releaseDate: string | null
  year: number | null
  description: string

  posterImage?: string | null
  backdropImage?: string | null
  coverImage?: string | null

  genres?: string[]
  platforms?: string[]
  slug?: string | null

  rating?: number | null
  ratingCount?: number

  developers?: string[]
  publishers?: string[]

  gameModes?: string[]
  playerPerspectives?: string[]
  themes?: string[]

  screenshots?: ApiScreenshot[]
  videos?: ApiVideo[]
}

interface ApiMovieDetails extends ApiSearchResult {
  source: 'tmdb'

  originalTitle?: string

  runtime?: number | null

  directors?: string[]
  cast?: string[]

  productionCompanies?: string[]
  countries?: string[]
  languages?: string[]

  images?: {
    posters?: {
      filePath: string
      url: string
      width?: number
      height?: number
    }[]

    backdrops?: {
      filePath: string
      url: string
      width?: number
      height?: number
    }[]

    logos?: {
      filePath: string
      url: string
      width?: number
      height?: number
    }[]
  }
}

function isMovieDetails(
  value: ApiSearchResult | ApiMovieDetails | null,
): value is ApiMovieDetails {
  return (
    value !== null &&
    'source' in value &&
    value.source === 'tmdb'
  )
}



/* =========================================================
   GAME SEARCH - RESULT RANKING
   ========================================================= */

function rankGameSearchResults(
  results: ApiSearchResult[],
  searchTerm: string,
): ApiSearchResult[] {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')

  const query = normalize(searchTerm)

  const getScore = (result: ApiSearchResult) => {
    const title = normalize(result.title)

    // Exact title matches always appear first.
    if (title === query) return 0

    // Titles beginning with the search phrase.
    if (title.startsWith(`${query}:`)) return 1
    if (title.startsWith(`${query} `)) return 2

    // Titles containing the phrase elsewhere.
    if (title.includes(query)) return 3

    return 4
  }

  return [...results].sort((a, b) => {
    const scoreDifference =
      getScore(a) - getScore(b)

    if (scoreDifference !== 0) {
      return scoreDifference
    }

    // For equally relevant titles, show older
    // releases first.
    const yearA = a.year ?? 9999
    const yearB = b.year ?? 9999

    if (yearA !== yearB) {
      return yearA - yearB
    }

    return a.title.localeCompare(b.title)
  })
}


type AddMode =
  | 'automatic'
  | 'manual'

const BUILTIN_MOVIE_FORMATS: {
  value: MediaFormat
  label: string
}[] = [
  {
    value: 'vhs',
    label: 'VHS',
  },
  {
    value: 'dvd',
    label: 'DVD',
  },
  {
    value: 'bluray',
    label: 'Blu-ray',
  },
  {
    value: 'laserdisc',
    label: 'LaserDisc',
  },
]

const BUILTIN_GAME_FORMATS: {
  value: MediaFormat
  label: string
}[] = [
  {
    value: 'nes',
    label: 'NES',
  },
  {
    value: 'ps1',
    label: 'PlayStation',
  },
  {
    value: 'xbox360',
    label: 'Xbox 360',
  },
]

const BUILTIN_MOVIE_GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Drama',
  'Horror',
  'Sci-Fi',
]

const BUILTIN_GAME_GENRES = [
  'Action',
  'Adventure',
  'Indie',
  'Open World',
  'Puzzle',
  'RPG',
  'Strategy',
]




function AddMediaModal({
  onClose,
  onAdd,
    onSaveEdit,
  editingMedia,
  customMovieGenres,
  customGameGenres,
  customMovieFormats,
  customGameFormats,
  onAddCustomGenre,
  onAddCustomFormat,
}: AddMediaModalProps) {
  /* =========================================================
     GENERAL STATE
     ========================================================= */

const isEditing = Boolean(editingMedia)

const [mode, setMode] =
  useState<AddMode>(
    editingMedia ? 'manual' : 'automatic',
  )

  const [mediaType, setMediaType] =
    useState<MediaType>('movie')

  /* =========================================================
     AUTOMATIC MODE
     ========================================================= */

  
  
     const [search, setSearch] =
  useState('')

const [
  searchResults,
  setSearchResults,
] = useState<ApiSearchResult[]>([])

const [
  selectedAutomaticResult,
  setSelectedAutomaticResult,
] =
  useState<ApiSearchResult | null>(null)

const [
  isSearching,
  setIsSearching,
] = useState(false)

const [
  isLoadingDetails,
  setIsLoadingDetails,
] = useState(false)

const [
  isRefreshingMetadata,
  setIsRefreshingMetadata,
] = useState(false)

const [
  refreshMessage,
  setRefreshMessage,
] = useState('')

const [
  automaticError,
  setAutomaticError,
] = useState('')



const [
  isCustomizingAutomatic,
  setIsCustomizingAutomatic,
] = useState(false)

const [
  importedMetadata,
  setImportedMetadata,
] = useState<
  ApiSearchResult | ApiMovieDetails | null
>(null)





  /* =========================================================
     MANUAL MODE
     ========================================================= */

  const [manualTitle, setManualTitle] =
    useState('')

  const [manualYear, setManualYear] =
    useState('')

const [manualGenre, setManualGenre] =
  useState('')

const [manualGenres, setManualGenres] =
  useState<string[]>([])

const [manualFormat, setManualFormat] =
  useState<MediaFormat>(
    BUILTIN_MOVIE_FORMATS[0].value,
  )

const [manualFormats, setManualFormats] =
  useState<MediaFormat[]>([])

  const [
    manualDescription,
    setManualDescription,
  ] = useState('')

  const [manualFavorite, setManualFavorite] =
    useState(false)


    /* =========================================================
   PERSONAL REVIEW
   ========================================================= */

const [personalRating, setPersonalRating] =
  useState<number | null>(
    editingMedia?.personalRating ?? null
  )

const [personalReview, setPersonalReview] =
  useState(
    editingMedia?.personalReview ?? ''
  )

const [
  manualOrientation,
  setManualOrientation,
] = useState<MediaOrientation>('cover')

  /* =========================================================
     IMAGES
     ========================================================= */

  const [spineImage, setSpineImage] =
    useState<string | undefined>()

  const [coverImage, setCoverImage] =
    useState<string | undefined>()

  const spineInputRef =
    useRef<HTMLInputElement>(null)

  const coverInputRef =
    useRef<HTMLInputElement>(null)

    const selectedResultRef =
  useRef<HTMLDivElement>(null)

  const modalBodyRef =
  useRef<HTMLDivElement>(null)

  /* =========================================================
     CUSTOM GENRE / FORMAT UI
     ========================================================= */

  const [showNewGenre, setShowNewGenre] =
    useState(false)

  const [showNewFormat, setShowNewFormat] =
    useState(false)

  const [newGenre, setNewGenre] =
    useState('')

  const [newFormat, setNewFormat] =
    useState('')

  /* =========================================================
     AVAILABLE FORMATS
     ========================================================= */

  const formatOptions = useMemo(() => {
    const builtins =
      mediaType === 'movie'
        ? BUILTIN_MOVIE_FORMATS
        : BUILTIN_GAME_FORMATS

    const custom =
      mediaType === 'movie'
        ? customMovieFormats
        : customGameFormats

    return [
      ...builtins,
      ...custom.map((item) => ({
  value: item.label,
  label: item.label,
})),
    ]
  }, [
    mediaType,
    customMovieFormats,
    customGameFormats,
  ])

  /* =========================================================
     AVAILABLE GENRES
     ========================================================= */

  const genreOptions = useMemo(() => {
    const builtins =
      mediaType === 'movie'
        ? BUILTIN_MOVIE_GENRES
        : BUILTIN_GAME_GENRES

    const custom =
      mediaType === 'movie'
        ? customMovieGenres
        : customGameGenres

    return [
      ...builtins,
      ...custom.map(
        (item) => item.label,
      ),
    ]
  }, [
    mediaType,
    customMovieGenres,
    customGameGenres,
  ])


  useEffect(() => {
  if (!selectedAutomaticResult) return

  selectedResultRef.current?.scrollIntoView({
    behavior: 'smooth',
block: 'end',
  })
}, [selectedAutomaticResult])


/* =========================================================
   MULTI-SELECTION HELPERS
   ========================================================= */

const addSelectedGenre = (genre: string) => {
  if (!genre) return

  setManualGenres((current) =>
    current.some(
      (item) =>
        item.toLowerCase() === genre.toLowerCase(),
    )
      ? current
      : [...current, genre],
  )
}

const removeSelectedGenre = (genre: string) => {
  setManualGenres((current) =>
    current.filter((item) => item !== genre),
  )
}

const addSelectedFormat = (format: MediaFormat) => {
  if (!format) return

  setManualFormats((current) =>
    current.some(
      (item) =>
        item.toLowerCase() === format.toLowerCase(),
    )
      ? current
      : [...current, format],
  )
}

const removeSelectedFormat = (format: MediaFormat) => {
  setManualFormats((current) =>
    current.filter((item) => item !== format),
  )
}



/* =========================================================
   SCROLL TO TOP WHEN CUSTOMIZING
   ========================================================= */

useEffect(() => {
  if (!isCustomizingAutomatic) return

  const modal = document.querySelector(
    '.add-media-modal',
  )

  if (modal instanceof HTMLElement) {
    modal.scrollTo({
      top: 0,
      behavior: 'instant',
    })
  }

  modalBodyRef.current?.scrollTo({
    top: 0,
    behavior: 'instant',
  })
}, [isCustomizingAutomatic])
  /* =========================================================
     RESET TYPE-SPECIFIC VALUES
     ========================================================= */
useEffect(() => {
  if (!editingMedia) return

  setMediaType(editingMedia.type)
  setManualTitle(editingMedia.title)
  setManualYear(String(editingMedia.year))
  setManualGenre(editingMedia.genre)

setManualGenres(
  editingMedia.genres?.length
    ? [...editingMedia.genres]
    : [editingMedia.genre],
)

setManualFormat(editingMedia.format)

setManualFormats(
  editingMedia.formats?.length
    ? [...editingMedia.formats]
    : [editingMedia.format],
)
  setManualDescription(editingMedia.description)
  setManualFavorite(editingMedia.favorite)

setManualFavorite(editingMedia.favorite)

setPersonalRating(
  editingMedia.personalRating ?? null
)

setPersonalReview(
  editingMedia.personalReview ?? ''
)

setManualOrientation(editingMedia.orientation)

  setManualOrientation(editingMedia.orientation)
  setSpineImage(editingMedia.spineImage)
  setCoverImage(editingMedia.coverImage)
  setMode('manual')
}, [editingMedia])

useEffect(() => {
  if (editingMedia) return

  const firstFormat =
    mediaType === 'movie'
      ? BUILTIN_MOVIE_FORMATS[0].value
      : BUILTIN_GAME_FORMATS[0].value

  setManualFormat(firstFormat)
  setManualGenre('')

  setManualGenres([])
  setManualFormats([])

  setSelectedAutomaticResult(null)
  setSearchResults([])
  setAutomaticError('')
  setIsCustomizingAutomatic(false)
}, [editingMedia, mediaType])

  /* =========================================================
     AUTOMATIC SEARCH
     ========================================================= */

const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000'

const handleAutomaticSearch =
  async () => {
    const query = search.trim()

    if (!query) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setAutomaticError('')
    setSelectedAutomaticResult(null)

    try {
      const endpoint =
        mediaType === 'movie'
          ? '/api/media/search/movie'
          : '/api/media/search/game'

      const response = await fetch(
        `${API_BASE_URL}${endpoint}?q=${encodeURIComponent(
          query,
        )}`,
      )

      if (!response.ok) {
        throw new Error(
          `${mediaType === 'movie'
            ? 'Movie'
            : 'Game'} search failed with status ${response.status}`,
        )
      }

      const data =
        await response.json()

     
const results: ApiSearchResult[] =
  Array.isArray(data.results)
    ? data.results
    : []

setSearchResults(
  mediaType === 'game'
    ? rankGameSearchResults(results, query)
    : results
)

    } catch (error) {
      console.error(
        'Automatic media search failed:',
        error,
      )

      setSearchResults([])

      setAutomaticError(
        'Unable to search for media right now.',
      )
    } finally {
      setIsSearching(false)
    }
  }

  /* =========================================================
     MEDIA TYPE SWITCH
     ========================================================= */

  const switchMediaType = (
    type: MediaType,
  ) => {
    setMediaType(type)

setSelectedAutomaticResult(null)
setImportedMetadata(null)
setSearchResults([])
setAutomaticError('')
    const formats =
      type === 'movie'
        ? BUILTIN_MOVIE_FORMATS
        : BUILTIN_GAME_FORMATS

    setManualFormat(
      formats[0].value,
    )

    setManualGenre('')

    setSearch('')
  }

  /* =========================================================
     IMAGE UPLOAD
     ========================================================= */

  const handleImageUpload = (
    event: ChangeEvent<HTMLInputElement>,
    setImage: (
      value: string | undefined,
    ) => void,
  ) => {
    const file =
      event.target.files?.[0]

    if (!file) {
      return
    }

    if (
      !file.type.startsWith('image/')
    ) {
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      if (
        typeof reader.result ===
        'string'
      ) {
        setImage(reader.result)
      }
    }

    reader.readAsDataURL(file)

    /*
     * Allows selecting the same file again
     * after removing/changing it.
     */
    event.target.value = ''
  }

  /* =========================================================
     CUSTOM GENRE
     ========================================================= */

const addCustomGenre = async () => {
  const label = newGenre.trim()

  if (!label) return

  const existingGenre = genreOptions.find(
    (genre) =>
      genre.toLowerCase() === label.toLowerCase(),
  )

  if (existingGenre) {
    setManualGenre(existingGenre)
    setNewGenre('')
    setShowNewGenre(false)
    addSelectedGenre(existingGenre)
    return
  }

  const savedOption = await onAddCustomGenre(
    mediaType,
    {
      id: crypto.randomUUID(),
      label,
    },
  )

  if (!savedOption) return

  setManualGenre(savedOption.label)
  addSelectedGenre(savedOption.label)
  setNewGenre('')
  setShowNewGenre(false)
}

  /* =========================================================
     CUSTOM FORMAT
     ========================================================= */

const addCustomFormat = async () => {
  const label = newFormat.trim()

  if (!label) return

  const existingFormat = formatOptions.find(
    (format) =>
      format.label.toLowerCase() ===
      label.toLowerCase(),
  )

 if (existingFormat) {
  setManualFormat(existingFormat.value)
  addSelectedFormat(existingFormat.value)
  setNewFormat('')
  setShowNewFormat(false)
  return
}

  const savedOption = await onAddCustomFormat(
    mediaType,
    {
      id: crypto.randomUUID(),
      label,
    },
  )

  if (!savedOption) return

  setManualFormat(savedOption.label)
  setNewFormat('')
  setShowNewFormat(false)
}

  /* =========================================================
     AUTOMATIC SELECTION
     ========================================================= */
const handleAutomaticSelect =
  async (
    result: ApiSearchResult,
  ) => {
    setSelectedAutomaticResult(result)
setImportedMetadata(result)
setAutomaticError('')

    /*
     * MOVIE
     * -----
     * TMDB search results need a second request
     * to get the richer movie information.
     */
    if (mediaType === 'movie') {
      setIsLoadingDetails(true)

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/media/movie/${result.externalId}`,
        )

        if (!response.ok) {
          throw new Error(
            `Movie details failed with status ${response.status}`,
          )
        }

        const details: ApiMovieDetails =
          await response.json()

          setImportedMetadata(details)

        setManualTitle(
          details.title ?? '',
        )

        setManualYear(
          details.year
            ? String(details.year)
            : '',
        )

        setManualDescription(
          details.description ?? '',
        )

        setCoverImage(
          details.posterImage ??
            undefined,
        )

  const matchingGenres = (
  details.genres ?? []
)
  .map((genre) =>
    genreOptions.find(
      (option) =>
        option.toLowerCase() ===
        genre.toLowerCase(),
    ),
  )
  .filter((genre): genre is string =>
    Boolean(genre),
  )

setManualGenres([...new Set(matchingGenres)])
setManualGenre(matchingGenres[0] ?? '')
      } catch (error) {
        console.error(
          'Automatic movie detail lookup failed:',
          error,
        )

        setAutomaticError(
          'The title was found, but its detailed information could not be loaded.',
        )
      } finally {
        setIsLoadingDetails(false)
      }

      return
    }

    /*
     * GAME
     * ----
     * IGDB search results already contain the
     * basic information we need, so no second
     * request is required yet.
     */
    setManualTitle(
      result.title ?? '',
    )

    setManualYear(
      result.year
        ? String(result.year)
        : '',
    )

    setManualDescription(
      result.description ?? '',
    )

    setCoverImage(
      result.coverImage ??
        undefined,
    )

    const matchingGameGenres = (
  result.genres ?? []
)
  .map((genre) =>
    genreOptions.find(
      (option) =>
        option.toLowerCase() ===
        genre.toLowerCase(),
    ),
  )
  .filter((genre): genre is string =>
    Boolean(genre),
  )

setManualGenres([
  ...new Set(matchingGameGenres),
])

setManualGenre(
  matchingGameGenres[0] ?? '',
)
  }

  /* =========================================================
     AUTOMATIC ADD
     ========================================================= */

  /* =========================================================
   REFRESH EXISTING MOVIE METADATA
   ========================================================= */

const handleRefreshMovieMetadata = async () => {
  if (
    !editingMedia ||
    editingMedia.type !== 'movie' ||
    !editingMedia.externalId
  ) {
    setRefreshMessage(
      'This movie does not have a TMDB ID.',
    )
    return
  }

  setIsRefreshingMetadata(true)
  setRefreshMessage('')

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/media/movie/${encodeURIComponent(
        editingMedia.externalId,
      )}`,
    )

    if (!response.ok) {
      throw new Error(
        `TMDB request failed: ${response.status}`,
      )
    }

    const details: ApiMovieDetails =
      await response.json()

    setImportedMetadata(details)

    setRefreshMessage(
      'Metadata retrieved. Save Changes to apply the update.',
    )
  } catch (error) {
    console.error(
      'Failed to refresh movie metadata:',
      error,
    )

    setRefreshMessage(
      'Unable to refresh metadata. Please try again.',
    )
  } finally {
    setIsRefreshingMetadata(false)
  }
}

  /* =========================================================
     MANUAL ADD
     ========================================================= */

const handleManualAdd = async () => {
      const trimmedTitle =
      manualTitle.trim()

    if (!trimmedTitle) {
      return
    }

    const year =
      Number(manualYear) ||
      new Date().getFullYear()


      const finalGenres =
  manualGenres.length > 0
    ? manualGenres
    : [manualGenre || genreOptions[0] || 'Uncategorized']

const finalFormats =
  manualFormats.length > 0
    ? manualFormats
    : [manualFormat]

const newMedia: MediaItem = {
  ...(editingMedia ?? {}),

  id: editingMedia?.id ?? crypto.randomUUID(),
      title: trimmedTitle,

      type: mediaType,

      format: finalFormats[0],
formats: finalFormats,

year,

genre: finalGenres[0],
genres: finalGenres,

      description:
        manualDescription.trim() ||
        'No description has been added yet.',

favorite: manualFavorite,

personalRating,
personalReview: personalReview.trim() || null,

reviewUpdatedAt:
  personalRating !== (editingMedia?.personalRating ?? null) ||
  personalReview.trim() !==
    (editingMedia?.personalReview ?? '').trim()
    ? personalRating !== null ||
      personalReview.trim()
      ? new Date().toISOString()
      : null
    : editingMedia?.reviewUpdatedAt ?? null,

orientation: manualOrientation,

spineImage,

coverImage,

source:
  editingMedia?.source ??
  (mode === 'automatic'
    ? mediaType === 'movie'
      ? 'tmdb'
      : 'igdb'
    : 'manual'),

externalId:
  editingMedia?.externalId ??
  (mode === 'automatic' && selectedAutomaticResult
    ? String(selectedAutomaticResult.externalId)
    : undefined),

releaseDate:
  editingMedia?.releaseDate ??
  importedMetadata?.releaseDate ??
  undefined,

rating:
  editingMedia?.rating ??
  importedMetadata?.rating ??
  undefined,

  /* =====================================================
   IMPORTED MOVIE METADATA
   ===================================================== */

runtime:
  editingMedia?.runtime ??
  (isMovieDetails(importedMetadata)
    ? importedMetadata.runtime ?? undefined
    : undefined),

director:
  editingMedia?.director ??
  (isMovieDetails(importedMetadata)
    ? importedMetadata.directors?.join(', ')
    : undefined),

cast:
  editingMedia?.cast ??
  (isMovieDetails(importedMetadata)
    ? importedMetadata.cast
    : undefined),

productionCompanies:
  editingMedia?.productionCompanies ??
  (isMovieDetails(importedMetadata)
    ? importedMetadata.productionCompanies
    : undefined),

countries:
  editingMedia?.countries ??
  (isMovieDetails(importedMetadata)
    ? importedMetadata.countries
    : undefined),

languages:
  editingMedia?.languages ??
  (isMovieDetails(importedMetadata)
    ? importedMetadata.languages
    : undefined),

backdropImage:
  editingMedia?.backdropImage ??
  importedMetadata?.backdropImage ??
  undefined,

logoImage:
  editingMedia?.logoImage ??
  (isMovieDetails(importedMetadata)
    ? importedMetadata.images?.logos?.[0]?.url
    : undefined),

platforms:
  editingMedia?.platforms ??
  (mediaType === 'game'
    ? importedMetadata?.platforms
    : undefined),

developers:
  editingMedia?.developers ??
  (mediaType === 'game'
    ? importedMetadata?.developers
    : undefined),

publishers:
  editingMedia?.publishers ??
  (mediaType === 'game'
    ? importedMetadata?.publishers
    : undefined),

gameModes:
  editingMedia?.gameModes ??
  (mediaType === 'game'
    ? importedMetadata?.gameModes
    : undefined),

playerPerspectives:
  editingMedia?.playerPerspectives ??
  (mediaType === 'game'
    ? importedMetadata?.playerPerspectives
    : undefined),

themes:
  editingMedia?.themes ??
  (mediaType === 'game'
    ? importedMetadata?.themes
    : undefined),

screenshots:
  editingMedia?.screenshots ??
  (mediaType === 'game'
    ? importedMetadata?.screenshots
        ?.map((screenshot) => screenshot.url)
        .filter(Boolean)
    : isMovieDetails(importedMetadata)
      ? importedMetadata.images?.backdrops
          ?.map((image) => image.url)
          .filter(Boolean)
      : undefined),

videos:
  editingMedia?.videos ??
  importedMetadata?.videos?.map((video) => ({
    name: video.name,
    provider: video.provider,
    videoId: video.videoId,
    url: video.url,
  })),
}

    if (editingMedia) {
  if (!onSaveEdit) {
    window.alert('Editing is not configured.')
    return
  }

  const saved = await onSaveEdit(newMedia)

  if (saved) {
    onClose()
  }

  return
}

onAdd(newMedia)
onClose()
  }

  /* =========================================================
     LIVE PREVIEW DATA
     ========================================================= */

 

  return (
    <div
      className="add-media-backdrop"
      onClick={onClose}
    >
      <section
        className="add-media-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* =================================================
            HEADER
            ================================================= */}

        <header className="add-media-header">
          <div>
            <p className="add-media-eyebrow">
              MEDIA LIBRARY
            </p>

<h2>{isEditing ? 'Edit Media' : 'Add Media'}</h2>
          <p>
  {isEditing
    ? 'Update the details of your collection item.'
    : 'Add something to your physical collection.'}
</p>
          </div>

          <button
            type="button"
            className="add-media-close"
            onClick={onClose}
            aria-label="Close add media"
          >
            ×
          </button>
        </header>

<div
  className="add-media-body"
  ref={modalBodyRef}
>
          
          {!isEditing && (
  <>

          
          {/* =================================================
              MEDIA TYPE
              ================================================= */}

         <section className="add-media-section">
  <div className="add-media-section-heading">
    <span>01</span>

    <strong>
      What are you adding?
    </strong>
  </div>

  <div className="media-type-switch">
    <button
      type="button"
      className={
        mediaType === 'movie'
          ? 'active'
          : ''
      }
      onClick={() =>
        switchMediaType('movie')
      }
    >
      <strong>Movie</strong>

      <span>
        VHS, DVD, Blu-ray,
        LaserDisc
      </span>
    </button>

    <button
      type="button"
      className={
        mediaType === 'game'
          ? 'active'
          : ''
      }
      onClick={() =>
        switchMediaType('game')
      }
    >
      <strong>Video Game</strong>

      <span>
        NES, PlayStation, Xbox
      </span>
    </button>
  </div>
</section>

          {/* =================================================
              ADD MODE
              ================================================= */}

          <section className="add-media-section">
            <div className="add-media-section-heading">
              <span>02</span>

              <strong>
                How would you like to add it?
              </strong>
            </div>

            <div className="add-mode-switch">
              <button
                type="button"
                className={
                  mode === 'automatic'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setMode(
                    'automatic',
                  )
                }
              >
                <strong>
                  Automatic
                </strong>

                <span>
                  Find a title and populate
                  the basics.
                </span>
              </button>

              <button
                type="button"
                className={
                  mode === 'manual'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setMode('manual')
                }
              >
                <strong>
                  Manual
                </strong>

                <span>
                  Build the item yourself.
                </span>
              </button>
            </div>
          </section>

            </>
)}

          {/* =================================================
              AUTOMATIC MODE
              ================================================= */}

          {mode === 'automatic' && (
  <section className="add-media-section">
    <div className="add-media-section-heading">
      <span>03</span>

      <strong>
        {isCustomizingAutomatic
          ? 'Customize Imported Media'
          : `Find ${
              mediaType === 'movie'
                ? 'a Movie'
                : 'a Game'
            }`}
      </strong>
    </div>

    {!isCustomizingAutomatic && (
      <>
        <div className="automatic-search">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            onKeyDown={(event) => {
              if (
                event.key === 'Enter'
              ) {
                void handleAutomaticSearch()
              }
            }}
            placeholder={
              mediaType === 'movie'
                ? 'Search for a movie...'
                : 'Search for a game...'
            }
          />

          <button
            type="button"
            className="automatic-search-button"
            onClick={() =>
              void handleAutomaticSearch()
            }
            disabled={
              isSearching ||
              !search.trim()
            }
          >
            {isSearching
              ? 'Searching...'
              : 'Search'}
          </button>
        </div>

        <div className="automatic-results">
          {searchResults.map(
            (result) => (
              <button
                key={result.externalId}
                type="button"
                className={`automatic-result ${
                  selectedAutomaticResult?.externalId ===
                  result.externalId
                    ? 'selected'
                    : ''
                }`}
                onClick={() =>
                  void handleAutomaticSelect(
                    result,
                  )
                }
              >
                <span
  className="result-cover"
  style={
    (
      result.posterImage ??
      result.coverImage
    )
      ? {
          backgroundImage:
            `url("${
              result.posterImage ??
              result.coverImage
            }")`,
          backgroundSize:
            'cover',
          backgroundPosition:
            'center',
        }
      : undefined
  }
>
  {!result.posterImage &&
    !result.coverImage &&
    (mediaType === 'movie'
      ? 'FILM'
      : 'GAME')}
</span>

                <span className="result-info">
                  <strong>
                    {result.title}
                  </strong>

                  <span>
                    {result.year ??
                      'Unknown year'}
                  </span>
                </span>

                <span className="result-check">
                  {selectedAutomaticResult?.externalId ===
                  result.externalId
                    ? '✓'
                    : '＋'}
                </span>
              </button>
            ),
          )}

          {isLoadingDetails && (
            <div className="empty-search">
              Loading title details...
            </div>
          )}

          {automaticError && (
            <div className="empty-search">
              {automaticError}
            </div>
          )}

          {!isSearching &&
            !automaticError &&
            search.trim() &&
            searchResults.length === 0 && (
              <div className="empty-search">
                No results found.
              </div>
            )}
        </div>

        {selectedAutomaticResult && (
  <div
    className="automatic-import-preview"
    ref={selectedResultRef}
  >
            <div className="automatic-import-art">
  {(
    selectedAutomaticResult.posterImage ??
    selectedAutomaticResult.coverImage
  ) ? (
    <img
      src={
        selectedAutomaticResult.posterImage ??
        selectedAutomaticResult.coverImage ??
        ''
      }
      alt=""
    />
  ) : (
    <span>
      {mediaType === 'movie'
        ? 'FILM'
        : 'GAME'}
    </span>
  )}
</div>

            <div className="automatic-import-info">
              <span>
                {mediaType === 'movie'
  ? 'TMDB RESULT'
  : 'IGDB RESULT'}
              </span>

              <strong>
                {
                  selectedAutomaticResult.title
                }
              </strong>

              <p>
                {
                  selectedAutomaticResult.year ??
                    'Unknown year'
                }
                {' · '}
                Imported metadata ready
                to customize
              </p>

              <button
                type="button"
                onClick={() =>
                  setIsCustomizingAutomatic(
                    true,
                  )
                }
              >
                Customize &amp; Add
              </button>
            </div>
          </div>
        )}
      </>
    )}

  </section>
)}
          {/* =================================================
              MANUAL MODE
              ================================================= */}

          {(mode === 'manual' ||
  (mode === 'automatic' &&
    isCustomizingAutomatic)) && (
            <>
              {/* ===============================================
                  BASIC DETAILS
                  =============================================== */}

              <section className="add-media-section">
                <div className="add-media-section-heading">
                  <span>03</span>

                  <strong>
                    Enter Media Details
                  </strong>
                </div>

                <div className="manual-form">

                {isEditing &&
  editingMedia?.type === 'movie' && (
    <div className="metadata-refresh-panel">
      <div>
        <strong>TMDB Movie Metadata</strong>

        <p>
          Retrieve updated cast, crew, runtime,
          production information, artwork,
          and trailers.
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          void handleRefreshMovieMetadata()
        }
        disabled={isRefreshingMetadata}
      >
        {isRefreshingMetadata
          ? 'Refreshing...'
          : 'Refresh Metadata'}
      </button>

      {refreshMessage && (
        <p className="metadata-refresh-message">
          {refreshMessage}
        </p>
      )}
    </div>
  )}

                  {/* TITLE */}

                  <label>
                    <span>
                      Title
                    </span>

                    <input
                      type="text"
                      value={
                        manualTitle
                      }
                      onChange={(
                        event,
                      ) =>
                        setManualTitle(
                          event.target
                            .value,
                        )
                      }
                      placeholder={
                        mediaType ===
                        'movie'
                          ? 'Movie title'
                          : 'Game title'
                      }
                    />
                  </label>

                  {/* YEAR + GENRE */}

                  <div className="form-grid">

                    <label>
                      <span>
                        Release Year
                      </span>

                      <input
                        type="number"
                        value={
                          manualYear
                        }
                        onChange={(
                          event,
                        ) =>
                          setManualYear(
                            event.target
                              .value,
                          )
                        }
                        placeholder="1999"
                      />
                    </label>

                    <div className="multi-select-field">
  <span>Genres</span>

  <div className="select-with-action">
    <select
      value={manualGenre}
      onChange={(event) =>
        setManualGenre(event.target.value)
      }
    >
      <option value="">Select genre</option>

      {genreOptions.map((genre) => (
        <option key={genre} value={genre}>
          {genre}
        </option>
      ))}
    </select>

    <button
  type="button"
  className="field-add-button"
  onClick={() => addSelectedGenre(manualGenre)}
  disabled={!manualGenre}
  title="Add selected genre"
>
  Add
</button>

    <button
      type="button"
      className="field-add-button"
      onClick={() =>
        setShowNewGenre((current) => !current)
      }
      title="Create custom genre"
    >
      +
    </button>
  </div>

  <div className="multi-selected-options">
    {manualGenres.map((genre) => (
      <span className="multi-selected-tag" key={genre}>
        {genre}

        <button
          type="button"
          onClick={() => removeSelectedGenre(genre)}
          aria-label={`Remove ${genre}`}
        >
          ×
        </button>
      </span>
    ))}
  </div>
</div>
                  </div>

                  {/* NEW GENRE */}

                  {showNewGenre && (
                    <div className="custom-option-editor">
                      <input
                        type="text"
                        value={
                          newGenre
                        }
                        onChange={(
                          event,
                        ) =>
                          setNewGenre(
                            event.target
                              .value,
                          )
                        }
                        placeholder="New genre name"
                        autoFocus
                      />

                      <button
                        type="button"
                        onClick={
                          addCustomGenre
                        }
                      >
                        Add Genre
                      </button>
                    </div>
                  )}

                  {/* FORMAT */}

                <div className="multi-select-field">
  <span>Physical Formats Owned</span>

  <div className="select-with-action">
    <select
      value={manualFormat}
      onChange={(event) =>
        setManualFormat(
          event.target.value as MediaFormat,
        )
      }
    >
      {formatOptions.map((format) => (
        <option
          key={format.value}
          value={format.value}
        >
          {format.label}
        </option>
      ))}
    </select>

    <button
      type="button"
      className="field-add-button"
      onClick={() =>
        addSelectedFormat(manualFormat)
      }
      title="Add selected format"
    >
      Add
    </button>

    <button
      type="button"
      className="field-add-button"
      onClick={() =>
        setShowNewFormat((current) => !current)
      }
      title="Create custom format"
    >
      +
    </button>
  </div>

  <div className="multi-selected-options">
    {manualFormats.map((format) => {
      const label =
        formatOptions.find(
          (option) => option.value === format,
        )?.label ?? format

      return (
        <span
          className="multi-selected-tag"
          key={format}
        >
          {label}

          <button
            type="button"
            onClick={() =>
              removeSelectedFormat(format)
            }
            aria-label={`Remove ${label}`}
          >
            ×
          </button>
        </span>
      )
    })}
  </div>
</div>

                  {/* NEW FORMAT */}

                  {showNewFormat && (
                    <div className="custom-option-editor">
                      <input
                        type="text"
                        value={
                          newFormat
                        }
                        onChange={(
                          event,
                        ) =>
                          setNewFormat(
                            event.target
                              .value,
                          )
                        }
                        placeholder="New format name"
                        autoFocus
                      />

                      <button
                        type="button"
                        onClick={
                          addCustomFormat
                        }
                      >
                        Add Format
                      </button>
                    </div>
                  )}

                  {/* DESCRIPTION */}

                  <label>
                    <span>
                      Description
                    </span>

                    <textarea
                      value={
                        manualDescription
                      }
                      onChange={(
                        event,
                      ) =>
                        setManualDescription(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Add a short description..."
                      rows={4}
                    />
                  </label>

                </div>
              </section>

              {/* ===============================================
                  IMPORTED GAME INFORMATION
                  =============================================== */}

              {mode === 'automatic' &&
                mediaType === 'game' &&
                importedMetadata && (
                  <section className="add-media-section imported-media-section">
                    <div className="add-media-section-heading">
                      <span>04</span>

                      <strong>
                        Imported Game Information
                      </strong>
                    </div>

                    <div className="imported-game-panel">
                      <div className="imported-game-header">
                        <div>
                          <span className="imported-label">
                            IGDB METADATA
                          </span>

                          <h3>
                            {importedMetadata.title}
                          </h3>

                          <p>
                            {importedMetadata.year ??
                              'Unknown year'}
                            {' · '}
                            {importedMetadata.genres
                              ?.join(' · ') ||
                              'No genres available'}
                          </p>
                        </div>

                        {importedMetadata.rating != null && (
                          <div className="imported-rating">
                            <span>IGDB RATING</span>

                            <strong>
                              {importedMetadata.rating.toFixed(
                                1,
                              )}
                            </strong>

                            <small>
                              / 100
                            </small>
                          </div>
                        )}
                      </div>

                      <div className="imported-info-grid">
                        {importedMetadata.developers &&
                          importedMetadata.developers.length >
                            0 && (
                            <div className="imported-info-card">
                              <span>
                                Developer
                              </span>

                              <strong>
                                {importedMetadata.developers.join(
                                  ', ',
                                )}
                              </strong>
                            </div>
                          )}

                        {importedMetadata.publishers &&
                          importedMetadata.publishers.length >
                            0 && (
                            <div className="imported-info-card">
                              <span>
                                Publisher
                              </span>

                              <strong>
                                {importedMetadata.publishers.join(
                                  ', ',
                                )}
                              </strong>
                            </div>
                          )}

                        {importedMetadata.platforms &&
                          importedMetadata.platforms.length >
                            0 && (
                            <div className="imported-info-card">
                              <span>
                                Platforms
                              </span>

                              <strong>
                                {importedMetadata.platforms.join(
                                  ' · ',
                                )}
                              </strong>
                            </div>
                          )}

                        {importedMetadata.gameModes &&
                          importedMetadata.gameModes.length >
                            0 && (
                            <div className="imported-info-card">
                              <span>
                                Game Modes
                              </span>

                              <strong>
                                {importedMetadata.gameModes.join(
                                  ' · ',
                                )}
                              </strong>
                            </div>
                          )}

                        {importedMetadata.playerPerspectives &&
                          importedMetadata.playerPerspectives.length >
                            0 && (
                            <div className="imported-info-card">
                              <span>
                                Perspective
                              </span>

                              <strong>
                                {importedMetadata.playerPerspectives.join(
                                  ' · ',
                                )}
                              </strong>
                            </div>
                          )}

                        {importedMetadata.themes &&
                          importedMetadata.themes.length >
                            0 && (
                            <div className="imported-info-card">
                              <span>
                                Themes
                              </span>

                              <strong>
                                {importedMetadata.themes.join(
                                  ' · ',
                                )}
                              </strong>
                            </div>
                          )}
                      </div>

                      {importedMetadata.screenshots &&
                        importedMetadata.screenshots.length >
                          0 && (
                          <div className="imported-media-group">
                            <div className="imported-media-heading">
                              <span>
                                SCREENSHOTS
                              </span>

                              <small>
                                {
                                  importedMetadata
                                    .screenshots
                                    .length
                                }{' '}
                                available
                              </small>
                            </div>

                            <div className="imported-screenshot-grid">
                              {importedMetadata.screenshots.map(
                                (screenshot) => (
                                  <div
                                    key={
                                      screenshot.imageId
                                    }
                                    className="imported-screenshot"
                                  >
                                    <img
                                      src={
                                        screenshot.url
                                      }
                                      alt=""
                                    />
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {importedMetadata.videos &&
                        importedMetadata.videos.length >
                          0 && (
                          <div className="imported-media-group">
                            <div className="imported-media-heading">
                              <span>
                                VIDEOS
                              </span>

                              <small>
                                {
                                  importedMetadata
                                    .videos.length
                                }{' '}
                                available
                              </small>
                            </div>

                            <div className="imported-video-list">
                              {importedMetadata.videos.map(
                                (video) => (
                                  <a
                                    key={
                                      video.videoId ??
                                      video.url ??
                                      video.name
                                    }
                                    href={video.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="imported-video-card"
                                  >
                                    <span className="imported-video-icon">
                                      ▶
                                    </span>

                                    <span>
                                      {video.name ||
                                        'Game Video'}
                                    </span>
                                  </a>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </section>
                )}

           



              {/* ===============================================
                  APPEARANCE
                  =============================================== */}

              <section className="add-media-section">

                <div className="add-media-section-heading">
                  <span>04</span>

                  <strong>
                    Appearance
                  </strong>
                </div>

                <div className="appearance-layout">

                  {/* -------------------------------------------
                      APPEARANCE CONTROLS
                      ------------------------------------------- */}

                  <div className="appearance-fields">

                    <div className="image-upload-grid">

                      {/* SPINE */}

                      <div className="image-upload-card">
                        <div>
                          <span>
                            SPINE ARTWORK
                          </span>

                          <strong>
                            {spineImage
                              ? 'Image selected'
                              : 'Optional'}
                          </strong>
                        </div>

                        <div className="image-upload-actions">

                          {spineImage && (
                            <button
                              type="button"
                              className="remove-image"
                              onClick={() =>
                                setSpineImage(
                                  undefined,
                                )
                              }
                            >
                              Remove
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              spineInputRef.current?.click()
                            }
                          >
                            {spineImage
                              ? 'Change'
                              : 'Upload'}
                          </button>

                          <input
                            ref={
                              spineInputRef
                            }
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(
                              event,
                            ) =>
                              handleImageUpload(
                                event,
                                setSpineImage,
                              )
                            }
                          />

                        </div>
                      </div>

                      {/* COVER */}

                      <div className="image-upload-card">
                        <div>
                          <span>
                            COVER ARTWORK
                          </span>

                          <strong>
                            {coverImage
                              ? 'Image selected'
                              : 'Optional'}
                          </strong>
                        </div>

                        <div className="image-upload-actions">

                          {coverImage && (
                            <button
                              type="button"
                              className="remove-image"
                              onClick={() =>
                                setCoverImage(
                                  undefined,
                                )
                              }
                            >
                              Remove
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              coverInputRef.current?.click()
                            }
                          >
                            {coverImage
                              ? 'Change'
                              : 'Upload'}
                          </button>

                          <input
                            ref={
                              coverInputRef
                            }
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(
                              event,
                            ) =>
                              handleImageUpload(
                                event,
                                setCoverImage,
                              )
                            }
                          />

                        </div>
                      </div>

                    </div>

                    {/* FAVORITE + ORIENTATION */}

                    <div className="manual-options">

                      <label className="checkbox-field">
                        <input
                          type="checkbox"
                          checked={
                            manualFavorite
                          }
                          onChange={(
                            event,
                          ) =>
                            setManualFavorite(
                              event.target
                                .checked,
                            )
                          }
                        />

                        <span>
                          Add to favorites
                        </span>
                      </label>

                      <div className="orientation-field">
                      

                        <div>


                        </div>
                      </div>

                    </div>

                  </div>

                  

                </div>

                {/* ADD BUTTON */}

                <button
                  type="button"
                  className="manual-submit"
                  onClick={
                    handleManualAdd
                  }
                  disabled={
                    !manualTitle.trim()
                  }
                >
{isEditing ? 'Save Changes' : 'Add to Collection'}
                </button>

              </section>


{/* =================================================
    PERSONAL REVIEW
    ================================================= */}

<section className="add-media-section">
  <div className="add-media-section-heading">
    <span>05</span>
    <strong>Personal Review</strong>
  </div>

  <div className="add-media-review">
    <p className="add-media-review-description">
      Optionally rate this title and add your thoughts.
      You can always update your review later.
    </p>

    <div className="add-media-review-rating">
      <label>Your Rating</label>

      <div className="add-media-review-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={
              star <= (personalRating ?? 0)
                ? 'add-review-star active'
                : 'add-review-star'
            }
            onClick={() =>
              setPersonalRating(
                personalRating === star
                  ? null
                  : star
              )
            }
            aria-label={`Rate ${star} stars`}
            aria-pressed={personalRating === star}
          >
            ★
          </button>
        ))}

        <span className="add-review-rating-value">
          {personalRating !== null
            ? `${personalRating} / 5`
            : 'Not rated'}
        </span>
      </div>
    </div>

    <div className="add-media-review-text">
      <label htmlFor="add-media-personal-review">
        Your Thoughts
      </label>

      <textarea
        id="add-media-personal-review"
        value={personalReview}
        onChange={(event) =>
          setPersonalReview(event.target.value)
        }
        placeholder="What did you think of this title?"
        rows={4}
      />
    </div>
  </div>
</section>



            </>
          )}

        </div>
      </section>
    </div>
  )
}

export default AddMediaModal