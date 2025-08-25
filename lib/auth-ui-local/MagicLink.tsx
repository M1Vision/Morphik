'use client'

import React, { useState } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'

interface MagicLinkProps {
  supabaseClient: SupabaseClient<any, any, any>
  setAuthView: React.Dispatch<React.SetStateAction<'sign_in' | 'sign_up' | 'forgotten_password' | 'magic_link' | 'update_password'>>
  showLinks?: boolean
  appearance?: any
  localization?: any
  redirectTo?: string
}

export function MagicLink({
  supabaseClient,
  setAuthView,
  showLinks = true,
  appearance,
  localization,
  redirectTo
}: MagicLinkProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Email is required')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo || `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for the magic link')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-widget">
      <form onSubmit={handleMagicLink} className="auth-form">
        <div className="auth-form-header">
          <h3 className="auth-form-title">Sign in with magic link</h3>
          <p className="auth-form-description">
            Enter your email address and we&apos;ll send you a magic link to sign in.
          </p>
        </div>

        {error && (
          <div className="auth-message auth-message-error">
            {error}
          </div>
        )}

        {message && (
          <div className="auth-message auth-message-success">
            {message}
          </div>
        )}

        <div className="auth-form-group">
          <label htmlFor="email" className="auth-label">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            placeholder="Enter your email"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="auth-button auth-button-primary"
        >
          {loading ? 'Sending...' : 'Send magic link'}
        </button>

        {showLinks && (
          <div className="auth-form-footer">
            <button
              type="button"
              onClick={() => setAuthView('sign_in')}
              className="auth-link"
            >
              Back to sign in
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
