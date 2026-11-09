
import { useMemo } from 'react'
import type { MediaItem } from '../data/sampleMedia'

interface MediaLibraryProps {
  title: string
  items: MediaItem[]
  onSelect: (media: MediaItem) => void
}

function MediaLibrary({
  title,
  items,
  onSelect,
}: MediaLibraryProps) {

  /* =========================================
     SORT COLLECTION ALPHABETICALLY
     ========================================= */

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) =>
      a.title.localeCompare(b.title)
    )
  }, [items])

  /* =========================================
     FORMAT DISPLAY LABELS
     ========================================= */

  const formatLabels: Record<string, string> = {
    vhs: 'VHS',
    dvd: 'DVD',
    bluray: 'Blu-ray',
    laserdisc: 'LaserDisc',
    vinyl: 'Vinyl',
    cd: 'CD',
    cassette: 'Cassette',
    hardcover: 'Hardcover',
    paperback: 'Paperback',
  }

  const getFormatLabel = (format: string) =>
    formatLabels[format.toLowerCase()] ?? format

  /* =========================================
     LIBRARY
     ========================================= */

  return (
    <section className="media-library">

      {/* HEADER */}

      <div className="media-library-header">
        <div>
          <h1>{title}</h1>
          <p>Browse your complete collection</p>
        </div>

        <span className="media-library-count">
          {sortedItems.length} titles
        </span>
      </div>

      {/* COLLECTION GRID */}

      <div className="media-library-grid">
        {sortedItems.map((item) => {
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
                <strong>{item.title}</strong>

                <span>
                  {item.year}
                  {' · '}
                  {getFormatLabel(item.format)}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* EMPTY COLLECTION */}

      {sortedItems.length === 0 && (
        <div className="media-library-empty">
          No titles in this collection yet.
        </div>
      )}

    </section>
  )
}

export default MediaLibrary
