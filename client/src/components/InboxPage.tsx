
import { useState } from 'react'

type InboxTab =
  | 'all'
  | 'requests'
  | 'updates'
  | 'community'

function InboxPage() {
  const [activeTab, setActiveTab] =
    useState<InboxTab>('all')

  const tabs: {
    id: InboxTab
    label: string
  }[] = [
    { id: 'all', label: 'All' },
    { id: 'requests', label: 'Friend Requests' },
    { id: 'updates', label: 'Updates' },
    { id: 'community', label: 'Community' },
  ]

  return (
    <section className="inbox-page">

      <div className="inbox-header">
        <div>
          <span className="inbox-eyebrow">
            YOUR CONNECTIONS
          </span>

          <h1>Inbox</h1>

          <p>
            Friend requests, notifications,
            and updates from MediaVault.
          </p>
        </div>
      </div>

      <div
        className="inbox-tabs"
        role="group"
        aria-label="Inbox categories"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={
              activeTab === tab.id
                ? 'inbox-tab active'
                : 'inbox-tab'
            }
            aria-pressed={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="inbox-content">
        <div className="inbox-empty">
          <span
            className="inbox-empty-icon"
            aria-hidden="true"
          >
            ◇
          </span>

          <h2>
            {activeTab === 'requests'
              ? 'No friend requests'
              : activeTab === 'updates'
                ? 'No new updates'
                : activeTab === 'community'
                  ? 'No community announcements'
                  : "You're all caught up"}
          </h2>

          <p>
            {activeTab === 'requests'
              ? 'Incoming friend requests will appear here.'
              : activeTab === 'updates'
                ? 'Comments, likes, and optional friend updates will appear here.'
                : activeTab === 'community'
                  ? 'MediaVault news and announcements will appear here.'
                  : 'Your notifications and friend requests will appear here.'}
          </p>
        </div>
      </div>

    </section>
  )
}

export default InboxPage

