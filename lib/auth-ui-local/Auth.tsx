'use client'

import React, { useEffect, useState } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { EmailAuth } from './EmailAuth'
import { SocialAuth } from './SocialAuth'
import { ForgottenPassword } from './ForgottenPassword'
import { MagicLink } from './MagicLink'
import { UpdatePassword } from './UpdatePassword'

type ViewType = 'sign_in' | 'sign_up' | 'forgotten_password' | 'magic_link' | 'update_password'
type SocialLayout = 'horizontal' | 'vertical'

export interface AuthProps {
  supabaseClient: SupabaseClient<any, any, any>
  view?: ViewType
  socialLayout?: SocialLayout
  providers?: string[]
  redirectTo?: string
  onlyThirdPartyProviders?: boolean
  magicLink?: boolean
  showLinks?: boolean
  appearance?: {
    theme?: any
    variables?: any
    className?: any
    style?: any
  }
  theme?: 'default' | 'dark' | 'light'
  localization?: {
    variables?: any
  }
  children?: React.ReactNode
}

export function Auth({
  supabaseClient,
  view = 'sign_in',
  socialLayout = 'vertical',
  providers = [],
  redirectTo,
  onlyThirdPartyProviders = false,
  magicLink = false,
  showLinks = true,
  appearance = { theme: ThemeSupa },
  theme = 'default',
  localization = { variables: {} },
  children
}: AuthProps) {
  const [authView, setAuthView] = useState<ViewType>(view)
  const [defaultEmail, setDefaultEmail] = useState('')
  const [defaultPassword, setDefaultPassword] = useState('')
  const [configError, setConfigError] = useState<string | null>(null)

  // Validate Supabase client on mount
  useEffect(() => {
    if (!supabaseClient) {
      setConfigError('Supabase client not provided')
      return
    }

    // Check if we have valid environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !key || url.includes('placeholder')) {
      setConfigError('Supabase environment variables not configured properly. Please check your .env.local file.')
      return
    }

    setConfigError(null)
  }, [supabaseClient])

  if (configError) {
    return (
      <div className="auth-container">
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-bold">Configuration Error</h3>
          <p>{configError}</p>
          <p className="mt-2 text-sm">
            Please ensure your .env.local file contains valid NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY values.
          </p>
        </div>
      </div>
    )
  }

  // Apply theme styling
  useEffect(() => {
    // Apply CSS custom properties based on theme
    const root = document.documentElement
    const themeColors = appearance.theme?.[theme]?.colors || {}
    
    Object.entries(themeColors).forEach(([key, value]) => {
      root.style.setProperty(`--auth-${key}`, value as string)
    })
  }, [appearance, theme])

  const commonProps = {
    supabaseClient,
    setAuthView,
    defaultEmail,
    defaultPassword,
    setDefaultEmail,
    setDefaultPassword,
    redirectTo,
    showLinks,
    appearance,
    localization
  }

  const renderAuthView = () => {
    switch (authView) {
      case 'sign_in':
        return (
          <EmailAuth
            {...commonProps}
            authView="sign_in"
            magicLink={magicLink}
          />
        )
      case 'sign_up':
        return (
          <EmailAuth
            {...commonProps}
            authView="sign_up"
            magicLink={magicLink}
          />
        )
      case 'forgotten_password':
        return <ForgottenPassword {...commonProps} />
      case 'magic_link':
        return <MagicLink {...commonProps} />
      case 'update_password':
        return <UpdatePassword {...commonProps} />
      default:
        return (
          <EmailAuth
            {...commonProps}
            authView="sign_in"
            magicLink={magicLink}
          />
        )
    }
  }

  return (
    <div className="auth-container">
      {/* Social providers */}
      {providers && providers.length > 0 && (
        <SocialAuth
          supabaseClient={supabaseClient}
          providers={providers}
          socialLayout={socialLayout}
          redirectTo={redirectTo}
          onlyThirdPartyProviders={onlyThirdPartyProviders}
          appearance={appearance}
        />
      )}
      
      {/* Divider */}
      {providers && providers.length > 0 && !onlyThirdPartyProviders && (
        <div className="auth-divider">
          <div className="auth-divider-line" />
          <span className="auth-divider-text">or</span>
          <div className="auth-divider-line" />
        </div>
      )}
      
      {/* Email/Password auth */}
      {!onlyThirdPartyProviders && renderAuthView()}
      
      {children}
    </div>
  )
}
