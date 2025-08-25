'use client'

import { useAuth } from "@/lib/context/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/login') {
        // Redirect to login if not authenticated and not already on login page
        router.push('/login')
      } else if (user && pathname === '/login') {
        // Redirect to main app if authenticated and on login page
        router.push('/')
      }
    }
  }, [user, loading, pathname, router])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show nothing while redirecting
  if ((!user && pathname !== '/login') || (user && pathname === '/login')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show the main application if authenticated or login page if not authenticated
  return <>{children}</>
}
