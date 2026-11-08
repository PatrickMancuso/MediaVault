
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type ActivityFilter = 'all' | 'addition' | 'review'

interface ActivityItem {
  user_id: string
  username: string | null
  display_name: string | null
  media_id: string
  title: string
  media_type: string
  media_format: string
  media_year: number
  cover_image: string | null
  activity_type: 'addition' | 'review'
  personal_rating: number | null
  personal_review: string | null
  activity_at: string
}


interface AdditionGroup {
  kind: 'additions'
  userId: string
  username: string | null
  displayName: string | null
  items: ActivityItem[]
  activityAt: string
}

interface ReviewEntry {
  kind: 'review'
  item: ActivityItem
  activityAt: string
}

type FeedEntry = AdditionGroup | ReviewEntry

const groupActivity = (
  activities: ActivityItem[]
): FeedEntry[] => {
  const entries: FeedEntry[] = []
  const additions = activities
    .filter(item => item.activity_type === 'addition')
  .sort((a, b) =>
  new Date(b.activity_at).getTime() -
  new Date(a.activity_at).getTime()
)

  const groups = new Map<string, AdditionGroup>()

  for (const item of additions) {
    const day = item.activity_at.slice(0, 10)
    const key = `${item.user_id}-${day}`

    let group = groups.get(key)

    if (!group) {
      group = {
        kind: 'additions',
        userId: item.user_id,
        username: item.username,
        displayName: item.display_name,
        items: [],
        activityAt: item.activity_at,
      }

      groups.set(key, group)
    }

    group.items.push(item)

    if (item.activity_at > group.activityAt) {
      group.activityAt = item.activity_at
    }
  }

  entries.push(...groups.values())

  for (const item of activities) {
    if (item.activity_type === 'review') {
      entries.push({
        kind: 'review',
        item,
        activityAt: item.activity_at,
      })
    }
  }

  return entries.sort((a, b) =>
    new Date(b.activityAt).getTime() -
    new Date(a.activityAt).getTime()
  )
}


const formatLabels: Record<string, string> = {
  dvd: 'DVD',
  vhs: 'VHS',
  bluray: 'Blu-ray',
  'blu-ray': 'Blu-ray',
  laserdisc: 'LaserDisc',
  ps1: 'PlayStation',
  ps2: 'PlayStation 2',
  ps3: 'PlayStation 3',
  ps4: 'PlayStation 4',
  ps5: 'PlayStation 5',
  xbox: 'Xbox',
  xbox360: 'Xbox 360',
  xboxone: 'Xbox One',
  xboxseries: 'Xbox Series X/S',
  nes: 'NES',
  snes: 'SNES',
  n64: 'Nintendo 64',
  switch: 'Nintendo Switch',
  pc: 'PC',
}

const getFormatName = (format: string) =>
  formatLabels[format.toLowerCase()] ?? format

const formatActivityDate = (date: string) =>
  new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

interface FeedPageProps {
  onFindCollectors: () => void
}

