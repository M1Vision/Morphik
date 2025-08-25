import { useState, useEffect, useCallback } from 'react'

interface MorphikConfig {
  apiUrl?: string
  apiKey?: string
  enabled?: boolean
}

interface SearchResult {
  id: string
  content: string
  score: number
  metadata?: Record<string, any>
}

interface MorphikResponse {
  results: SearchResult[]
  total: number
  query: string
}

interface UseMorphikReturn {
  search: (query: string, options?: SearchOptions) => Promise<MorphikResponse>
  isLoading: boolean
  error: string | null
  isConnected: boolean
  connect: () => void
  disconnect: () => void
}

interface SearchOptions {
  limit?: number
  threshold?: number
  includeMetadata?: boolean
}

export function useMorphik(config?: MorphikConfig): UseMorphikReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [eventSource, setEventSource] = useState<EventSource | null>(null)

  // Get configuration from environment or props
  const apiUrl = config?.apiUrl || process.env.NEXT_PUBLIC_MORPHIK_API_URL
  const apiKey = config?.apiKey || process.env.MORPHIK_API_KEY
  const enabled = config?.enabled ?? process.env.NEXT_PUBLIC_MORPHIK_ENABLED === 'true'

  // Validate configuration
  const isConfigured = Boolean(apiUrl && apiKey && enabled)

  const search = useCallback(async (
    query: string, 
    options: SearchOptions = {}
  ): Promise<MorphikResponse> => {
    if (!isConfigured) {
      throw new Error('Morphik is not properly configured. Check your environment variables.')
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${apiUrl}/api/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          limit: options.limit || 10,
          threshold: options.threshold || 0.5,
          include_metadata: options.includeMetadata || true,
        }),
      })

      if (!response.ok) {
        throw new Error(`Morphik API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        results: data.results || [],
        total: data.total || 0,
        query: data.query || query,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [apiUrl, apiKey, isConfigured])

  const connect = useCallback(() => {
    if (!isConfigured) {
      setError('Morphik is not properly configured')
      return
    }

    if (eventSource) {
      return // Already connected
    }

    try {
      const es = new EventSource(`${apiUrl}/events?token=${apiKey}`)
      
      es.onopen = () => {
        setIsConnected(true)
        setError(null)
        console.log('Connected to Morphik SSE')
      }

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          // Handle real-time updates here
          console.log('Morphik update:', data)
        } catch (err) {
          console.error('Error parsing SSE data:', err)
        }
      }

      es.onerror = (event) => {
        console.error('Morphik SSE error:', event)
        setError('Connection to Morphik lost')
        setIsConnected(false)
      }

      setEventSource(es)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Morphik')
    }
  }, [apiUrl, apiKey, isConfigured, eventSource])

  const disconnect = useCallback(() => {
    if (eventSource) {
      eventSource.close()
      setEventSource(null)
      setIsConnected(false)
      console.log('Disconnected from Morphik SSE')
    }
  }, [eventSource])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  // Set initial error if not configured
  useEffect(() => {
    if (!isConfigured) {
      setError('Morphik is not configured. Please set NEXT_PUBLIC_MORPHIK_API_URL and MORPHIK_API_KEY environment variables.')
    } else {
      setError(null)
    }
  }, [isConfigured])

  return {
    search,
    isLoading,
    error,
    isConnected,
    connect,
    disconnect,
  }
}

// Export types for use in components
export type { MorphikConfig, SearchResult, MorphikResponse, SearchOptions }
