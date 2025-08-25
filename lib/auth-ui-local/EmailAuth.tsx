'use client'

import React, { useState } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface EmailAuthProps {
  supabaseClient: SupabaseClient<any, any, any>
  authView: 'sign_in' | 'sign_up'
  setAuthView: React.Dispatch<React.SetStateAction<'sign_in' | 'sign_up' | 'forgotten_password' | 'magic_link' | 'update_password'>>
  defaultEmail: string
  defaultPassword: string
  setDefaultEmail: (email: string) => void
  setDefaultPassword: (password: string) => void
  redirectTo?: string
  showLinks: boolean
  magicLink?: boolean
  appearance?: any
  localization?: any
}

export function EmailAuth({
  supabaseClient,
  authView,
  setAuthView,
  defaultEmail,
  defaultPassword,
  setDefaultEmail,
  setDefaultPassword,
  redirectTo,
  showLinks,
  magicLink,
  appearance,
  localization
}: EmailAuthProps) {
  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState(defaultPassword)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (authView === 'sign_up') {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
          },
        })
        
        if (error) throw error
        
        if (data.user && !data.session) {
          setMessage('Account created! Check your email for the confirmation link.')
        } else if (data.session) {
          setMessage('Account created and signed in successfully!')
          // Force a page refresh to update auth state
          setTimeout(() => window.location.reload(), 1000)
        }
      } else {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        
        if (data.session) {
          setMessage('Sign in successful!')
          // Force a page refresh to update auth state
          setTimeout(() => window.location.reload(), 1000)
        }
      }
    } catch (error: any) {
      // Clean error handling
      if (error.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.')
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Please check your email and click the confirmation link before signing in.')
      } else if (error.message?.includes('fetch')) {
        setError('Network error: Unable to connect to authentication service.')
      } else {
        setError(error.message || 'Authentication failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      })
      
      if (error) throw error
      setMessage('Check your email for the magic link!')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-email-container">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
            disabled={loading}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Loading...' : authView === 'sign_up' ? 'Sign Up' : 'Sign In'}
        </Button>

        {magicLink && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleMagicLink}
            disabled={loading}
          >
            Send Magic Link
          </Button>
        )}
      </form>

      {message && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {showLinks && (
        <div className="mt-4 text-center space-y-2">
          {authView === 'sign_in' ? (
            <>
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={() => setAuthView('sign_up')}
              >
                Don&apos;t have an account? Sign up
              </button>
              <br />
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={() => setAuthView('forgotten_password')}
              >
                Forgot your password?
              </button>
            </>
          ) : (
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline"
              onClick={() => setAuthView('sign_in')}
            >
              Already have an account? Sign in
            </button>
          )}
        </div>
      )}
    </div>
  )
}
