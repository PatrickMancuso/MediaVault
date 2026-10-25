
import type { MediaItem } from '../data/sampleMedia'

interface RecentReviewsProps {
  items: MediaItem[]
  onSelect: (media: MediaItem) => void
}

function RecentReviews({
  items,
  onSelect,
}: RecentReviewsProps) {

  const recentReviews = items
    .filter((item) =>
      item.personalRating != null ||
      Boolean(item.personalReview?.trim())
    )
    .sort((a, b) =>
      new Date(b.reviewUpdatedAt ?? 0).getTime() -
      new Date(a.reviewUpdatedAt ?? 0).getTime()
    )
    .slice(0, 12)

  return (
    <section className="dashboard-recent-reviews">

      <div className="recent-reviews-header">
        <h2>Recent Reviews</h2>

        <span>
          {recentReviews.length} recent
        </span>
      </div>

      {recentReviews.length === 0 ? (
        <div className="recent-reviews-empty">
          No reviews yet. Open a movie or game
          to write your first review.
        </div>
      ) : (
        <div className="recent-reviews-grid">
          {recentReviews.map((item) => (
            <button
              key={item.id}
              type="button"
              className="recent-review-card"
              onClick={() => onSelect(item)}
            >
              <div className="recent-review-cover">
                {item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <span>{item.title}</span>
                )}
              </div>

              <div className="recent-review-content">
                <strong>{item.title}</strong>

                <small>
                  {item.type === 'movie'
                    ? 'Movie'
                    : 'Game'}
                  {' · '}
                  {item.year}
                </small>

                <div className="recent-review-stars">
                  {item.personalRating != null ? (
                    <>
                      {[1, 2, 3, 4, 5].map(
                        (star) => (
                          <span
                            key={star}
                            className={
                              star <= item.personalRating!
                                ? 'active'
                                : ''
                            }
                          >
                            ★
                          </span>
                        )
                      )}
                    </>
                  ) : (
                    <span className="unrated">
                      Not rated
                    </span>
                  )}
                </div>

                {item.personalReview?.trim() && (
                  <p>{item.personalReview}</p>
                )}

                {item.reviewUpdatedAt && (
                  <time
                    dateTime={item.reviewUpdatedAt}
                  >
                    {new Date(
                      item.reviewUpdatedAt
                    ).toLocaleDateString()}
                  </time>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

export default RecentReviews
