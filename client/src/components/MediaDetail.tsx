import {
  useEffect,
  useRef,
  useState,
} from 'react'

import type { MediaItem } from '../data/sampleMedia'

interface MediaDetailProps {
  media: MediaItem
  onClose: () => void
  onRemove: (media: MediaItem) => void
  onEdit: (media: MediaItem) => void

  onSaveReview: (
    media: MediaItem,
    rating: number | null,
    review: string
  ) => Promise<void>
}




const formatLabels: Record<string, string> = {
  vhs: 'VHS',
  dvd: 'DVD',
  bluray: 'Blu-ray',
  laserdisc: 'LaserDisc',

  nes: 'NES',
  ps1: 'PlayStation',
  xbox360: 'Xbox 360',

  hardcover: 'Hardcover',
  paperback: 'Paperback',
  ebook: 'eBook',
  audiobook: 'Audiobook',
  'special edition': 'Special Edition',

  vinyl: 'Vinyl',
  cd: 'CD',
  cassette: 'Cassette',
  digital: 'Digital',
  '8-track': '8-Track',
}


const mediaTypeLabels: Record<MediaItem['type'], string> = {
  movie: 'MOVIE',
  game: 'VIDEO GAME',
  book: 'BOOK',
  music: 'MUSIC',
}
function MediaDetail({
  media,
  onClose,
  onRemove,
  onEdit,
    onSaveReview,
}: MediaDetailProps) {
  const [showMoreDetails, setShowMoreDetails] =
    useState(false)

    const [personalRating, setPersonalRating] =
  useState<number | null>(
    media.personalRating ?? null
  )

const [personalReview, setPersonalReview] =
  useState(media.personalReview ?? '')

const [isSavingReview, setIsSavingReview] =
  useState(false)

const [reviewError, setReviewError] =
  useState('')

  const detailInfoRef =
    useRef<HTMLDivElement>(null)

    
/* =====================================================
   PREVENT BACKGROUND SCROLLING
   ===================================================== */

useEffect(() => {
  const previousOverflow =
    document.body.style.overflow

  document.body.style.overflow = 'hidden'

  return () => {
    document.body.style.overflow =
      previousOverflow
  }
}, [])


/* =====================================================
   SAVE PERSONAL REVIEW
   ===================================================== */

const handleSaveReview = async () => {
  if (isSavingReview) return

  setIsSavingReview(true)
  setReviewError('')

  try {
    await onSaveReview(
      media,
      personalRating,
      personalReview.trim()
    )
  } catch (error) {
    setReviewError(
      error instanceof Error
        ? error.message
        : 'Unable to save review.'
    )
  } finally {
    setIsSavingReview(false)
  }
}


const displayGenres =
  media.genres?.length
    ? media.genres
    : [media.genre]

const displayFormats =
  media.formats?.length
    ? media.formats
    : [media.format]

const displayFormatLabels =
  displayFormats.map(
    (format) =>
      formatLabels[format.toLowerCase()] ?? format,
  )


 

  const mediaTypeLabel =
    mediaTypeLabels[media.type] ??
    media.type

  const isMovie = media.type === 'movie'
const isGame = media.type === 'game'
const isBook = media.type === 'book'
const isMusic = media.type === 'music'

  const rating =
    typeof media.rating === 'number'
      ? media.rating
      : null

  const formattedRating =
    rating !== null
      ? isMovie
        ? rating.toFixed(1)
        : rating.toFixed(1)
      : null

 const playableVideos =
  (media.videos ?? []).filter(
    (video) => Boolean(video.url),
  )

const primaryVideo = playableVideos[0]

const additionalVideos =
  playableVideos.slice(1)

  return (
    <div
      className="detail-backdrop"
      onClick={onClose}
    >
     <div
  className="media-detail"
  onClick={(event) =>
    event.stopPropagation()
  }
onWheel={(event) => {
  const detailInfo =
    detailInfoRef.current

  if (!detailInfo) {
    return
  }

  const target =
    event.target as Node

  if (
    detailInfo.contains(target)
  ) {
    return
  }

  detailInfo.scrollTop +=
    event.deltaY
}}
>
        <button
          type="button"
          className="detail-close"
          onClick={onClose}
          aria-label="Close details"
        >
          ×
        </button>

        {/* =====================================================
            COVER / ARTWORK
            ===================================================== */}

        <div
className={`detail-cover detail-cover-${media.type}`}
          style={
            media.coverImage
              ? {
                  backgroundImage:
                    `linear-gradient(
                      rgba(10, 13, 12, 0.12),
                      rgba(10, 13, 12, 0.28)
                    ),
                    url("${media.coverImage}")`,
backgroundSize:
  isBook || isMusic ? 'contain' : 'cover',
backgroundRepeat: 'no-repeat',
                backgroundPosition:
                    'center',
                }
              : undefined
          }
        >
      

          {!media.coverImage && (
            <span className="cover-title">
              {media.title}
            </span>
          )}

         
        </div>

        {/* =====================================================
            INFORMATION
            ===================================================== */}

<div
  className="detail-info"
  ref={detailInfoRef}
>
       <div className="detail-eyebrow">
  {mediaTypeLabel}
</div>

          <h2>{media.title}</h2>



          {/* ===================================================
              PRIMARY METADATA
              =================================================== */}

         
<div
  className={`detail-primary-info ${
    isMovie ? 'detail-primary-movie' : ''
  }`}
>
  {/* EXTERNAL RATING */}

  {rating !== null && (isMovie || isGame) && (
    <div className="detail-rating">
      <span>
        {isMovie ? 'TMDB RATING' : 'IGDB RATING'}
      </span>

      <strong>{formattedRating}</strong>

      <small>{isMovie ? '/ 10' : '/ 100'}</small>
    </div>
  )}

  {/* MOVIE INFORMATION */}

  {isMovie && (
    <>
      {media.director && (
        <div className="detail-primary-item detail-director">
          <span>DIRECTED BY</span>
          <strong>{media.director}</strong>
        </div>
      )}

      {media.cast?.length ? (
        <div className="detail-primary-item detail-cast">
          <span>MAIN CAST</span>
          <strong>
            {media.cast.slice(0, 6).join(', ')}
          </strong>
        </div>
      ) : null}
    </>
  )}

  {/* GAME INFORMATION */}

  {isGame && (
    <>
      {media.developers?.length ? (
        <div className="detail-primary-item">
          <span>DEVELOPED BY</span>
          <strong>{media.developers.join(', ')}</strong>
        </div>
      ) : null}

      {media.publishers?.length ? (
        <div className="detail-primary-item">
          <span>PUBLISHED BY</span>
          <strong>{media.publishers.join(', ')}</strong>
        </div>
      ) : null}
    </>
  )}

  {/* BOOK INFORMATION */}

  {isBook && (
    <>
      {media.authors?.length ? (
        <div className="detail-primary-item">
          <span>WRITTEN BY</span>
          <strong>{media.authors.join(', ')}</strong>
        </div>
      ) : null}

      {media.bookPublisher && (
        <div className="detail-primary-item">
          <span>PUBLISHED BY</span>
          <strong>{media.bookPublisher}</strong>
        </div>
      )}
    </>
  )}

  {/* MUSIC INFORMATION */}

  {isMusic && (
    <>
      {media.artists?.length ? (
        <div className="detail-primary-item">
          <span>ARTIST</span>
          <strong>{media.artists.join(', ')}</strong>
        </div>
      ) : null}

      {media.recordLabel && (
        <div className="detail-primary-item">
          <span>RECORD LABEL</span>
          <strong>{media.recordLabel}</strong>
        </div>
      )}
    </>
  )}
</div>


<div className="detail-divider" />

          {/* ===================================================
              DESCRIPTION
              =================================================== */}

          <div className="detail-description">
            <p>
              {media.description}
            </p>
          </div>

      

          {/* ===================================================
              YOUR COPY
              =================================================== */}

            <div className="detail-section-label">
            </div>

            <div className="detail-facts">
              <div>
                <span>Format</span>

                <strong>
{displayFormatLabels.join(', ')}
                </strong>
              </div>

              <div>
                <span>Release</span>

                <strong>
                  {media.year}
                </strong>
              </div>

              <div>
                <span>Genre</span>

                <strong>
                  {displayGenres.join(', ')}
                </strong>
              </div>
            </div>



{/* ===================================================
    PERSONAL REVIEW
    =================================================== */}

<div className="detail-personal-review">

  <div className="detail-review-heading">
    <div>
      <span className="detail-review-eyebrow">
        PERSONAL COLLECTION
      </span>

      <h3>My Review</h3>
    </div>
  </div>

  <div className="detail-review-rating">

    <span>Your Rating</span>

    <div className="detail-review-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={
            star <= (personalRating ?? 0)
              ? 'review-star active'
              : 'review-star'
          }
          onClick={() =>
            setPersonalRating(
              personalRating === star
                ? null
                : star
            )
          }
          aria-label={`Rate ${star} stars`}
          aria-pressed={personalRating === star}
        >
          ★
        </button>
      ))}

      <span className="review-rating-value">
        {personalRating !== null
          ? `${personalRating} / 5`
          : 'Not rated'}
      </span>
    </div>

  </div>

  <div className="detail-review-text">
    <label htmlFor="personal-review">
      Your Thoughts
    </label>

    <textarea
      id="personal-review"
      value={personalReview}
      onChange={(event) =>
        setPersonalReview(event.target.value)
      }
      placeholder="What did you think of this title?"
      rows={4}
    />
  </div>

  {reviewError && (
    <p className="detail-review-error">
      {reviewError}
    </p>
  )}

  <div className="detail-review-actions">
    <button
      type="button"
      className="detail-review-save"
      onClick={handleSaveReview}
      disabled={isSavingReview}
    >
      {isSavingReview
        ? 'Saving...'
        : 'Save Review'}
    </button>
  </div>

