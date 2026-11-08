
import WelcomeSlideshow from './WelcomeSlideshow'

interface WelcomePageProps {
  onSignIn: () => void
  onGetStarted: () => void
}

function WelcomePage({
  onGetStarted,
}: WelcomePageProps) {
  return (
    <div className="welcome-page welcome-page-compact">
      <main className="welcome-main">

        {/* HERO */}

        <section className="welcome-hero">

          <div className="welcome-hero-content">

            <div className="welcome-brand welcome-hero-brand">

              <strong>
                MEDIA<span>VAULT</span>
              </strong>
            </div>

            <span className="welcome-eyebrow">
              PERSONAL MEDIA ARCHIVE
            </span>

            <h1>
              Your collection.
              <br />
              Your way.
            </h1>

            <p>
              Give your movies, books, music, and games a home.
              Organize your collection, review your
              favorites, connect with friends, and keep track of the media
              that matters to you.
            </p>

            <div className="welcome-hero-actions">
              <button
                type="button"
                className="welcome-primary-button"
                onClick={onGetStarted}
              >
                Get Started
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>

          {/* SCREENSHOT SLIDESHOW */}

          <div className="welcome-hero-preview">
            <WelcomeSlideshow />
          </div>

        </section>

        {/* FEATURES */}

        <section className="welcome-features">
          <div>
            <span>01</span>
            <h3>Build Your Archive</h3>
            <p>
              Add movies, music, books, and games with automatic
              metadata or enter your own details.
            </p>
          </div>

          <div>
            <span>02</span>
            <h3>Explore Your Collection</h3>
            <p>
              Browse your media using artwork,
              categories, search, and filters.
            </p>
          </div>

          <div>
            <span>03</span>
            <h3>Make It Personal</h3>
            <p>
              Save favorites, write reviews, and
              rate the titles you own.
            </p>
          </div>
        </section>

      </main>
    </div>
  )
}

export default WelcomePage
