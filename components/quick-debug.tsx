'use client'

import { useState } from 'react'

export function QuickDebug() {
  const [result, setResult] = useState('')

  const testSupabase = async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    setResult(`Testing: ${url}`)
    
    try {
      const response = await fetch(`${url}/rest/v1/`, {
        method: 'HEAD',
        headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' }
      })
      setResult(`✅ Success: ${response.status} - ${url}`)
    } catch (error: any) {
      setResult(`❌ Failed: ${error.message} - ${url}`)
    }
  }

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed top-4 right-4 bg-red-900 text-white p-2 text-xs rounded z-50">
      <button onClick={testSupabase} className="bg-red-700 px-2 py-1 rounded mb-1">
        Test URL
      </button>
      <div className="max-w-xs break-all">{result}</div>
    </div>
  )
}




