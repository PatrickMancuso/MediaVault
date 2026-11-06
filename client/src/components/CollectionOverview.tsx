
import type { MediaItem } from '../data/sampleMedia'

interface CollectionOverviewProps {
  movies: MediaItem[]
  games: MediaItem[]
  books: MediaItem[]
  music: MediaItem[]
  favorites: MediaItem[]
}

const categoryColors = {
  Movies: '#a47dc4',
  Games: '#8062a7',
  Books: '#c396b0',
  Music: '#d5a4c4',
}

const formatLabels: Record<string, string> = {
  vhs: 'VHS',
  dvd: 'DVD',
  bluray: 'Blu-ray',
  laserdisc: 'LaserDisc',
  nes: 'NES',
  ps1: 'PlayStation',
  xbox360: 'Xbox 360',
  ps5: 'PS5',
  hardcover: 'Hardcover',
  paperback: 'Paperback',
  vinyl: 'Vinyl',
  cd: 'CD',
  cassette: 'Cassette',
  digital: 'Digital',
}

function CollectionOverview({
  movies,
  games,
  books,
  music,
  favorites,
}: CollectionOverviewProps) {
  const allMedia = [
    ...movies,
    ...games,
    ...books,
    ...music,
  ]

  const totalTitles = allMedia.length

  const categories = [
    {
      name: 'Movies',
      count: movies.length,
      color: categoryColors.Movies,
    },
    {
      name: 'Games',
      count: games.length,
      color: categoryColors.Games,
    },
    {
      name: 'Books',
      count: books.length,
      color: categoryColors.Books,
    },
    {
      name: 'Music',
      count: music.length,
      color: categoryColors.Music,
    },
  ]

  const formatCounts = new Map<string, number>()

  allMedia.forEach((item) => {
    const formats =
      item.formats?.length
        ? item.formats
        : [item.format]

    const uniqueFormats = new Set(
      formats.map((format) => format.trim().toLowerCase())
    )

    uniqueFormats.forEach((format) => {
      formatCounts.set(
        format,
        (formatCounts.get(format) ?? 0) + 1
      )
    })
  })

  const sortedFormats = Array.from(formatCounts.entries())
    .sort((a, b) => b[1] - a[1])

  const topFormats = sortedFormats.slice(0, 6)
  const maxFormatCount = topFormats[0]?.[1] ?? 1

  const favoriteCount = favorites.length
  const favoritePercentage = totalTitles
    ? Math.round((favoriteCount / totalTitles) * 100)
    : 0

  return (
    <section className="collection-overview">
      <div className="collection-overview-header">
        <div>
          <h2>Collection Overview</h2>
          <p>A closer look at your media archive</p>
        </div>

        <div className="collection-overview-total">
          <strong>{totalTitles}</strong>
          <span>Total Titles</span>
        </div>
      </div>

      <div className="collection-overview-stats">
        <div className="overview-stat-card">
          <span>Favorites</span>
          <strong>{favoriteCount}</strong>
          <small>{favoritePercentage}% of collection</small>
        </div>

        <div className="overview-stat-card">
          <span>Physical Formats</span>
          <strong>{formatCounts.size}</strong>
          <small>Unique formats collected</small>
        </div>

        <div className="overview-stat-card">
          <span>Media Categories</span>
          <strong>
            {categories.filter((category) => category.count > 0).length}
          </strong>
          <small>Types of media collected</small>
        </div>
      </div>

      <div className="collection-overview-panel">
        <div className="overview-panel-heading">
          <h3>Collection Breakdown</h3>
          <span>By media type</span>
        </div>

        <div className="overview-category-bar">
          {categories
            .filter((category) => category.count > 0)
            .map((category) => (
              <div
                key={category.name}
                className="overview-category-segment"
                style={{
                  flexGrow: category.count,
                  backgroundColor: category.color,
                }}
                title={`${category.name}: ${category.count}`}
              />
            ))}
        </div>

        <div className="overview-category-legend">
          {categories.map((category) => (
            <div
              key={category.name}
              className="overview-category-legend-item"
            >
              <span
                className="overview-category-dot"
                style={{ backgroundColor: category.color }}
              />

              <div>
                <span>{category.name}</span>
                <strong>
                  {category.count}
                  <small>
                    {' '}
                    ({totalTitles
                      ? Math.round(
                          (category.count / totalTitles) * 100
                        )
                      : 0}%)
                  </small>
                </strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="collection-overview-panel">
        <div className="overview-panel-heading">
          <h3>Most Collected Formats</h3>
          <span>Top 6</span>
        </div>

        <div className="overview-format-chart">
          {topFormats.map(([format, count]) => (
            <div
              key={format}
              className="overview-format-row"
            >
              <div className="overview-format-label">
                <span>
                  {formatLabels[format] ??
                    format.replace(/\b\w/g, (c) =>
                      c.toUpperCase()
                    )}
                </span>
                <strong>{count}</strong>
              </div>

              <div className="overview-format-track">
                <div
                  className="overview-format-fill"
                  style={{
                    width: `${(count / maxFormatCount) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CollectionOverview
