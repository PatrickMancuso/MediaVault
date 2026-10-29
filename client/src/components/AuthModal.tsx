
import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { supabase } from '../lib/supabase'

interface AuthModalProps {
  onClose: () => void
}

type AuthMode = 'signin' | 'signup' | 'reset'

function AuthModal({
  onClose,
}: AuthModalProps) {
  const [mode, setMode] =
    useState<AuthMode>('signin')

  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState('')

  const [message, setMessage] =
    useState('')

  /* =====================================================
     REQUEST PASSWORD RESET
     ===================================================== */

  const handlePasswordReset = async () => {
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo:
              `${window.location.origin}/reset-password`,
          }
        )

      if (resetError) {
        throw resetError
      }

      setMessage(
        'If an account exists for this email, a password reset link will be sent. Please check your inbox.'
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to send password reset email.'
      )
    } finally {
      setLoading(false)
    }
  }

  /* =====================================================
     SIGN IN / SIGN UP / RESET
     ===================================================== */

  const handleSubmit = async (
    event: SubmitEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (mode === 'reset') {
      await handlePasswordReset()
      return
    }

    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (mode === 'signin') {
        const {
          error: signInError,
        } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          throw signInError
        }

        onClose()
        return
      }

      const {
        data,
        error: signUpError,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            window.location.origin,
        },
      })

      if (signUpError) {
        throw signUpError
      }

      if (data.user && !data.session) {
        setMessage(
          'Account created. Check your email to verify your account.'
        )
      } else {
        setMessage(
          'Account created successfully.'
        )
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong.'
      )
    } finally {
      setLoading(false)
    }
  }

  /* =====================================================
     SWITCH AUTHENTICATION MODE
     ===================================================== */

  const changeMode = (newMode: AuthMode) => {
    setMode(newMode)
    setError('')
    setMessage('')
  }

  /* =====================================================
     MODAL
     ===================================================== */

  return (
    <div
      className="auth-backdrop"
      onClick={onClose}
    >
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-label="MediaVault account"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          className="auth-close"
          onClick={onClose}
          aria-label="Close account dialog"
        >
          ×
        </button>

        {/* HEADER */}

        <div className="auth-header">
          <p className="auth-eyebrow">
            MEDIA LIBRARY
          </p>

          <h2>
            {mode === 'signin'
              ? 'Sign In'
              : mode === 'signup'
                ? 'Create Account'
                : 'Reset Password'}
          </h2>

          <p>
            {mode === 'signin'
              ? 'Sign in to access your collection.'
              : mode === 'signup'
                ? 'Create an account to keep your collection across devices.'
                : 'Enter your email address and we will send you a password reset link.'}
          </p>
        </div>

        {/* FORM */}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
              autoComplete="email"
            />
          </label>

          {/* PASSWORD - HIDDEN DURING RESET */}

          {mode !== 'reset' && (
            <label>
              Password

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
                minLength={6}
                autoComplete={
                  mode === 'signin'
                    ? 'current-password'
                    : 'new-password'
                }
              />
            </label>
          )}

          {/* ERROR MESSAGE */}

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          {/* SUCCESS MESSAGE */}

          {message && (
            <p className="auth-message" role="status">
              {message}
            </p>
          )}

          {/* SUBMIT BUTTON */}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : mode === 'signin'
                ? 'Sign In'
                : mode === 'signup'
                  ? 'Create Account'
                  : 'Send Reset Link'}
          </button>
        </form>


  
{/* FORGOT PASSWORD */}

{mode === 'signin' && (
  <div className="auth-forgot">
    <button
      type="button"
      className="auth-forgot-password"
      onClick={() => changeMode('reset')}
    >
      Forgot Password?
    </button>
  </div>
)}


        {/* SWITCH BETWEEN MODES */}

        <div className="auth-switch">
          {mode === 'reset' ? (
            <button
              type="button"
              onClick={() =>
                changeMode('signin')
              }
            >
              ← Back to Sign In
            </button>
          ) : (
            <>
              {mode === 'signin'
                ? 'Need an account?'
                : 'Already have an account?'}

              <button
                type="button"
                onClick={() =>
                  changeMode(
                    mode === 'signin'
                      ? 'signup'
                      : 'signin'
                  )
                }
              >
                {mode === 'signin'
                  ? 'Create Account'
                  : 'Sign In'}
              </button>
            </>
          )}
        </div>

      </section>
    </div>
  )
}

export default AuthModal