function FeedPage({
  onFindCollectors,
}: FeedPageProps) {  const [activities, setActivities] =
    useState<ActivityItem[]>([])

  const [activeFilter, setActiveFilter] =
    useState<ActivityFilter>('all')

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  /* =====================================================
     LOAD FRIEND ACTIVITY
     ===================================================== */

  const loadActivity = useCallback(async (
    isRefresh = false
  ) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    try {
      const { data, error: activityError } =
        await supabase.rpc(
          'get_friends_activity',
          {
            activity_limit: 50,
          }
        )

      if (activityError) {
        throw activityError
      }

      setActivities(
        (data ?? []) as ActivityItem[]
      )
    } catch (err) {
      console.error(
        'Unable to load friend activity:',
        err
      )

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load activity.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadActivity()
  }, [loadActivity])

  /* =====================================================
     FILTER ACTIVITY
     ===================================================== */

  const filteredActivities =
    activeFilter === 'all'
      ? activities
      : activities.filter(
          (item) =>
            item.activity_type === activeFilter
        )

  const groupedEntries = groupActivity(filteredActivities)

  const filters: {
    id: ActivityFilter
    label: string
  }[] = [
    { id: 'all', label: 'All Activity' },
    { id: 'addition', label: 'Additions' },
    { id: 'review', label: 'Reviews' },
  ]

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <section className="feed-page">

      {/* HEADER */}

      <div className="feed-header feed-header-expanded">
        <div>
          <span className="feed-eyebrow">
            YOUR CONNECTIONS
          </span>

          <h1>Activity</h1>

          <p>
            Recent additions and reviews from
            your friends on MediaVault.
          </p>
        </div>

        <button
          type="button"
          className="feed-refresh"
          disabled={loading || refreshing}
          onClick={() =>
            void loadActivity(true)
          }
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* FILTERS */}

      <div className="feed-filters">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={`feed-filter ${
              activeFilter === filter.id
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveFilter(filter.id)
            }
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}

      {loading ? (
        <div className="feed-empty">
          <h2>Loading activity...</h2>
        </div>
      ) : error ? (
        <div className="feed-empty">
          <h2>Unable to load activity</h2>
          <p role="alert">{error}</p>
        </div>
) : filteredActivities.length === 0 ? (
  <div className="feed-empty feed-empty-onboarding">

    {activities.length === 0 ? (
      <>
        <div className="feed-empty-icon">
          ♧
        </div>

        <h2>Your feed is looking a little empty</h2>

        <p>
          Connect with other collectors to see
          their latest additions and reviews.
          Discover people who share your interests
          and start building your feed.
        </p>

        <button
          type="button"
          className="feed-discover-button"
          onClick={onFindCollectors}
        >
          Find Collectors →
        </button>
      </>
    ) : (
      <>
        <h2>
          {activeFilter === 'addition'
            ? 'No recent additions'
            : 'No recent reviews'}
        </h2>

        <p>
          {activeFilter === 'addition'
            ? 'Your friends have not added any new titles recently.'
            : 'Your friends have not posted any recent reviews.'}
        </p>
      </>
    )}

  </div>
     
) : (
  <div className="feed-activity-list">

    {groupedEntries.map((entry) => {

      /* =============================================
         GROUPED ADDITIONS
         ============================================= */

      if (entry.kind === 'additions') {
        const collectorName =
          entry.displayName ||
          entry.username ||
          'MediaVault Collector'

        return (
          <article
            key={`additions-${entry.userId}-${entry.activityAt}`}
            className="feed-activity-card feed-addition-group"
          >

            <div className="feed-activity-user">
              <div className="feed-user-avatar">
                {collectorName.charAt(0).toUpperCase()}
              </div>

              <div className="feed-user-info">
                <strong>{collectorName}</strong>

                <span>
                  Added {entry.items.length}{' '}
                  {entry.items.length === 1
                    ? 'title'
                    : 'titles'}
                  {' · '}
                  {formatActivityDate(entry.activityAt)}
                </span>
              </div>
            </div>

            <div className="feed-addition-track">

              {entry.items.map((item) => (
                <div
                  key={item.media_id}
                  className="feed-addition-item"
                >
                  <div className="feed-addition-art">
                    {item.cover_image ? (
                      <img
                        src={item.cover_image}
                        alt={item.title}
                        loading="lazy"
                      />
                    ) : (
                      <span>{item.title}</span>
                    )}
                  </div>

                  <strong title={item.title}>
                    {item.title}
                  </strong>

                  <small>
                    {item.media_year}
                    {' · '}
                    {getFormatName(item.media_format)}
                  </small>
                </div>
              ))}

            </div>

          </article>
        )
      }

      /* =============================================
         INDIVIDUAL REVIEWS
         ============================================= */

      const item = entry.item

      const collectorName =
        item.display_name ||
        item.username ||
        'MediaVault Collector'

      return (
        <article
          key={`review-${item.media_id}`}
          className="feed-activity-card feed-review-card"
        >

          <div className="feed-activity-user">
            <div className="feed-user-avatar">
              {collectorName.charAt(0).toUpperCase()}
            </div>

            <div className="feed-user-info">
              <strong>{collectorName}</strong>

              <span>
                Reviewed a title
                {' · '}
                {formatActivityDate(item.activity_at)}
              </span>
            </div>
          </div>

          <div className="feed-activity-media">

            <div className="feed-activity-art">
              {item.cover_image ? (
                <img
                  src={item.cover_image}
                  alt={item.title}
                  loading="lazy"
                />
              ) : (
                <span>{item.title}</span>
              )}
            </div>

            <div className="feed-activity-details">
              <h2>{item.title}</h2>

              <p className="feed-activity-meta">
                {item.media_type === 'game'
                  ? 'Game'
                  : 'Movie'}
                {' · '}
                {item.media_year}
                {' · '}
                {getFormatName(item.media_format)}
              </p>

              {item.personal_rating !== null && (
                <div className="feed-activity-rating">
                  {'★'.repeat(
                    Math.max(
                      0,
                      Math.min(
                        5,
                        Math.round(item.personal_rating)
                      )
                    )
                  )}
                </div>
              )}

              {item.personal_review && (
                <p className="feed-activity-review">
                  {item.personal_review}
                </p>
              )}
            </div>

          </div>

        </article>
      )

    })}

  </div>
)}

    </section>
  )
}

export default FeedPage

