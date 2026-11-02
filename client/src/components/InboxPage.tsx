
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type InboxTab =
  | 'all'
  | 'requests'
  | 'updates'
  | 'community'

interface FriendRequest {
  id: string
  requester_id: string
  receiver_id: string
  created_at: string
  display_name: string
  username: string
}

interface FriendshipRow {
  id: string
  requester_id: string
  receiver_id: string
  created_at: string
}

function InboxPage() {
  const [activeTab, setActiveTab] =
    useState<InboxTab>('all')

  const [requests, setRequests] =
    useState<FriendRequest[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processingId, setProcessingId] =
    useState<string | null>(null)

  const tabs: {
    id: InboxTab
    label: string
  }[] = [
    { id: 'all', label: 'All' },
    { id: 'requests', label: 'Friend Requests' },
    { id: 'updates', label: 'Updates' },
    { id: 'community', label: 'Community' },
  ]

  /* =====================================================
     LOAD INCOMING FRIEND REQUESTS
     ===================================================== */

  useEffect(() => {
    let cancelled = false

    const loadRequests = async () => {
      setLoading(true)
      setError('')

      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser()

        if (userError) throw userError

        const user = userData.user

        if (!user) {
          throw new Error(
            'You must be signed in to view requests.'
          )
        }

        const { data, error: requestError } =
          await supabase
            .from('friendships')
            .select(
              'id, requester_id, receiver_id, created_at'
            )
            .eq('receiver_id', user.id)
            .eq('status', 'pending')
            .order('created_at', {
              ascending: false,
            })

        if (requestError) throw requestError

        const rows = (data ?? []) as FriendshipRow[]

        const enrichedRequests = await Promise.all(
          rows.map(async (request) => {
            const { data: profileData, error: profileError } =
              await supabase.rpc(
                'get_public_profile',
                {
                  collector_id: request.requester_id,
                }
              )

            if (profileError) {
              console.error(
                'Unable to load requester profile:',
                profileError
              )
            }

            const profile = profileData?.[0]

            return {
              ...request,
              display_name:
                profile?.display_name ||
                profile?.username ||
                'MediaVault Collector',
              username:
                profile?.username || '',
            }
          })
        )

        if (cancelled) return

        setRequests(enrichedRequests)
      } catch (err) {
        if (cancelled) return

        console.error('Inbox request load failed:', err)

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load friend requests.'
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadRequests()

    return () => {
      cancelled = true
    }
  }, [])

  /* =====================================================
     ACCEPT / DECLINE FRIEND REQUEST
     ===================================================== */

  const handleRequestResponse = async (
    requestId: string,
    response: 'accepted' | 'declined'
  ) => {
    if (processingId) return

    setProcessingId(requestId)
    setError('')

    try {
      const { error: responseError } =
        await supabase.rpc(
          'respond_to_friend_request',
          {
            request_id: requestId,
            response,
          }
        )

      if (responseError) throw responseError

      setRequests((current) =>
        current.filter(
          (request) => request.id !== requestId
        )
      )
    } catch (err) {
      console.error(
        'Friend request response failed:',
        err
      )

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to respond to friend request.'
      )
    } finally {
      setProcessingId(null)
    }
  }

  /* =====================================================
     EMPTY STATE CONTENT
     ===================================================== */

  const emptyTitle =
    activeTab === 'requests'
      ? 'No friend requests'
      : activeTab === 'updates'
        ? 'No new updates'
        : activeTab === 'community'
          ? 'No community announcements'
          : "You're all caught up"

  const emptyDescription =
    activeTab === 'requests'
      ? 'Incoming friend requests will appear here.'
      : activeTab === 'updates'
        ? 'Comments, likes, and optional friend updates will appear here.'
        : activeTab === 'community'
          ? 'MediaVault news and announcements will appear here.'
          : 'Your notifications and friend requests will appear here.'

  const showRequests =
    activeTab === 'all' || activeTab === 'requests'

  return (
    <section className="inbox-page">

      {/* HEADER */}

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

      {/* TABS */}

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

            {tab.id === 'requests' &&
              requests.length > 0 && (
                <span className="inbox-tab-count">
                  {requests.length}
                </span>
              )}
          </button>
        ))}
      </div>

      {/* CONTENT */}

      <div className="inbox-content">

        {loading && showRequests ? (
          <div className="inbox-empty">
            <h2>Loading requests...</h2>
          </div>
        ) : error && showRequests ? (
          <div className="inbox-empty">
            <h2>Unable to load requests</h2>
            <p role="alert">{error}</p>
          </div>
        ) : showRequests && requests.length > 0 ? (

          <div className="inbox-request-list">

            {requests.map((request) => (
              <div
                key={request.id}
                className="inbox-request-card"
              >
                <div className="inbox-request-avatar">
                  {request.display_name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="inbox-request-info">
                  <strong>
                    {request.display_name}
                  </strong>

                  {request.username && (
                    <span className="inbox-request-username">
                      @{request.username}
                    </span>
                  )}

                  <p>
                    Sent you a friend request.
                  </p>

                  <small>
                    {new Date(
                      request.created_at
                    ).toLocaleDateString()}
                  </small>
                </div>

                <div className="inbox-request-actions">

                  <button
                    type="button"
                    className="inbox-accept-button"
                    disabled={processingId !== null}
                    onClick={() =>
                      void handleRequestResponse(
                        request.id,
                        'accepted'
                      )
                    }
                  >
                    {processingId === request.id
                      ? 'Processing...'
                      : 'Accept'}
                  </button>

                  <button
                    type="button"
                    className="inbox-decline-button"
                    disabled={processingId !== null}
                    onClick={() =>
                      void handleRequestResponse(
                        request.id,
                        'declined'
                      )
                    }
                  >
                    Decline
                  </button>

                </div>
              </div>
            ))}

          </div>

        ) : (
          <div className="inbox-empty">
            <span
              className="inbox-empty-icon"
              aria-hidden="true"
            >
              ◇
            </span>

            <h2>{emptyTitle}</h2>
            <p>{emptyDescription}</p>
          </div>
        )}

      </div>
    </section>
  )
}

export default InboxPage
