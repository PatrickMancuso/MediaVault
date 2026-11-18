
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
  post_id: string
}


interface AdditionGroup {
  kind: 'additions'
  userId: string
  username: string | null
  displayName: string | null
  items: ActivityItem[]
  activityAt: string
  postId: string
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
    const key = item.post_id

    let group = groups.get(key)

    if (!group) {
      group = {
        kind: 'additions',
        postId: item.post_id,
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

interface PostSummary {
  like_count: number
  comment_count: number
  liked_by_me: boolean
}

interface FeedPageProps {
  onFindCollectors: () => void
  onOpenMedia: (
    mediaId: string,
    collectorId: string
  ) => void
}

function FeedPage({
  onFindCollectors,
  onOpenMedia,
}: FeedPageProps) {  const [activities, setActivities] =
    useState<ActivityItem[]>([])

  const [activeFilter, setActiveFilter] =
    useState<ActivityFilter>('all')

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')



/* =====================================================
   ACTIVITY - LIKES
   ===================================================== */



const [postSummaries, setPostSummaries] =
  useState<Record<string, PostSummary>>({})

const [likingPosts, setLikingPosts] =
  useState<string[]>([])
                   

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
   LOAD ACTIVITY INTERACTION SUMMARIES
   ===================================================== */

const loadPostSummaries = useCallback(
  async (postIds: string[]) => {
    const uniqueIds = [...new Set(postIds)]

    if (uniqueIds.length === 0) {
      setPostSummaries({})
      return
    }

    const results = await Promise.all(
      uniqueIds.map(async (postId) => {
        const { data, error } = await supabase.rpc(
          'get_activity_post_summary',
          {
            p_post_id: postId,
          }
        )

        if (error) {
          console.error(
            'Failed to load post summary:',
            error
          )
          return null
        }

        const summary = data?.[0]

        if (!summary) return null

        return {
          postId,
          summary: {
            like_count: Number(summary.like_count),
            comment_count: Number(summary.comment_count),
            liked_by_me: Boolean(summary.liked_by_me),
          },
        }
      })
    )

    const next: Record<string, PostSummary> = {}

    for (const result of results) {
      if (result) {
        next[result.postId] = result.summary
      }
    }


    setPostSummaries(next)
  },
  []
)

/* =====================================================
   LOAD SUMMARIES WHEN ACTIVITY CHANGES
   ===================================================== */

useEffect(() => {
  if (loading || error) return

  void loadPostSummaries(
    activities.map((item) => item.post_id)
  )
}, [
  activities,
  loading,
  error,
  loadPostSummaries,
])


/* =====================================================
   TOGGLE ACTIVITY LIKE
   ===================================================== */

const handleToggleLike = async (
  postId: string
) => {
  if (likingPosts.includes(postId)) return

  setLikingPosts((current) => [
    ...current,
    postId,
  ])

  try {
    const { data, error } = await supabase.rpc(
      'toggle_activity_like',
      {
        p_post_id: postId,
      }
    )

    if (error) throw error

    const liked = Boolean(data)

    setPostSummaries((current) => {
      const previous = current[postId] ?? {
        like_count: 0,
        comment_count: 0,
        liked_by_me: false,
      }

      return {
        ...current,
        [postId]: {
          ...previous,
          liked_by_me: liked,
          like_count: Math.max(
            0,
            previous.like_count +
              (liked ? 1 : -1)
          ),
        },
      }
    })
  } catch (error) {
    console.error(
      'Unable to toggle activity like:',
      error
    )

    window.alert(
      'Unable to update like. Please try again.'
    )
  } finally {
    setLikingPosts((current) =>
      current.filter((id) => id !== postId)
    )
  }
}

                   
                   
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
       

          <h1>Your Connections</h1>

       
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

      <div className="feed-layout">
  <div className="feed-main">

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
             <button
  key={item.media_id}
  type="button"
  className="feed-addition-item"
  onClick={() =>
    onOpenMedia(item.media_id, item.user_id)
  }
  aria-label={`View details for ${item.title}`}
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
                </button>
              ))}

            </div>



{/* ACTIVITY INTERACTIONS */}

<div className="feed-post-actions">
  <button
    type="button"
    className={`feed-like-button ${
      postSummaries[entry.postId]?.liked_by_me
        ? 'liked'
        : ''
    }`}
    disabled={likingPosts.includes(entry.postId)}
    onClick={() =>
      void handleToggleLike(entry.postId)
    }
    aria-pressed={
      postSummaries[entry.postId]?.liked_by_me ??
      false
    }
  >
    <span aria-hidden="true">♥</span>

    <span>
      {postSummaries[entry.postId]?.liked_by_me
        ? 'Liked'
        : 'Like'}
    </span>

    <small>
      {postSummaries[entry.postId]?.like_count ?? 0}
    </small>
  </button>
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

<button
  type="button"
  className="feed-activity-media"
  onClick={() =>
    onOpenMedia(item.media_id, item.user_id)
  }
  aria-label={`View details for ${item.title}`}
>
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
                {({
  movie: 'Movie',
  game: 'Game',
  book: 'Book',
  music: 'Music',
} as Record<string, string>)[item.media_type] ??
  item.media_type}
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

            </button>


{/* REVIEW INTERACTIONS */}

<div className="feed-post-actions">
  <button
    type="button"
    className={`feed-like-button ${
      postSummaries[item.post_id]?.liked_by_me
        ? 'liked'
        : ''
    }`}
    disabled={likingPosts.includes(item.post_id)}
    onClick={() =>
      void handleToggleLike(item.post_id)
    }
    aria-pressed={
      postSummaries[item.post_id]?.liked_by_me ??
      false
    }
  >
    <span aria-hidden="true">♥</span>

    <span>
      {postSummaries[item.post_id]?.liked_by_me
        ? 'Liked'
        : 'Like'}
    </span>

    <small>
      {postSummaries[item.post_id]?.like_count ?? 0}
    </small>
  </button>
</div>

          

        </article>
      )

    })}


  </div>
)}

      </div>

      {/* ACTIVITY SIDEBAR */}

      <aside className="feed-sidebar">
        <div className="feed-sidebar-card">
          <span className="feed-sidebar-eyebrow">
            YOUR NETWORK
          </span>

          <h2>Discover Collectors</h2>

          <p>
            Find other collectors, explore their
            libraries, and discover new favorites.
          </p>

          <button
            type="button"
            className="feed-sidebar-button"
            onClick={onFindCollectors}
          >
            Find Collectors →
          </button>
        </div>

        <div className="feed-sidebar-card">
          <span className="feed-sidebar-eyebrow">
            COMING SOON
          </span>

          <h2>Recent Interactions</h2>

          <p>
            Likes and comments from other collectors
            will appear here.
          </p>
        </div>
      </aside>

    </div>

  </section>
)

}

export default FeedPage

