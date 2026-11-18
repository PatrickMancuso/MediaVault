
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface ActivityNotification {
  id: string
  actor_id: string
  actor_name: string
  notification_type: 'like' | 'comment'
  post_id: string
  post_type: 'addition' | 'review'
  media_id: string | null
  media_title: string | null
  comment_body: string | null
  created_at: string
  read_at: string | null
}

interface ActivityNotificationsProps {
  compact?: boolean
  onNotificationRead?: () => void
}

function ActivityNotifications({
  compact = false,
  onNotificationRead,
}: ActivityNotificationsProps) {
  const [notifications, setNotifications] =
    useState<ActivityNotification[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadNotifications = async () => {
      setLoading(true)

      const { data, error } = await supabase.rpc(
        'get_my_activity_notifications',
        { p_limit: compact ? 5 : 50 }
      )

      if (cancelled) return

      if (error) {
        console.error(error)
        setError('Unable to load notifications.')
      } else {
        setNotifications(
          (data ?? []) as ActivityNotification[]
        )
      }

      setLoading(false)
    }

    void loadNotifications()

    return () => {
      cancelled = true
    }
  }, [compact])

  const handleNotificationClick = async (
    notification: ActivityNotification
  ) => {
    if (!notification.read_at) {
      const { error } = await supabase.rpc(
        'mark_activity_notification_read',
        { p_notification_id: notification.id }
      )

      if (error) {
        console.error(
          'Unable to mark notification read:',
          error
        )
        return
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                read_at: new Date().toISOString(),
              }
            : item
        )
      )

      onNotificationRead?.()
    }
  }

  const getMessage = (
    notification: ActivityNotification
  ) => {
    const action =
      notification.notification_type === 'like'
        ? 'liked'
        : 'commented on'

    if (notification.post_type === 'review') {
      return `${action} your review of ${
        notification.media_title ?? 'a title'
      }`
    }

    return `${action} your collection additions`
  }

  if (loading) {
    return (
      <div className="activity-notifications-empty">
        Loading notifications...
      </div>
    )
  }

  if (error) {
    return (
      <div className="activity-notifications-empty">
        {error}
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="activity-notifications-empty">
        No interactions yet.
      </div>
    )
  }

  return (
    <div
      className={`activity-notifications ${
        compact ? 'compact' : 'full'
      }`}
    >
      {notifications.map((notification) => (
        <button
          key={notification.id}
          type="button"
          className={`activity-notification ${
            notification.read_at ? '' : 'unread'
          }`}
          onClick={() =>
            void handleNotificationClick(notification)
          }
        >
          <span className="activity-notification-icon">
            {notification.notification_type === 'like'
              ? '♥'
              : '◉'}
          </span>

          <span className="activity-notification-content">
            <strong>{notification.actor_name}</strong>

            <span>{getMessage(notification)}</span>

            {notification.notification_type === 'comment' &&
              notification.comment_body && (
                <small className="activity-notification-preview">
                  "{notification.comment_body}"
                </small>
              )}

            <small>
              {new Date(
                notification.created_at
              ).toLocaleString()}
            </small>
          </span>

          {!notification.read_at && (
            <span className="activity-notification-dot" />
          )}
        </button>
      ))}
    </div>
  )
}

export default ActivityNotifications
