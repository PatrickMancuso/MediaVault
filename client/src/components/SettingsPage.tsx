
type DashboardLayout = 'standard' | 'compact'

interface SettingsPageProps {
  dashboardLayout: DashboardLayout
  onDashboardLayoutChange: (
    layout: DashboardLayout
  ) => void
}

function SettingsPage({
  dashboardLayout,
  onDashboardLayoutChange,
}: SettingsPageProps) {
  return (
    <section className="settings-page">

      {/* PAGE HEADER */}

      <div className="settings-header">
        <span className="settings-eyebrow">
          PERSONALIZE YOUR ARCHIVE
        </span>

        <h1>Settings</h1>

        <p>
          Customize your MediaVault experience.
        </p>
      </div>

      {/* DASHBOARD SETTINGS */}

      <div className="settings-section">
        <div className="settings-section-heading">
          <h2>Dashboard</h2>

          <p>
            Control how your collection appears
            on the home page.
          </p>
        </div>

        <div className="settings-option">
          <div className="settings-option-info">
            <h3>Collection Layout</h3>

            <p>
              Choose how your media categories
              are arranged on the dashboard.
            </p>
          </div>

          <div className="settings-layout-options">

            {/* STANDARD LAYOUT */}

            <button
              type="button"
              className={`settings-layout-choice ${
                dashboardLayout === 'standard'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                onDashboardLayoutChange('standard')
              }
              aria-pressed={
                dashboardLayout === 'standard'
              }
            >
              <div className="settings-layout-preview standard">
                <span />
                <span />
                <span />
                <span />
              </div>

              <strong>Standard</strong>
              <small>2 × 2 grid</small>
            </button>

            {/* COMPACT LAYOUT */}

            <button
              type="button"
              className={`settings-layout-choice ${
                dashboardLayout === 'compact'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                onDashboardLayoutChange('compact')
              }
              aria-pressed={
                dashboardLayout === 'compact'
              }
            >
              <div className="settings-layout-preview compact">
                <span />
                <span />
                <span />
                <span />
              </div>

              <strong>Compact</strong>
              <small>Single row</small>
            </button>

          </div>
        </div>
      </div>

      {/* FUTURE CUSTOMIZATION */}

      <div className="settings-section">
        <div className="settings-section-heading">
          <h2>Appearance</h2>

          <p>
            Additional personalization options
            will be available here.
          </p>
        </div>
      </div>

    </section>
  )
}

export default SettingsPage
