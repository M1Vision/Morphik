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
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Sign in with magic link</h3>
        <p className="text-sm text-gray-600 mt-2">
          Enter your email address and we&apos;ll send you a magic link to sign in.
        </p>
      </div>

      <form onSubmit={handleMagicLink} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send magic link'}
        </button>

        {showLinks && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setAuthView('sign_in')}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Back to sign in
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
