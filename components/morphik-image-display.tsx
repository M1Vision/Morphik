'use client'

import React from 'react'

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

interface MorphikImageDisplayProps {
  images: ImageResult[]
  className?: string
  compact?: boolean
  maxImages?: number
}

export function MorphikImageDisplay({ 
  images, 
  className, 
  compact = false,
  maxImages = 6
}: MorphikImageDisplayProps) {
  const displayImages = images.slice(0, maxImages)
  const hasMore = images.length > maxImages

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

  if (images.length === 0) return null

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Images Grid */}
      <div className={`grid gap-3 ${
        compact 
          ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6' 
          : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
      }`}>
        {displayImages.map((image, index) => {
          const imageUrl = getImageUrl(image)
          
          return (
            <div 
              key={image.id || index} 
              className="overflow-hidden border rounded-lg bg-white"
            >
              <div className={`relative ${compact ? 'aspect-square' : 'aspect-[4/3]'}`}>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={image.metadata?.filename || 'Morphik image'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-gray-400 text-xs">No Image</span>
                  </div>
                )}
                
                {/* Score Badge */}
                {image.score && (
                  <span className="absolute top-1 right-1 text-xs bg-gray-200 px-2 py-1 rounded-full">
                    {(image.score * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              
              {!compact && (
                <div className="p-2">
                  <p className="text-xs font-medium truncate">
                    {image.metadata?.filename || 'Untitled'}
                  </p>
                  {image.metadata?.width && image.metadata?.height && (
                    <p className="text-xs text-gray-500">
                      {image.metadata.width}×{image.metadata.height}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Show more indicator */}
      {hasMore && (
        <div className="text-center">
          <span className="text-xs border px-2 py-1 rounded-full bg-gray-50">
            +{images.length - maxImages} more images
          </span>
        </div>
      )}
    </div>
  )
}
