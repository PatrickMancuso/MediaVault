
import { useMemo, useState } from 'react'
import MediaSpine from './MediaSpine'
import type { MediaItem } from '../data/sampleMedia'

interface MediaLibraryProps {
  title: string
  items: MediaItem[]
  onSelect: (media: MediaItem) => void
}

type SortMode =
  | 'title-asc'
  | 'title-desc'
  | 'year-new'
  | 'year-old'

type FilterName = 'genre' | 'format' | 'decade'

const formatLabels: Record<string, string> = {
  vhs: 'VHS',
  dvd: 'DVD',
  bluray: 'Blu-ray',
  'blu-ray': 'Blu-ray',
  laserdisc: 'LaserDisc',
  vinyl: 'Vinyl',
  cd: 'CD',
  cassette: 'Cassette',
  hardcover: 'Hardcover',
  paperback: 'Paperback',
  ps1: 'PS1',
  ps2: 'PS2',
  ps3: 'PS3',
  ps4: 'PS4',
  ps5: 'PS5',
  nes: 'NES',
  snes: 'SNES',
  n64: 'Nintendo 64',
  switch: 'Nintendo Switch',
  xbox360: 'Xbox 360',
}

const displayFormat = (format: string) =>
  formatLabels[format.toLowerCase()] ?? format

function MediaLibrary({
  title,
  items,
  onSelect,
}: MediaLibraryProps) {
  const [search, setSearch] = useState('')
  const [genres, setGenres] = useState<string[]>([])
  const [formats, setFormats] = useState<string[]>([])
  const [decades, setDecades] = useState<string[]>([])
  const [sortMode, setSortMode] =
    useState<SortMode>('title-asc')

  type DisplayMode = 'cover' | 'spine' | 'list'

const [displayMode, setDisplayMode] =
  useState<DisplayMode>('cover')

const [openFilter, setOpenFilter] =
  useState<FilterName | null>(null)

const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
  if (!openFilter) return

  const handlePointerDown = (event: PointerEvent) => {
    const target = event.target

if (!(target instanceof Element)) return

const activeDropdown =
  toolbarRef.current?.querySelector(
    `[data-filter-name="${openFilter}"]`
  )

if (
  !activeDropdown ||
  !activeDropdown.contains(target)
) {
  setOpenFilter(null)
}
  }

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setOpenFilter(null)
    }
  }

  document.addEventListener(
    'pointerdown',
    handlePointerDown
  )

  document.addEventListener(
    'keydown',
    handleEscape
  )

  return () => {
    document.removeEventListener(
      'pointerdown',
      handlePointerDown
    )

    document.removeEventListener(
      'keydown',
      handleEscape
    )
  }
}, [openFilter])

  const mediaType = items[0]?.type

  const isMusic = mediaType === 'music'

  /* =========================================
     AVAILABLE FILTER OPTIONS
     ========================================= */

  const genreOptions = useMemo(
    () =>
      Array.from(
        new Set(
          items.flatMap((item) =>
            item.genres?.length
              ? item.genres
              : item.genre
                ? [item.genre]
                : []
          ).filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [items]
  )

  const formatOptions = useMemo(
    () =>
      Array.from(
        new Set(
          items.flatMap((item) =>
            item.formats?.length
              ? item.formats
              : item.format
                ? [item.format]
                : []
          ).filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [items]
  )

  const decadeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .filter((item) =>
              Number.isFinite(item.year) &&
              item.year > 0
            )
            .map((item) =>
              String(
                Math.floor(item.year / 10) * 10
              )
            )
        )
      ).sort((a, b) => Number(b) - Number(a)),
    [items]
  )

  /* =========================================
     MULTI-SELECT HANDLER
     ========================================= */

  const toggleFilter = (
    value: string,
    selected: string[],
    setter: (values: string[]) => void
  ) => {
    setter(
      selected.includes(value)
        ? selected.filter((entry) => entry !== value)
        : [...selected, value]
    )
  }

  const clearFilters = () => {
    setSearch('')
    setGenres([])
    setFormats([])
    setDecades([])
    setSortMode('title-asc')
  }

  const activeFilterCount =
    genres.length + formats.length + decades.length

  /* =========================================
     FILTER AND SORT COLLECTION
     ========================================= */

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()

    return items
      .filter((item) => {
        const itemGenres =
          item.genres?.length
            ? item.genres
            : item.genre
              ? [item.genre]
              : []

        const itemFormats =
          item.formats?.length
            ? item.formats
            : item.format
              ? [item.format]
              : []

        const searchable = [
          item.title,
          String(item.year),
          ...itemGenres,
          ...itemFormats,
        ].join(' ').toLowerCase()

        const matchesSearch =
          !query || searchable.includes(query)

        const matchesGenre =
          genres.length === 0 ||
          genres.some((genre) =>
            itemGenres.includes(genre)
          )

        const matchesFormat =
          formats.length === 0 ||
          formats.some((format) =>
            itemFormats.includes(format)
          )

        const decade =
          String(Math.floor(item.year / 10) * 10)

        const matchesDecade =
          decades.length === 0 ||
          decades.includes(decade)

        return (
          matchesSearch &&
          matchesGenre &&
          matchesFormat &&
          matchesDecade
        )
      })
      .sort((a, b) => {
        switch (sortMode) {
          case 'title-desc':
            return b.title.localeCompare(a.title)

          case 'year-new':
            return b.year - a.year ||
              a.title.localeCompare(b.title)

          case 'year-old':
            return a.year - b.year ||
              a.title.localeCompare(b.title)

          default:
            return a.title.localeCompare(b.title)
        }
      })
  }, [items, search, genres, formats, decades, sortMode])

  /* =========================================
     FILTER DROPDOWN
     ========================================= */

