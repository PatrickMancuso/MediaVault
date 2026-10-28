
import { useEffect, useRef, useState } from 'react'

type View =
  | 'collection'
  | 'movies'
  | 'games'
  | 'favorites'
  | 'profile'
  | 'collectors'

interface HeaderProps {
  activeView: View
  onViewChange: (view: View) => void
  onAddMedia: () => void
  onAccount: () => void
  userEmail?: string | null
}

function Header({
  activeView,
  onViewChange,
  onAddMedia,
  onAccount,
  userEmail,
}: HeaderProps) {
  const [
    isAccountMenuOpen,
    setIsAccountMenuOpen,
  ] = useState(false)

  const accountMenuRef =
    useRef<HTMLDivElement>(null)

  const navigation = [
    {
      id: 'collection' as const,
      label: 'Collection',
    },
    {
      id: 'movies' as const,
      label: 'Movies',
    },
    {
      id: 'games' as const,
      label: 'Games',
    },
    {
      id: 'favorites' as const,
      label: 'Favorites',
    },
  ]

  /* =====================================================
     CLOSE DROPDOWN WHEN CLICKING OUTSIDE
     ===================================================== */

  useEffect(() => {
    const handleOutsideClick = (
      event: MouseEvent,
    ) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsAccountMenuOpen(false)
      }
    }

    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick,
    )

    document.addEventListener(
      'keydown',
      handleEscape,
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      )

      document.removeEventListener(
        'keydown',
        handleEscape,
      )
    }
  }, [])

  /* =====================================================
     ACCOUNT MENU
     ===================================================== */

  const handleAccountClick = () => {
    if (!userEmail) {
      onAccount()
      return
    }

    setIsAccountMenuOpen(
      (current) => !current,
    )
  }

  const handleProfileClick = () => {
    setIsAccountMenuOpen(false)
    onViewChange('profile')
  }


  const handleCollectorsClick = () => {
  setIsAccountMenuOpen(false)
  onViewChange('collectors')
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
          onClick={() =>
            onViewChange('collection')
          }
          aria-label="Go to collection"
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
          {navigation.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${
                activeView === item.id
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                onViewChange(item.id)
              }
            >
              <span className="nav-label">
                {item.label}
              </span>

              <span className="nav-indicator" />
            </button>
          ))}
        </nav>

        {/* HEADER ACTIONS */}

        <div className="header-actions">

          {/* ADD MEDIA */}

          <button
            type="button"
            className="header-add-media"
            onClick={onAddMedia}
          >
            <span className="header-add-icon">
              +
            </span>

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
                userEmail
                  ? isAccountMenuOpen
                  : undefined
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

           
{/* ACCOUNT DROPDOWN */}

{userEmail && isAccountMenuOpen && (
  <div
    className="account-menu"
    role="menu"
  >
    {/* PROFILE */}

    <button
      type="button"
      className="account-menu-item"
      role="menuitem"
      onClick={handleProfileClick}
    >
      <span>Profile</span>
      <span aria-hidden="true">›</span>
    </button>

    {/* FIND COLLECTORS */}

    <button
      type="button"
      className="account-menu-item"
      role="menuitem"
      onClick={handleCollectorsClick}
    >
      <span>Find Collectors</span>
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
