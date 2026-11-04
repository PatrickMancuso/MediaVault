
import type { MediaItem } from '../data/sampleMedia'

const formatLabels: Record<string, string> = {
  // Movies
  vhs: 'VHS',
  dvd: 'DVD',
  bluray: 'Blu-ray',
  laserdisc: 'LaserDisc',

  // Games
  nes: 'NES',
  ps1: 'PlayStation',
  xbox360: 'Xbox 360',

  // Books
  hardcover: 'Hardcover',
  paperback: 'Paperback',
  ebook: 'eBook',
  audiobook: 'Audiobook',

  // Music
  vinyl: 'Vinyl',
  cd: 'CD',
  cassette: 'Cassette',
  digital: 'Digital',
  '8-track': '8-Track',
}

interface MediaCoverProps {
  media: MediaItem
  onClick: (media: MediaItem) => void
}

function MediaCover({
  media,
  onClick,
}: MediaCoverProps) {
  const artwork = media.coverImage

  const creator =
    media.type === 'book'
      ? media.authors?.join(', ')
      : media.type === 'music'
        ? media.artists?.join(', ')
        : null

  const formatName =
    formatLabels[media.format.toLowerCase()] ??
    media.format

  return (
    <button
      type="button"
      className={`library-cover-card library-cover-${media.type}`}
      onClick={() => onClick(media)}
      aria-label={`Open ${media.title}`}
    >
      <div className="library-cover-art">
        {artwork ? (
          <img
            src={artwork}
            alt=""
            className="library-cover-image"
            loading="lazy"
          />
        ) : (
          <span className="library-cover-fallback">
            {media.title}
          </span>
        )}
      </div>

      <div className="library-cover-info">
        <strong>{media.title}</strong>

        {creator && (
          <span className="library-cover-creator">
            {creator}
          </span>
        )}

        <small>
          {media.year}
          {' · '}
          {formatName}
        </small>
      </div>
    </button>
  )
}

export default MediaCover
