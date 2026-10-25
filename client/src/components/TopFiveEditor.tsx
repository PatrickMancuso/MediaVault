
import { useEffect, useMemo, useState } from 'react'
import type { MediaItem } from '../data/sampleMedia'

interface TopFiveEditorProps {
  type: 'movie' | 'game'
  items: MediaItem[]
  selectedIds: string[]
  onClose: () => void
  onSave: (ids: string[]) => Promise<void>
}

function TopFiveEditor({
  type,
  items,
  selectedIds,
  onClose,
  onSave,
}: TopFiveEditorProps) {
  const [selected, setSelected] = useState<string[]>(
    selectedIds.slice(0, 5)
  )

  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const mediaLabel =
    type === 'movie' ? 'Movies' : 'Games'

  /* =====================================================
     FILTER AVAILABLE TITLES
     ===================================================== */

  const available = useMemo(() => {
    const query = search.trim().toLowerCase()

    return items
      .filter((item) => item.type === type)
      .filter((item) =>
        item.title.toLowerCase().includes(query)
      )
      .sort((a, b) =>
        a.title.localeCompare(b.title)
      )
  }, [items, type, search])

  /* =====================================================
     CURRENTLY SELECTED TITLES
     ===================================================== */

  const selectedItems = selected
    .map((id) =>
      items.find(
        (item) =>
          item.id === id &&
          item.type === type
      )
    )
    .filter(
      (item): item is MediaItem =>
        item !== undefined
    )

  /* =====================================================
     SELECT OR REMOVE TITLE
     ===================================================== */

  const toggleItem = (id: string) => {
    if (saving) return

    setSelected((current) => {
      if (current.includes(id)) {
        return current.filter(
          (value) => value !== id
        )
      }

      if (current.length >= 5) {
        return current
      }

      return [...current, id]
    })
  }

  /* =====================================================
     CHANGE RANKING ORDER
     ===================================================== */

  const moveItem = (
    index: number,
    direction: -1 | 1,
  ) => {
    if (saving) return

    setSelected((current) => {
      const target = index + direction

      if (
        target < 0 ||
        target >= current.length
      ) {
        return current
      }

      const next = [...current]

      const temporary = next[index]
      next[index] = next[target]
      next[target] = temporary

      return next
    })
  }

  /* =====================================================
     SAVE RANKING
     ===================================================== */

  const handleSave = async () => {
    if (saving) return

    setSaving(true)
    setError('')

    try {
      await onSave(selected)
      onClose()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save your Top 5.'
      )
    } finally {
      setSaving(false)
    }
  }

  /* =====================================================
     CLOSE WITH ESCAPE KEY
     ===================================================== */

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === 'Escape' &&
        !saving
      ) {
        onClose()
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown
    )

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [onClose, saving])

  /* =====================================================
     EDITOR MODAL
     ===================================================== */

  return (
    <div
      className="auth-backdrop"
      onClick={() => {
        if (!saving) onClose()
      }}
    >
      <section
        className="auth-modal top-five-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="top-five-editor-title"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* CLOSE BUTTON */}

        <button
          type="button"
          className="auth-close"
          onClick={onClose}
          disabled={saving}
          aria-label="Close Top 5 editor"
        >
          ×
        </button>

        {/* HEADER */}

        <div className="auth-header">
          <p className="auth-eyebrow">
            PERSONAL FAVORITES
          </p>

          <h2 id="top-five-editor-title">
            Edit Top 5 {mediaLabel}
          </h2>

          <p>
            Choose up to five titles from your
            collection and arrange them in your
            preferred order.
          </p>
        </div>

        {/* SELECTED RANKINGS */}

        <div className="top-five-selected">
          <div className="top-five-editor-heading">
            <strong>Your Ranking</strong>

            <span>
              {selected.length} / 5 selected
            </span>
          </div>

          {selectedItems.length === 0 ? (
            <p className="top-five-editor-empty">
              No titles selected yet.
              Search below to get started.
            </p>
          ) : (
            selectedItems.map((item, index) => (
              <div
                key={item.id}
                className="top-five-ranked-item"
              >
                <span className="top-five-rank">
                  {index + 1}
                </span>

                <span className="top-five-ranked-title">
                  {item.title}
                </span>

                <div className="top-five-rank-actions">
                  <button
                    type="button"
                    onClick={() =>
                      moveItem(index, -1)
                    }
                    disabled={
                      saving || index === 0
                    }
                    aria-label={`Move ${item.title} up`}
                  >
                    ↑
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      moveItem(index, 1)
                    }
                    disabled={
                      saving ||
                      index === selectedItems.length - 1
                    }
                    aria-label={`Move ${item.title} down`}
                  >
                    ↓
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      toggleItem(item.id)
                    }
                    disabled={saving}
                    aria-label={`Remove ${item.title}`}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* SEARCH */}

        <div className="top-five-search">
          <label htmlFor="top-five-search-input">
            Find a Title
          </label>

          <input
            id="top-five-search-input"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder={`Search your ${mediaLabel.toLowerCase()}...`}
          />
        </div>

        {/* AVAILABLE MEDIA */}

        <div className="top-five-available">
          {available.map((item) => {
            const isSelected =
              selected.includes(item.id)

            const atLimit =
              selected.length >= 5

            return (
              <button
                key={item.id}
                type="button"
                className={`top-five-option ${
                  isSelected ? 'selected' : ''
                }`}
                onClick={() =>
                  toggleItem(item.id)
                }
                disabled={
                  saving ||
                  (!isSelected && atLimit)
                }
                aria-pressed={isSelected}
              >
                <span>{item.title}</span>

                <small>{item.year}</small>

                <strong>
                  {isSelected ? '✓' : '+'}
                </strong>
              </button>
            )
          })}

          {available.length === 0 && (
            <p className="top-five-editor-empty">
              No matching titles found.
            </p>
          )}
        </div>

        {/* ERROR */}

        {error && (
          <p
            className="auth-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* SAVE */}

        <button
          type="button"
          className="auth-submit"
          onClick={() =>
            void handleSave()
          }
          disabled={saving}
        >
          {saving
            ? 'Saving...'
            : 'Save Top 5'}
        </button>
      </section>
    </div>
  )
}

export default TopFiveEditor
