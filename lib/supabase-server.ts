import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from './db/types'

// Server-side Supabase client (for server components and API routes)
export const createSupabaseServerClient = () => {
  return createServerComponentClient<Database>({ cookies })
}




