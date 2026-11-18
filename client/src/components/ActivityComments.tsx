
interface ActivityComment {
  id: string
  user_id: string
  username: string | null
  display_name: string | null
  body: string
  created_at: string
}

interface ActivityCommentsProps {
  comments: ActivityComment[]
  currentUserId: string | null
  draft: string
  loading: boolean
  submitting: boolean
  deletingComments: string[]
  onDraftChange: (value: string) => void
  onSubmit: () => void
  onDelete: (commentId: string) => void
}

function ActivityComments({
  comments,
  currentUserId,
  draft,
  loading,
  submitting,
  deletingComments,
  onDraftChange,
  onSubmit,
  onDelete,
}: ActivityCommentsProps) {
  return (
    <div className="feed-comments-panel">
      {loading ? (
        <p className="feed-comments-empty">
          Loading comments...
        </p>
      ) : comments.length === 0 ? (
        <p className="feed-comments-empty">
          No comments yet. Start the conversation.
        </p>
      ) : (
        <div className="feed-comments-list">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="feed-comment"
            >
              <div className="feed-comment-content">
                <strong>
                  {comment.display_name ||
                    comment.username ||
                    'Collector'}
                </strong>

                <p>{comment.body}</p>

                <small>
                  {new Date(
                    comment.created_at
                  ).toLocaleDateString()}
                </small>
              </div>

              {comment.user_id === currentUserId && (
                <button
                  type="button"
                  className="feed-comment-delete"
                  disabled={deletingComments.includes(
                    comment.id
                  )}
                  onClick={() => onDelete(comment.id)}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="feed-comment-compose">
        <textarea
          value={draft}
          maxLength={1000}
          rows={2}
          placeholder="Write a comment..."
          onChange={(event) =>
            onDraftChange(event.target.value)
          }
        />

        <button
          type="button"
          disabled={!draft.trim() || submitting}
          onClick={onSubmit}
        >
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </div>
  )
}

export default ActivityComments
