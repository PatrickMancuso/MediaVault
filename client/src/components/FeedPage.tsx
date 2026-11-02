
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

function FeedPage() {
  const [activities, setActivities] =
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
        <div className="feed-empty">
          <h2>No activity yet</h2>

          <p>
            {activeFilter === 'all'
              ? "Your friends' recent additions and reviews will appear here."
              : activeFilter === 'addition'
                ? 'No recent additions from your friends.'
                : 'No recent reviews from your friends.'}
          </p>
        </div>
      ) : (
        <div className="feed-activity-list">

          {filteredActivities.map((item) => {
            const collectorName =
              item.display_name ||
              item.username ||
              'MediaVault Collector'

            const isReview =
              item.activity_type === 'review'

            return (
              <article
                key={`${item.media_id}-${item.activity_type}`}
                className="feed-activity-card"
              >

                {/* COLLECTOR */}

                <div className="feed-activity-user">
                  <div className="feed-user-avatar">
                    {collectorName
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="feed-user-info">
                    <strong>{collectorName}</strong>

                    <span>
                      {isReview
                        ? 'Reviewed a title'
                        : 'Added to their collection'}
                      {' · '}
                      {formatActivityDate(
                        item.activity_at
                      )}
                    </span>
                  </div>
                </div>

                {/* MEDIA */}

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
                      {getFormatName(
                        item.media_format
                      )}
                    </p>

                    {isReview &&
                      item.personal_rating !== null && (
                        <div className="feed-activity-rating">
                          {'★'.repeat(
                            Math.max(
                              0,
                              Math.min(
                                5,
                                Math.round(
                                  item.personal_rating
                                )
                              )
                            )
                          )}
                        </div>
                      )}

                    {isReview &&
                      item.personal_review && (
                        <p className="feed-activity-review">
                          {item.personal_review}
                        </p>
                      )}

                    {!isReview && (
                      <p className="feed-activity-description">
                        Added this title to their
                        MediaVault collection.
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
