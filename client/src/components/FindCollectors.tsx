
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
  onEditProfile: () => void
}

function FindCollectors({
  onSelectCollector,
  onEditProfile,
}: FindCollectorsProps) {
  const [search, setSearch] = useState('')
  const [collectors, setCollectors] =
    useState<Collector[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [profileVisibility, setProfileVisibility] =
  useState<'loading' | 'public' | 'private' | 'error'>(
    'loading'
  )

  useEffect(() => {
  let cancelled = false

  const checkProfileVisibility = async () => {
    setProfileVisibility('loading')

    const { data: authData, error: authError } =
      await supabase.auth.getUser()

    if (cancelled) return

    if (authError || !authData.user) {
      setProfileVisibility('error')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('is_public')
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (cancelled) return

    if (error) {
      console.error(
        'Unable to check profile visibility:',
        error
      )
      setProfileVisibility('error')
      return
    }

    setProfileVisibility(
      data?.is_public === true
        ? 'public'
        : 'private'
    )
  }

  void checkProfileVisibility()

  return () => {
    cancelled = true
  }
}, [])

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

      {profileVisibility === 'private' && (
  <div className="collectors-visibility-banner">
    <div className="collectors-visibility-content">
      <span className="collectors-visibility-label">
        PROFILE VISIBILITY
      </span>

      <h2>Your profile is currently private</h2>

      <p>
        Other collectors cannot discover your profile.
        Make your profile public to share your collection
        and connect with the community.
      </p>
    </div>

    <button
      type="button"
      className="collectors-edit-profile-button"
      onClick={onEditProfile}
    >
      Edit Profile →
    </button>
  </div>
)}

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
