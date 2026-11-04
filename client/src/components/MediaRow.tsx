import { useRef } from 'react'
import type { MediaItem } from '../data/sampleMedia'
import MediaCover from './MediaCover'
import MediaSpine from './MediaSpine'

interface MediaRowProps {
  title: string
  items: MediaItem[]
  onSelect: (media: MediaItem) => void
  displayMode?: 'cover' | 'spine'
}

function MediaRow({
  title,
  items,
  onSelect,
  displayMode = 'cover',
}: MediaRowProps) {
    const rowRef = useRef<HTMLDivElement>(null)

  const scrollShelf = (direction: 'left' | 'right') => {
    if (!rowRef.current) return

    const amount = Math.max(
      rowRef.current.clientWidth * 0.72,
      300,
    )

    rowRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  if (items.length === 0) {
    return null
  }

  return (
<section
  className={`media-row ${
    items.length > 0 &&
    items.every((item) => item.type === 'music')
      ? 'media-row-music'
      : items.length > 0 &&
          items.every((item) => item.type === 'book')
        ? 'media-row-books'
        : ''
  }`}
>
  <div className="row-header">
        <div className="row-title-group">
          <h2>{title}</h2>
          <span>{items.length}</span>
        </div>

        <div className="row-controls">
          <button
            type="button"
            className="shelf-control"
            onClick={() => scrollShelf('left')}
            aria-label={`Scroll ${title} left`}
          >
            ‹
          </button>

          <button
            type="button"
            className="shelf-control"
            onClick={() => scrollShelf('right')}
            aria-label={`Scroll ${title} right`}
          >
            ›
          </button>
        </div>
      </div>

      <div className="shelf">
        <div className="shelf-interior">
          <div className="shelf-scroll" ref={rowRef}>
        <div
  className={`media-line ${
    displayMode === 'spine'
      ? 'media-line-spines'
      : 'media-line-covers'
  }`}
>
  {items.map((item) =>
    displayMode === 'spine' ? (
      <MediaSpine
        key={item.id}
        media={item}
        onClick={onSelect}
        displayMode="spine"
      />
    ) : (
      <MediaCover
        key={item.id}
        media={item}
        onClick={onSelect}
      />
    ),
  )}
</div>
          </div>
        </div>

        <div className="shelf-board" />
      </div>
    </section>
  )
}

export default MediaRow
