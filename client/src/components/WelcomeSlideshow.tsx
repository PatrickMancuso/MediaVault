
import { useEffect, useState } from 'react'

import dashboardImage from '../assets/welcome/MediaVaultDashMain.png'
import reviewsImage from '../assets/welcome/MediaVaultReviewFav.png'

import moviesImage from '../assets/welcome/gamesearch.png'
import gamesImage from '../assets/welcome/Library.png'
import addMediaImage from '../assets/welcome/mediadetail.png'

const slides = [
  {
    image: dashboardImage,
    title: 'Your Collection',
    description:
      'See your movies, games, favorites, and recent reviews in one place.',
  },
  {
    image: moviesImage,
    title: 'Browse Your Media',
    description:
      'Explore your collection with artwork, search, filters, and sorting.',
  },

  {
    image: reviewsImage,
    title: 'Rate & Review',
    description:
      'Record your personal ratings and thoughts about each title.',
  },
  {
  image: addMediaImage,
  title: 'Add to Your Collection',
  description:
    'Search for movies or games and import their details automatically.',
},
  {
    image: gamesImage,
    title: 'Organize Your Stuff',
    description:
      'Keep track of your favorite media and the formats you own.',
  },
]

function WelcomeSlideshow() {
  const [activeSlide, setActiveSlide] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return

    const interval = window.setInterval(() => {
      setActiveSlide((current) =>
        (current + 1) % slides.length
      )
    }, 6500)

    return () => window.clearInterval(interval)
  }, [paused])

  const changeSlide = (direction: number) => {
    setActiveSlide((current) =>
      (current + direction + slides.length) %
      slides.length
    )
  }

  return (
    <section
      className="welcome-slideshow"
      aria-label="MediaVault feature preview"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (
          !event.currentTarget.contains(
            event.relatedTarget as Node | null
          )
        ) {
          setPaused(false)
        }
      }}
    >
      <div className="welcome-slide-frame">
        <img
          src={slides[activeSlide].image}
          alt={slides[activeSlide].title}
          className="welcome-slide-image"
        />
      </div>

      <div className="welcome-slide-footer">
        <div className="welcome-slide-description">
          <span className="welcome-slide-number">
            {String(activeSlide + 1).padStart(2, '0')}
            {' / '}
            {String(slides.length).padStart(2, '0')}
          </span>

          <h3>{slides[activeSlide].title}</h3>
          <p>{slides[activeSlide].description}</p>
        </div>

        <div className="welcome-slide-controls">
          <button
            type="button"
            onClick={() => changeSlide(-1)}
            aria-label="Previous slide"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={() => changeSlide(1)}
            aria-label="Next slide"
          >
            ›
          </button>
        </div>
      </div>

      <div className="welcome-slide-dots">
        {slides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            className={
              activeSlide === index ? 'active' : ''
            }
            onClick={() => setActiveSlide(index)}
            aria-label={`Show ${slide.title}`}
            aria-current={
              activeSlide === index ? 'true' : undefined
            }
          />
        ))}
      </div>
    </section>
  )
}

export default WelcomeSlideshow
