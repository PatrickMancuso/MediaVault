
import { useEffect, useRef, useState } from 'react'

type View =
  | 'collection'
  | 'movies'
  | 'games'
  | 'books'
  | 'music'
  | 'favorites'
  | 'profile'
  | 'collectors'
  | 'feed'
  | 'inbox'
  | 'settings'


interface HeaderProps {
  activeView: View
  onViewChange: (view: View) => void
  onAddMedia: () => void
  onAccount: () => void
  userEmail?: string | null
  inboxUnreadCount?: number

  availableMediaTypes: {
    movies: boolean
    games: boolean
    music: boolean
    books: boolean
  }

  collectionLoading: boolean
}



function Header({
  activeView,
  onViewChange,
  onAddMedia,
  onAccount,
  userEmail,
  inboxUnreadCount = 0,
  availableMediaTypes,
  collectionLoading,
}: HeaderProps) {

  const [isAccountMenuOpen, setIsAccountMenuOpen] =
    useState(false)

  const [isLibraryMenuOpen, setIsLibraryMenuOpen] =
    useState(false)

  const accountMenuRef = useRef<HTMLDivElement>(null)
  const libraryMenuRef = useRef<HTMLDivElement>(null)

 const isLibraryActive =
  activeView === 'movies' ||
  activeView === 'games' ||
  activeView === 'books' ||
  activeView === 'music' ||
  activeView === 'favorites'

  const hasAnyMedia = Object.values(
  availableMediaTypes
).some(Boolean)

  /* =====================================================
     CLOSE DROPDOWNS
     ===================================================== */

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node

      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(target)
      ) {
        setIsAccountMenuOpen(false)
      }

      if (
        libraryMenuRef.current &&
        !libraryMenuRef.current.contains(target)
      ) {
        setIsLibraryMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false)
        setIsLibraryMenuOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    )

    document.addEventListener(
      'keydown',
      handleEscape
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      )

      document.removeEventListener(
        'keydown',
        handleEscape
      )
    }
  }, [])

  /* =====================================================
     NAVIGATION HANDLERS
     ===================================================== */

  const navigateTo = (view: View) => {
    setIsAccountMenuOpen(false)
    setIsLibraryMenuOpen(false)
    onViewChange(view)
  }

  const handleAccountClick = () => {
    if (!userEmail) {
      onAccount()
      return
    }

    setIsLibraryMenuOpen(false)
    setIsAccountMenuOpen((current) => !current)
  }

  const handleLibraryClick = () => {
    setIsAccountMenuOpen(false)
    setIsLibraryMenuOpen((current) => !current)
  }

  /* =====================================================
     HEADER
     ===================================================== */

  return (
    <header className="site-header">
      <div className="header-inner">

        {/* MEDIAVAULT LOGO */}

        <button
          type="button"
          className="brand-console"
          onClick={() => navigateTo('collection')}
          aria-label="Go to home"
        >
          <span className="brand-light" />

          <span className="brand-mark">
            MEDIA<span>VAULT</span>
          </span>

          <span className="brand-caption">
            PERSONAL MEDIA ARCHIVE
          </span>
        </button>

        {/* MAIN NAVIGATION */}

        <nav
          className="main-nav"
          aria-label="Main navigation"
        >

          {/* HOME */}

          <button
            type="button"
            className={`nav-item ${
              activeView === 'collection' ? 'active' : ''
            }`}
            onClick={() => navigateTo('collection')}
          >
            <span className="nav-label">Home</span>
            <span className="nav-indicator" />
          </button>

          {/* LIBRARY DROPDOWN */}

          <div
            className="header-library-wrapper"
            ref={libraryMenuRef}
          >
            <button
              type="button"
              className={`nav-item header-library-trigger ${
                isLibraryActive ? 'active' : ''
              }`}
              onClick={handleLibraryClick}
              aria-expanded={isLibraryMenuOpen}
              aria-haspopup="true"
            >
              <span className="nav-label">
                Library
              </span>

        

              <span className="nav-indicator" />
            </button>

            
{isLibraryMenuOpen && (
  <div className="library-dropdown">

    {collectionLoading ? (
      <div className="library-dropdown-empty">
        Loading library...
      </div>
    ) : (
      <>
        {availableMediaTypes.movies && (
          <button
            type="button"
            className={`library-dropdown-item ${
              activeView === 'movies' ? 'active' : ''
            }`}
            onClick={() => navigateTo('movies')}
          >
            <span>Movies</span>
            <span aria-hidden="true">›</span>
          </button>
        )}

        {availableMediaTypes.games && (
          <button
            type="button"
            className={`library-dropdown-item ${
              activeView === 'games' ? 'active' : ''
            }`}
            onClick={() => navigateTo('games')}
          >
            <span>Games</span>
            <span aria-hidden="true">›</span>
          </button>
        )}

        {availableMediaTypes.music && (
          <button
            type="button"
            className={`library-dropdown-item ${
              activeView === 'music' ? 'active' : ''
            }`}
            onClick={() => navigateTo('music')}
          >
            <span>Music</span>
            <span aria-hidden="true">›</span>
          </button>
        )}

        {availableMediaTypes.books && (
          <button
            type="button"
            className={`library-dropdown-item ${
              activeView === 'books' ? 'active' : ''
            }`}
            onClick={() => navigateTo('books')}
          >
            <span>Books</span>
            <span aria-hidden="true">›</span>
          </button>
        )}

<div className="library-dropdown-divider" />
        
        {/* FAVORITES */}

<button
  type="button"
  className={`library-dropdown-item ${
    activeView === 'favorites' ? 'active' : ''
  }`}
  onClick={() => navigateTo('favorites')}
>
  <span>Favorites</span>
  <span aria-hidden="true">›</span>
</button>

{!hasAnyMedia && (
  <div className="library-dropdown-empty">
            Your library is empty.
            <button
              type="button"
              className="library-dropdown-add"
              onClick={() => {
                setIsLibraryMenuOpen(false)
                onAddMedia()
              }}
            >
              Add your first title →
            </button>
          </div>
        )}
      </>
    )}

  </div>
)}

          </div>

          {/* FEED */}

          <button
            type="button"
            className={`nav-item ${
              activeView === 'feed' ? 'active' : ''
            }`}
            onClick={() => navigateTo('feed')}
          >
            <span className="nav-label">Activity</span>
            <span className="nav-indicator" />
          </button>


          
{/* DISCOVER - VISUAL PLACEHOLDER */}

<button
  type="button"
  className="nav-item"
  onClick={() => {
    // Discover page coming soon.
  }}
>
  <span className="nav-label">
    Discover
  </span>

  <span className="nav-indicator" />
</button>


        </nav>

        {/* HEADER ACTIONS */}

        <div className="header-actions">

          {/* ADD MEDIA */}

         
<button
  type="button"
  className="header-add-media"
  onClick={onAddMedia}
  aria-label="Add media"
>
  <span className="header-add-icon">+</span>
  <span>Add Media</span>
</button>


          {/* HAMBURGER DROPDOWN */}

          <div
            className="header-account-wrapper"
            ref={accountMenuRef}
          >
            <button
              type="button"
              className="header-account header-menu-trigger"
              onClick={handleAccountClick}
              aria-label="Open account menu"
              aria-expanded={
                userEmail ? isAccountMenuOpen : undefined
              }
              aria-haspopup="menu"
            >
              <span
                className="header-hamburger"
                aria-hidden="true"
              >
                <span />
                <span />
                <span />
              </span>
            </button>

            {userEmail && isAccountMenuOpen && (
              <div
                className="account-menu"
                role="menu"
              >


                

{/* INBOX */}

<button
  type="button"
  className="account-menu-item"
  role="menuitem"
  onClick={() => navigateTo('inbox')}
>
  <span className="header-menu-item-content">
    <span className="header-menu-item-icon">
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 13h5l2 3h4l2-3h5" />
      </svg>
    </span>

    <span>Inbox</span>
  </span>

  <span className="header-menu-item-end">
    {inboxUnreadCount > 0 && (
      <span className="header-menu-unread">
        {inboxUnreadCount > 99
          ? '99+'
          : inboxUnreadCount}
      </span>
    )}

    <span aria-hidden="true">›</span>
  </span>
</button>


                {/* PROFILE */}

                <button
                  type="button"
                  className="account-menu-item"
                  role="menuitem"
                  onClick={() => navigateTo('profile')}
                >
                  <span className="header-menu-item-content">
  <span className="header-menu-item-icon">
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
    </svg>
  </span>

  <span>Profile</span>
</span>

<span aria-hidden="true">›</span>
                </button>

                {/* FIND COLLECTORS */}

                <button
                  type="button"
                  className="account-menu-item"
                  role="menuitem"
                  onClick={() => navigateTo('collectors')}
                >
                <span className="header-menu-item-content">
  <span className="header-menu-item-icon">
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20v-2a6 6 0 0 1 12 0v2" />
      <path d="M16 5a3 3 0 0 1 0 6" />
      <path d="M17 14a5 5 0 0 1 4 5v1" />
    </svg>
  </span>

  <span>Find Collectors</span>
</span>

<span aria-hidden="true">›</span>
                </button>

                {/* SETTINGS */}

<button
  type="button"
  className="account-menu-item"
  role="menuitem"
  onClick={() => navigateTo('settings')}
>
  <span className="header-menu-item-content">
  <span className="header-menu-item-icon">
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
    </svg>
  </span>

  <span>Settings</span>
</span>

<span aria-hidden="true">›</span>
</button>

              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  )
}

export default Header