const renderFilter = (
  name: FilterName,
  label: string,
  options: string[],
  selected: string[],
  setter: (values: string[]) => void
) => (
  <div
    className={`media-library-filter ${
      openFilter === name ? 'open' : ''
    }`}
    key={name}
    data-filter-name={name}
  >
    <button
      type="button"
      className="media-library-filter-trigger"
      aria-expanded={openFilter === name}
      aria-controls={`library-filter-${name}`}
      onClick={() =>
        setOpenFilter(
          openFilter === name ? null : name
        )
      }
    >
      <span>
        {label}
        {selected.length > 0 &&
          ` (${selected.length})`}
      </span>

      <svg
        className="media-library-chevron"
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    {openFilter === name && (
      <div
        id={`library-filter-${name}`}
        className="media-library-filter-menu"
      >
        {options.length === 0 ? (
          <p>No options available.</p>
        ) : (
          options.map((option) => (
            <label
              key={option}
              className="media-library-filter-option"
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() =>
                  toggleFilter(
                    option,
                    selected,
                    setter
                  )
                }
              />

              <span>
                {name === 'decade'
                  ? `${option}s`
                  : name === 'format'
                    ? displayFormat(option)
                    : option}
              </span>
            </label>
          ))
        )}
      </div>
    )}
  </div>
)

  /* =========================================
     LIBRARY DISPLAY
     ========================================= */

return (
  <section
    className={`media-library ${
      isMusic ? 'media-library-music' : ''
    }`}
  >

    {/* STICKY SEARCH AND FILTER TOOLBAR */}

    <div
      className="media-library-toolbar"
      ref={toolbarRef}
    >
      <div className="media-library-search-row">
        <input
          type="search"
          className="media-library-search"
          placeholder="Search titles, years, genres, or formats..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          aria-label="Search library"
        />

        <span className="media-library-count">
          {filteredItems.length} / {items.length}
        </span>
      </div>

      <div className="media-library-filter-row">
        {renderFilter(
          'genre',
          'Genre',
          genreOptions,
          genres,
          setGenres
        )}

        {renderFilter(
          'format',
          'Format',
          formatOptions,
          formats,
          setFormats
        )}

        {renderFilter(
          'decade',
          'Decade',
          decadeOptions,
          decades,
          setDecades
        )}

        <select
          className="media-library-sort"
          value={sortMode}
          onChange={(event) =>
            setSortMode(
              event.target.value as SortMode
            )
          }
          aria-label="Sort library"
        >
          <option value="title-asc">Title A-Z</option>
          <option value="title-desc">Title Z-A</option>
          <option value="year-new">Newest First</option>
          <option value="year-old">Oldest First</option>
        </select>

        <button
          type="button"
          className="media-library-clear"
          onClick={clearFilters}
          disabled={
            !search &&
            activeFilterCount === 0 &&
            sortMode === 'title-asc'
          }
        >
          Clear
        </button>
      </div>

      {/* DISPLAY MODE TOGGLE */}

      <div className="media-library-view-row">
        <div
          className="media-library-view-toggle"
          role="group"
          aria-label="Library display mode"
        >
          {(
            [
              ['cover', 'Covers'],
              ['spine', 'Spines'],
              ['list', 'List'],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              className={
                displayMode === mode
                  ? 'active'
                  : ''
              }
              aria-pressed={displayMode === mode}
              onClick={() =>
                setDisplayMode(mode)
              }
            >
              {label}
            </button>
          ))}
        </div>

        <span className="media-library-results">
          {filteredItems.length} titles
        </span>
      </div>
    </div>

    {/* COVER VIEW */}

    {displayMode === 'cover' && (
      <div className="media-library-grid">
        {filteredItems.map((item) => {
          const artwork =
            item.coverImage ?? item.spineImage

          return (
            <button
              key={item.id}
              type="button"
              className="media-library-card"
              onClick={() => onSelect(item)}
            >
              <div className="media-library-cover">
                {artwork ? (
                  <img
                    src={artwork}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <span>{item.title}</span>
                )}
              </div>

              <div className="media-library-card-info">
                <strong title={item.title}>
                  {item.title}
                </strong>

                <span>
                  {item.year}
                  {' · '}
                  {displayFormat(item.format)}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    )}

    {/* SPINE VIEW */}

    {displayMode === 'spine' && (
      <div className="media-library-spine-grid">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="media-library-spine-item"
          >
            <MediaSpine
              media={item}
              onClick={onSelect}
              displayMode="spine"
            />
          </div>
        ))}
      </div>
    )}

    {/* LIST VIEW */}

    {displayMode === 'list' && (
      <div className="media-library-list">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className="media-library-list-item"
            onClick={() => onSelect(item)}
          >
            <img
              src={
                item.coverImage ||
                item.spineImage ||
                ''
              }
              alt=""
              loading="lazy"
            />

            <strong>{item.title}</strong>

            <span>{item.year}</span>

            <span>
              {displayFormat(item.format)}
            </span>

            <span className="media-library-list-genre">
              {item.genres?.join(', ') ||
                item.genre}
            </span>
          </button>
        ))}
      </div>
    )}

    {/* EMPTY STATE */}

    {filteredItems.length === 0 && (
      <div className="media-library-empty">
        <h3>No matching titles found</h3>
        <p>Try adjusting your search or filters.</p>

        <button
          type="button"
          onClick={clearFilters}
        >
          Clear Filters
        </button>
      </div>
    )}

  </section>
)

}

export default MediaLibrary
