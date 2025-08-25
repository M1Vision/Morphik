'use client'

import React, { useState } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'

interface UpdatePasswordProps {
  supabaseClient: SupabaseClient
  setAuthView: (view: string) => void
  showLinks?: boolean
  appearance?: any
  localization?: any
}

export function UpdatePassword({
  supabaseClient,
  setAuthView,
  showLinks = true,
  appearance,
  localization
}: UpdatePasswordProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password) {
      setError('Password is required')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Password updated successfully')
        // Redirect to sign in after successful password update
        setTimeout(() => {
          setAuthView('sign_in')
        }, 2000)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-widget">
      <form onSubmit={handleUpdatePassword} className="auth-form">
        <div className="auth-form-header">
          <h3 className="auth-form-title">Update your password</h3>
          <p className="auth-form-description">
            Enter your new password below.
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
          <label htmlFor="password" className="auth-label">
            New Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            placeholder="Enter new password"
          />
        </div>

        <div className="auth-form-group">
          <label htmlFor="confirmPassword" className="auth-label">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="auth-input"
            placeholder="Confirm new password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="auth-button auth-button-primary"
        >
          {loading ? 'Updating...' : 'Update password'}
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