</div>


                {/* ===================================================
              TRAILER / VIDEO
              =================================================== */}

          {primaryVideo?.url && (
            <div className="detail-video-section">
              <a
                href={primaryVideo.url}
                target="_blank"
                rel="noreferrer"
                className="detail-video-button"
              >
                <span className="detail-video-icon">
                  ▶
                </span>

                <span>
                  {primaryVideo.name ||
                    (isMovie
                      ? 'Watch Trailer'
                      : 'Watch Video')}
                </span>
              </a>

              {additionalVideos.length >
                0 && (
                <span className="detail-video-count">
                  +{additionalVideos.length}{' '}
                  more
                </span>
              )}
            </div>
          )}

          {/* ===================================================
              SCREENSHOTS
              =================================================== */}

          {media.screenshots &&
            media.screenshots.length > 0 && (
              <div className="detail-screenshots">
                <div className="detail-section-header">
                  <span>
                    {isMovie
                      ? 'ARTWORK'
                      : 'SCREENSHOTS'}
                  </span>

                  <small>
                    {media.screenshots.length}
                  </small>
                </div>

                <div className="detail-screenshot-grid">
                  {media.screenshots
                    .slice(0, 4)
                    .map(
                      (screenshot) => (
                        <a
                          key={screenshot}
                          href={
                            screenshot
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="detail-screenshot"
                        >
                          <img
                            src={screenshot}
                            alt=""
                          />
                        </a>
                      ),
                    )}
                </div>
              </div>
            )}

          {/* ===================================================
              MORE DETAILS
              =================================================== */}

          <div className="detail-more">
            <button
              type="button"
              className="detail-more-toggle"
              onClick={() =>
                setShowMoreDetails(
                  (current) =>
                    !current,
                )
              }
              aria-expanded={
                showMoreDetails
              }
            >
              <span>
                More Details
              </span>

              <span
                className={
                  showMoreDetails
                    ? 'detail-more-arrow open'
                    : 'detail-more-arrow'
                }
              >
                ›
              </span>
            </button>

            {showMoreDetails && (
              <div className="detail-more-content">
{isMovie && (
  <>
             

                    

                    {media.productionCompanies &&
                      media.productionCompanies
                        .length >
                        0 && (
                        <div className="detail-more-group">
                          <span>
                            PRODUCTION
                          </span>

                          <strong>
                            {media.productionCompanies.join(
                              ', ',
                            )}
                          </strong>
                        </div>
                      )}

                    {media.countries &&
                      media.countries.length >
                        0 && (
                        <div className="detail-more-group">
                          <span>
                            COUNTRIES
                          </span>

                          <strong>
                            {media.countries.join(
                              ', ',
                            )}
                          </strong>
                        </div>
                      )}

                    {media.languages &&
                      media.languages.length >
                        0 && (
                        <div className="detail-more-group">
                          <span>
                            LANGUAGES
                          </span>

                          <strong>
                            {media.languages.join(
                              ', ',
                            )}
                          </strong>
                        </div>
                      )}
                  </>
)}

{isGame && (
  <>
                    {media.platforms &&
                      media.platforms.length >
                        0 && (
                        <div className="detail-more-group">
                          <span>
                            PLATFORMS
                          </span>

                          <strong>
                            {media.platforms.join(
                              ', ',
                            )}
                          </strong>
                        </div>
                      )}

                    {media.gameModes &&
                      media.gameModes.length >
                        0 && (
                        <div className="detail-more-group">
                          <span>
                            GAME MODES
                          </span>

                          <strong>
                            {media.gameModes.join(
                              ', ',
                            )}
                          </strong>
                        </div>
                      )}

                    {media.playerPerspectives &&
                      media.playerPerspectives
                        .length >
                        0 && (
                        <div className="detail-more-group">
                          <span>
                            PERSPECTIVE
                          </span>

                          <strong>
                            {media.playerPerspectives.join(
                              ', ',
                            )}
                          </strong>
                        </div>
                      )}

                    {media.themes &&
                      media.themes.length >
                        0 && (
                        <div className="detail-more-group">
                          <span>
                            THEMES
                          </span>

                          <strong>
                            {media.themes.join(
                              ', ',
                            )}
                          </strong>
                        </div>
                      )}
                  </>
                )}

                {media.videos &&
                  media.videos.length >
                    1 && (
                    <div className="detail-more-group">
                      <span>
                        VIDEOS
                      </span>

                      <div className="detail-video-list">
                        {media.videos
                          .slice(1, 2)
                          .map(
                            (
                              video,
                            ) => (
                              <a
                                key={
                                  video.videoId ??
                                  video.url ??
                                  video.name
                                }
                                href={
                                  video.url
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="detail-more-video"
                              >
                                <span>
                                  ▶
                                </span>

                                <strong>
                                  {video.name ||
                                    'Video'}
                                </strong>
                              </a>
                            ),
                          )}
                      </div>
                    </div>
                  )}
           


  
{/* BOOK DETAILS */}

{isBook && (
  <>
    {media.isbn13 && (
      <div className="detail-more-group">
        <span>ISBN-13</span>
        <strong>{media.isbn13}</strong>
      </div>
    )}

    {media.isbn10 && (
      <div className="detail-more-group">
        <span>ISBN-10</span>
        <strong>{media.isbn10}</strong>
      </div>
    )}

    {media.pageCount != null && (
      <div className="detail-more-group">
        <span>PAGE COUNT</span>
        <strong>{media.pageCount}</strong>
      </div>
    )}

    {media.bookLanguage && (
      <div className="detail-more-group">
        <span>LANGUAGE</span>
        <strong>{media.bookLanguage}</strong>
      </div>
    )}

    {media.bookEdition && (
      <div className="detail-more-group">
        <span>EDITION</span>
        <strong>{media.bookEdition}</strong>
      </div>
    )}
  </>
)}


{/* MUSIC DETAILS */}

{isMusic && (
  <>
    {media.albumType && (
      <div className="detail-more-group">
        <span>RELEASE TYPE</span>
        <strong>{media.albumType}</strong>
      </div>
    )}

    {media.catalogNumber && (
      <div className="detail-more-group">
        <span>CATALOG NUMBER</span>
        <strong>{media.catalogNumber}</strong>
      </div>
    )}

    {media.trackCount != null && (
      <div className="detail-more-group">
        <span>TRACK COUNT</span>
        <strong>{media.trackCount}</strong>
      </div>
    )}

    {media.tracks?.length ? (
      <div className="detail-more-group">
        <span>TRACK LIST</span>

        <div className="detail-track-list">
          {media.tracks.map((track) => (
            <div
              key={`${track.position}-${track.title}`}
              className="detail-track-item"
            >
              <span>{track.position}.</span>
              <strong>{track.title}</strong>
            </div>
          ))}
        </div>
      </div>
    ) : null}
  </>
)}

                </div>
            )}
          </div>

          {/* ===================================================
              ACTIONS
              =================================================== */}

      
        </div>
        <div className="detail-footer">
  <div className="detail-footer-label">
    <strong>{media.title}</strong>
    <span>
{{
  movie: 'Movie',
  game: 'Video Game',
  book: 'Book',
  music: 'Music',
}[media.type]}
      {' · '}
      {media.year}
    </span>
  </div>

  <div className="detail-actions">
    <button
      type="button"
      className="detail-edit-button"
      onClick={() => onEdit(media)}
    >
      Edit Media
    </button>

    <button
      type="button"
      className="detail-remove-button"
      onClick={() => onRemove(media)}
    >
      Remove
    </button>
  </div>
</div>
      </div>
    </div>
  )
}

export default MediaDetail
