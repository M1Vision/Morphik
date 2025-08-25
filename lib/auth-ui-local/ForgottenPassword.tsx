'use client'

import React, { useState } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'

interface ForgottenPasswordProps {
  supabaseClient: SupabaseClient<any, any, any>
  setAuthView: React.Dispatch<React.SetStateAction<'sign_in' | 'sign_up' | 'forgotten_password' | 'magic_link' | 'update_password'>>
  showLinks?: boolean
  appearance?: any
  localization?: any
  redirectTo?: string
}

export function ForgottenPassword({
  supabaseClient,
  setAuthView,
  showLinks = true,
  appearance,
  localization
}: ForgottenPasswordProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Email is required')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for the password reset link')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-widget">
      <form onSubmit={handleResetPassword} className="auth-form">
        <div className="auth-form-header">
          <h3 className="auth-form-title">Reset your password</h3>
          <p className="auth-form-description">
            Enter your email address and we&apos;ll send you a link to reset your password.
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
          {loading ? 'Sending...' : 'Send reset email'}
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
