'use client'

import { useAuth } from '@/lib/context/auth-context'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Auth } from '@/lib/auth-ui-local'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createSupabaseClient } from '@/lib/supabase'
import { QuickDebug } from '@/components/quick-debug'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const { theme } = useTheme()
  const [resolvedTheme, setResolvedTheme] = useState<string | undefined>(undefined)
  const router = useRouter()
  const supabase = createSupabaseClient()

  useEffect(() => {
    setResolvedTheme(theme)
  }, [theme])

  // Redirect to main app if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (user) {
    // Will redirect via useEffect, show loading in the meantime
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-lg space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Semantic Search
            </h1>
            <p className="text-xl text-muted-foreground">
              AI-powered search interface
            </p>
            <p className="text-sm text-muted-foreground/80">
              Sign in to access your intelligent search dashboard
            </p>
          </div>
          
          {/* Login Card */}
          <div className="bg-card/50 backdrop-blur-sm p-8 rounded-xl border shadow-2xl">
            {resolvedTheme !== undefined && (
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: 'hsl(var(--primary))',
                        brandAccent: 'hsl(var(--primary))',
                      },
                    },
                  },
                }}
                theme={resolvedTheme === "dark" || resolvedTheme === "black" || resolvedTheme === "sunset" || resolvedTheme === "ocean" ? "dark" : "default"}
                providers={['google', 'github']}
                redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
                onlyThirdPartyProviders={false}
                showLinks={true}
                view="sign_in"
                magicLink={true}
              />
            )}
          </div>
          
          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground/70">
            <p>
              By signing in, you agree to our{' '}
              <a href="/terms" className="underline hover:text-foreground transition-colors">
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="/privacy" className="underline hover:text-foreground transition-colors">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
      <QuickDebug />
    </div>
  )
}
