
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

export interface ProfileChanges {
  displayName: string
  bio: string
  username: string
  isPublic: boolean
  avatarFile: File | null
}

interface EditProfileModalProps {
  displayName: string
  bio: string
  username: string
  isPublic: boolean
  onClose: () => void
  onSave: (changes: ProfileChanges) => Promise<void>
}

function EditProfileModal({
  displayName,
  bio,
  username,
  isPublic,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const [name, setName] = useState(displayName)
  const [about, setAbout] = useState(bio)

  const [usernameValue, setUsernameValue] =
    useState(username)

  const [publicProfile, setPublicProfile] =
    useState(isPublic)

  const [avatarFile, setAvatarFile] =
    useState<File | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  /* =====================================================
     AVATAR VALIDATION
     ===================================================== */

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

  /* =====================================================
     SAVE PROFILE
     ===================================================== */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setError('')

    const cleanedUsername =
      usernameValue.trim().toLowerCase()

    if (!name.trim()) {
      setError('Please enter a display name.')
      return
    }

    if (
      cleanedUsername &&
      !/^[a-z0-9_]{3,24}$/.test(cleanedUsername)
    ) {
      setError(
        'Usernames must be 3–24 characters and contain only letters, numbers, or underscores.'
      )
      return
    }

    if (publicProfile && !cleanedUsername) {
      setError(
        'Choose a username before making your profile public.'
      )
      return
    }

    setSaving(true)

    try {
      await onSave({
        displayName: name.trim(),
        bio: about.trim(),
        username: cleanedUsername,
        isPublic: publicProfile,
        avatarFile,
      })

      onClose()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save your profile.'
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
        onClick={(event) =>
          event.stopPropagation()
        }
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
            Customize your profile and control
            how others discover you.
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
            Username

            <input
              type="text"
              value={usernameValue}
              onChange={(event) =>
                setUsernameValue(
                  event.target.value.toLowerCase()
                )
              }
              minLength={3}
              maxLength={24}
              pattern="[a-z0-9_]{3,24}"
              placeholder="your_username"
              autoComplete="off"
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

    
{/* =====================================================
    PROFILE VISIBILITY
    ===================================================== */}

<div className="profile-visibility-section">
  <label
    htmlFor="profile-public-checkbox"
    className="profile-visibility-label"
  >
    Make my profile public
  </label>

  <input
    id="profile-public-checkbox"
    type="checkbox"
    className="profile-public-checkbox"
    checked={publicProfile}
    onChange={(event) =>
      setPublicProfile(event.target.checked)
    }
  />

  <p className="profile-visibility-description">
    Your profile and collection will be visible
    to other MediaVault users.
  </p>
</div>


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
