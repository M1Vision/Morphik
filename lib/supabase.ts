import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './db/types'

// Client-side Supabase client for use in components
export const createSupabaseClient = () => {
  return createClientComponentClient<Database>()
}

// Browser client for client-side operations - only create when environment variables are available
export const createBrowserSupabaseClient = () => {
  // Check if we're in the browser and have the required environment variables
  if (typeof window === 'undefined') {
    throw new Error('createBrowserSupabaseClient can only be used in the browser')
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables. Please check your environment configuration.')
  }

  return createClient<Database>(url, key)
}

