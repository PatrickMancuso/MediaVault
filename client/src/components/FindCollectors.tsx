
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Collector {
  user_id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_path: string | null
}

interface FindCollectorsProps {
  onSelectCollector: (userId: string) => void
}

function FindCollectors({
  onSelectCollector,
}: FindCollectorsProps) {
  const [search, setSearch] = useState('')
  const [collectors, setCollectors] =
    useState<Collector[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setError('')

      const { data, error: searchError } =
        await supabase.rpc('search_collectors', {
          search_term: search.trim(),
          result_limit: 20,
        })

      if (cancelled) return

      if (searchError) {
        console.error(
          'Collector search failed:',
          searchError
        )

        setError('Unable to search collectors.')
        setCollectors([])
      } else {
        setCollectors(data ?? [])
      }

      setLoading(false)
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [search])

  return (
    <section className="find-collectors">
      <div className="find-collectors-header">
        <h1>Find Collectors</h1>

        <p>
          Discover other MediaVault users
          and explore their profiles.
        </p>
      </div>

      <input
        type="search"
        className="find-collectors-search"
        placeholder="Search by username or name..."
        value={search}
        onChange={(event) =>
          setSearch(event.target.value)
        }
      />

      {loading && (
        <p>Searching collectors...</p>
      )}

      {error && (
        <p className="auth-error">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="find-collectors-results">
          {collectors.length === 0 ? (
  <p className="find-collectors-empty">
    {search.trim()
      ? 'No collectors match your search.'
      : 'No public collectors yet. Be the first to share your collection!'}
  </p>
) : (
            collectors.map((collector) => (
              <button
                key={collector.user_id}
                type="button"
                className="collector-result"
                onClick={() =>
                  onSelectCollector(
                    collector.user_id
                  )
                }
              >
                <div className="collector-result-avatar">
                  {(collector.display_name ||
                    collector.username)
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="collector-result-info">
                  <strong>
                    {collector.display_name ||
                      collector.username}
                  </strong>

                  <span>
                    @{collector.username}
                  </span>

                  {collector.bio && (
                    <p>{collector.bio}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </section>
  )
}

export default FindCollectors
