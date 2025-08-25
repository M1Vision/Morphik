import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './db/types'

// Client-side Supabase client for use in components
export const createSupabaseClient = () => {
  return createClientComponentClient<Database>()
}

// Get environment variables with validation
const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
  }

  return { url, key }
}

// Browser client for client-side operations
export const supabase = (() => {
  try {
    const { url, key } = getSupabaseConfig()
    return createClient<Database>(url, key)
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    // Return a mock client to prevent crashes during development
    return createClient('https://placeholder.supabase.co', 'placeholder-key')
  }
})()

