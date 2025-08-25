import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - this ensures the session is valid
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Handle authentication redirects server-side for better UX
  if (!session && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (session && req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/callback (auth callback)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback).*)',
  ]
}

