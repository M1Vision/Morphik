'use client'

import React, { useState, useCallback } from 'react'
import { Search, FileText, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface SearchResult {
  id: string
  content: string
  score: number
  metadata?: Record<string, any>
}

interface MorphikSearchProps {
  className?: string
}

export function MorphikSearch({ className }: MorphikSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchType, setSearchType] = useState<'query' | 'chunks' | 'documents'>('query')

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const endpoint = `/api/morphik/${searchType}`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          limit: 10
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      if (data.success) {
        setResults(data.data?.results || data.data || [])
      } else {
        throw new Error(data.error || 'Search failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [query, searchType])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Morphik Semantic Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Type Selection */}
          <div className="flex gap-2">
            <Button
              variant={searchType === 'query' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchType('query')}
            >
              General Query
            </Button>
            <Button
              variant={searchType === 'chunks' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchType('chunks')}
            >
              Text Chunks
            </Button>
            <Button
              variant={searchType === 'documents' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchType('documents')}
            >
              Documents
            </Button>
          </div>

          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter your search query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Search Results ({results.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={result.id || index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        Score: {result.score?.toFixed(3) || 'N/A'}
                      </Badge>
                      {result.metadata?.source && (
                        <Badge variant="outline">
                          {result.metadata.source}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm leading-relaxed">
                      {result.content || JSON.stringify(result, null, 2)}
                    </p>
                  </div>

                  {result.metadata && Object.keys(result.metadata).length > 0 && (
                    <details className="text-xs text-gray-500">
                      <summary className="cursor-pointer hover:text-gray-700">
                        View metadata
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(result.metadata, null, 2)}
                      </pre>
                    </details>
                  )}

                  {index < results.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {!isLoading && query && results.length === 0 && !error && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No results found for &quot;{query}&quot;</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
