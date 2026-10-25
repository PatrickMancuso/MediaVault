
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

export interface ProfileChanges {
  displayName: string
  bio: string
  avatarFile: File | null
}

interface EditProfileModalProps {
  displayName: string
  bio: string
  onClose: () => void
  onSave: (changes: ProfileChanges) => Promise<void>
}

function EditProfileModal({
  displayName,
  bio,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const [name, setName] = useState(displayName)
  const [about, setAbout] = useState(bio)
  const [avatarFile, setAvatarFile] =
    useState<File | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleAvatarChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (
      !['image/jpeg', 'image/png', 'image/webp']
        .includes(file.type)
    ) {
      setError('Choose a JPG, PNG, or WebP image.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Profile pictures must be under 2 MB.')
      return
    }

    setError('')
    setAvatarFile(file)
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please enter a display name.')
      return
    }

    setSaving(true)

    try {
      await onSave({
        displayName: name.trim(),
        bio: about.trim(),
        avatarFile,
      })

      onClose()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save your profile.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="auth-backdrop"
      onClick={() => {
        if (!saving) onClose()
      }}
    >
      <section
        className="auth-modal profile-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="auth-close"
          onClick={onClose}
          disabled={saving}
          aria-label="Close edit profile"
        >
          ×
        </button>

        <div className="auth-header">
          <p className="auth-eyebrow">
            PERSONALIZE YOUR ARCHIVE
          </p>

          <h2 id="edit-profile-title">
            Edit Profile
          </h2>

          <p>
            Customize how your MediaVault profile
            appears.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <label>
            Display Name
            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              maxLength={60}
              required
            />
          </label>

          <label>
            Bio
            <textarea
              value={about}
              onChange={(event) =>
                setAbout(event.target.value)
              }
              maxLength={500}
              rows={4}
              placeholder="Tell us about your collection..."
            />
          </label>

          <label>
            Profile Picture
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarChange}
            />
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </section>
    </div>
  )
}

export default EditProfileModal
