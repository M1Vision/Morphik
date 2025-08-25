'use client'

import React, { useState } from 'react'
import { Image as ImageIcon, ZoomIn, Download, FileText, Eye, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

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
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleImageClick = (image: ImageResult) => {
    setSelectedImage(image)
    setIsDialogOpen(true)
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
            <Card 
              key={image.id || index} 
              className="overflow-hidden cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] group"
              onClick={() => handleImageClick(image)}
            >
              <div className={`relative ${compact ? 'aspect-square' : 'aspect-[4/3]'}`}>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={image.metadata?.filename || 'Morphik image'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : null}
                
                {/* Fallback for broken images */}
                <div className={`${imageUrl ? 'hidden' : ''} w-full h-full flex items-center justify-center bg-gray-100`}>
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn className="h-6 w-6 text-white" />
                </div>
                
                {/* Score Badge */}
                {image.score && (
                  <Badge 
                    variant="secondary" 
                    className="absolute top-1 right-1 text-xs"
                  >
                    {(image.score * 100).toFixed(0)}%
                  </Badge>
                )}
              </div>
              
              {!compact && (
                <CardContent className="p-2">
                  <p className="text-xs font-medium truncate">
                    {image.metadata?.filename || 'Untitled'}
                  </p>
                  {image.metadata?.width && image.metadata?.height && (
                    <p className="text-xs text-gray-500">
                      {image.metadata.width}×{image.metadata.height}
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Show more indicator */}
      {hasMore && (
        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            +{images.length - maxImages} more images
          </Badge>
        </div>
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
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => window.open(getImageUrl(selectedImage), '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = getImageUrl(selectedImage)
                        link.download = selectedImage.metadata?.filename || 'image'
                        link.click()
                      }}
                    >
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
