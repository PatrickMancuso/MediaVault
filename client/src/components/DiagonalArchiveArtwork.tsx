
import type { MediaItem } from '../data/sampleMedia'

interface DiagonalArchiveArtworkProps {
  items: MediaItem[]
  type: 'movie' | 'game'
  isTransitioning: boolean
}

function getArtwork(media: MediaItem) {
  return media.coverImage ?? media.spineImage
}

function buildCollageItems(
  items: MediaItem[],
  count = 35
): MediaItem[] {
  if (items.length === 0) {
    return []
  }

  if (items.length >= count) {
    return items.slice(0, count)
  }

  return Array.from(
    { length: count },
    (_, index) => items[index % items.length]
  )
}

function DiagonalArchiveArtwork({
  items,
  type,
  isTransitioning,
}: DiagonalArchiveArtworkProps) {
  return (
    <div
      className={`category-art category-art-diagonal ${
        isTransitioning ? 'artwork-fading' : ''
      }`}
    >
      {buildCollageItems(items).map((item, index) => {
        const artwork = getArtwork(item)

        return (
          <div
            key={`${item.id}-${index}`}
            className="category-art-item category-diagonal-item"
          >
            {artwork ? (
              <img
                src={artwork}
                alt=""
                className={
                  type === 'movie'
                    ? 'category-movie-poster'
                    : 'category-game-poster'
                }
                loading="lazy"
              />
            ) : (
              <span>{item.title}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default DiagonalArchiveArtwork
