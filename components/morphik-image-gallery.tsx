'use client'

import React, { useState, useCallback } from 'react'
import { Search, Image as ImageIcon, Loader2, AlertCircle, ZoomIn, Download, FileText, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ImageResult {
  id: string
  content: string
  score: number
  metadata?: {
    filename?: string
    path?: string
    mime_type?: string
    size?: number
    width?: number
    height?: number
    source?: string
    extracted_text?: string
    image_url?: string
    thumbnail_url?: string
  }
}

interface MorphikImageGalleryProps {
  className?: string
  maxImages?: number
  onImageSelect?: (image: ImageResult) => void
}

export function MorphikImageGallery({ 
  className, 
  maxImages = 12,
  onImageSelect 
}: MorphikImageGalleryProps) {
  const [query, setQuery] = useState('')
  const [images, setImages] = useState<ImageResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      // If no query, load recent images
      await loadRecentImages()
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/morphik/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          limit: maxImages,
          include_text: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Image search failed')
      }

      if (data.success) {
        setImages(data.data?.images || [])
      } else {
        throw new Error(data.error || 'Image search failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setImages([])
    } finally {
      setIsLoading(false)
    }
  }, [query, maxImages])

  const loadRecentImages = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/morphik/images?limit=${maxImages}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load images')
      }

      if (data.success) {
        setImages(data.data?.images || [])
      } else {
        throw new Error(data.error || 'Failed to load images')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setImages([])
    } finally {
      setIsLoading(false)
    }
  }, [maxImages])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleImageClick = (image: ImageResult) => {
    setSelectedImage(image)
    setIsDialogOpen(true)
    onImageSelect?.(image)
  }

  const getImageUrl = (image: ImageResult): string => {
    // Try different URL sources
    if (image.metadata?.image_url) {
      return image.metadata.image_url
    }
    if (image.metadata?.thumbnail_url) {
      return image.metadata.thumbnail_url
    }
    if (image.metadata?.path) {
      return image.metadata.path
    }
    if (image.metadata?.filename) {
      return `/api/morphik/files/${encodeURIComponent(image.metadata.filename)}`
    }
    return ''
  }

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Load recent images on mount
  React.useEffect(() => {
    loadRecentImages()
  }, [loadRecentImages])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Morphik Image Gallery
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search images by content, description, or filename..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={loadRecentImages} 
              disabled={isLoading}
            >
              Recent
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

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => {
            const imageUrl = getImageUrl(image)
            
            return (
              <Card 
                key={image.id || index} 
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleImageClick(image)}
              >
                <div className="aspect-square relative">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={image.metadata?.filename || 'Morphik image'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback for broken images */}
                  <div className={`${imageUrl ? 'hidden' : ''} w-full h-full flex items-center justify-center bg-gray-100`}>
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  
                  {/* Score Badge */}
                  {image.score && (
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 right-2"
                    >
                      {(image.score * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
                
                <CardContent className="p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium truncate">
                      {image.metadata?.filename || 'Untitled'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {image.metadata?.width && image.metadata?.height && (
                        <span>{image.metadata.width}×{image.metadata.height}</span>
                      )}
                      {image.metadata?.size && (
                        <span>{formatFileSize(image.metadata.size)}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* No Results */}
      {!isLoading && images.length === 0 && !error && (
        <Card>
          <CardContent className="text-center py-8">
            <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">
              {query ? `No images found for "${query}"` : 'No images available'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Image Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  {selectedImage.metadata?.filename || 'Image Details'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                {/* Image Display */}
                <div className="space-y-4">
                  <div className="relative aspect-square border rounded-lg overflow-hidden">
                    {getImageUrl(selectedImage) ? (
                      <img
                        src={getImageUrl(selectedImage)}
                        alt={selectedImage.metadata?.filename || 'Morphik image'}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <ImageIcon className="h-24 w-24 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <ZoomIn className="h-4 w-4 mr-2" />
                      View Full Size
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                
                {/* Image Metadata */}
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Image Information
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {selectedImage.metadata?.filename && (
                          <>
                            <span className="text-gray-500">Filename:</span>
                            <span>{selectedImage.metadata.filename}</span>
                          </>
                        )}
                        {selectedImage.metadata?.mime_type && (
                          <>
                            <span className="text-gray-500">Type:</span>
                            <span>{selectedImage.metadata.mime_type}</span>
                          </>
                        )}
                        {selectedImage.metadata?.width && selectedImage.metadata?.height && (
                          <>
                            <span className="text-gray-500">Dimensions:</span>
                            <span>{selectedImage.metadata.width} × {selectedImage.metadata.height}</span>
                          </>
                        )}
                        {selectedImage.metadata?.size && (
                          <>
                            <span className="text-gray-500">Size:</span>
                            <span>{formatFileSize(selectedImage.metadata.size)}</span>
                          </>
                        )}
                        {selectedImage.score && (
                          <>
                            <span className="text-gray-500">Relevance:</span>
                            <span>{(selectedImage.score * 100).toFixed(1)}%</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Extracted Text */}
                    {selectedImage.metadata?.extracted_text && (
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Extracted Text
                        </h4>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">
                          {selectedImage.metadata.extracted_text}
                        </div>
                      </div>
                    )}
                    
                    {/* Content Description */}
                    {selectedImage.content && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Content Description</h4>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">
                          {selectedImage.content}
                        </div>
                      </div>
                    )}
                    
                    {/* Raw Metadata */}
                    {selectedImage.metadata && Object.keys(selectedImage.metadata).length > 0 && (
                      <details className="space-y-2">
                        <summary className="font-medium cursor-pointer">
                          Raw Metadata
                        </summary>
                        <pre className="p-3 bg-gray-50 rounded-md text-xs overflow-auto">
                          {JSON.stringify(selectedImage.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
