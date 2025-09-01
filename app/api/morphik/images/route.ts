import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'

interface MorphikResponse {
  success: boolean
  data?: any
  error?: string
  timestamp: string
}

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

// Reuse the same MCP client pattern
class MorphikMCPClient {
  private static instance: MorphikMCPClient
  private mcpProcess: any = null
  private isConnected = false
  private responseHandlers = new Map()
  private requestId = 0

  static getInstance(): MorphikMCPClient {
    if (!MorphikMCPClient.instance) {
      MorphikMCPClient.instance = new MorphikMCPClient()
    }
    return MorphikMCPClient.instance
  }

  async ensureConnection(): Promise<void> {
    if (this.isConnected && this.mcpProcess) {
      return
    }

    return new Promise((resolve, reject) => {
      try {
        this.mcpProcess = spawn('npx', ['@morphik/mcp', '--uri=local'], {
          stdio: ['pipe', 'pipe', 'pipe']
        })

        let startupBuffer = ''

        this.mcpProcess.stdout.on('data', (data: Buffer) => {
          const text = data.toString()
          startupBuffer += text

          if (text.includes('Morphik MCP Server running on stdio')) {
            this.isConnected = true
            resolve()
          }

          this.parseJSONRPC(text)
        })

        this.mcpProcess.stderr.on('data', (data: Buffer) => {
          console.error('MCP Error:', data.toString())
        })

        this.mcpProcess.on('error', (error: Error) => {
          reject(error)
        })

        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('MCP connection timeout'))
          }
        }, 10000)
      } catch (error) {
        reject(error)
      }
    })
  }

  parseJSONRPC(text: string) {
    const lines = text.split('\n').filter(line => line.trim())
    
    for (const line of lines) {
      try {
        const message = JSON.parse(line)
        if (message.id && this.responseHandlers.has(message.id)) {
          const handler = this.responseHandlers.get(message.id)
          this.responseHandlers.delete(message.id)
          
          if (message.error) {
            handler.reject(new Error(message.error.message || 'MCP Error'))
          } else {
            handler.resolve(message.result)
          }
        }
      } catch (e) {
        // Ignore non-JSON lines
      }
    }
  }

  async sendRequest(method: string, params: any = {}): Promise<any> {
    await this.ensureConnection()

    return new Promise((resolve, reject) => {
      const id = ++this.requestId
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params
      }

      this.responseHandlers.set(id, { resolve, reject })
      this.mcpProcess.stdin.write(JSON.stringify(request) + '\n')

      setTimeout(() => {
        if (this.responseHandlers.has(id)) {
          this.responseHandlers.delete(id)
          reject(new Error('Request timeout'))
        }
      }, 30000)
    })
  }
}

// POST /api/morphik/images - Search for images
export async function POST(request: NextRequest): Promise<NextResponse<MorphikResponse>> {
  try {
    const body = await request.json()
    const { query, limit = 10, include_text = true } = body

    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Query is required',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    const mcpClient = MorphikMCPClient.getInstance()
    
    // First, try to search for images specifically
    let results: any[] = []
    
    try {
      // Try image-specific search first
      const imageResults = await mcpClient.sendRequest('retrieve-images', {
        query,
        limit,
        include_text
      })
      results = imageResults || []
    } catch (error) {
      console.log('Image-specific search not available, using general search')
      
      // Fallback to general search and filter for images
      const generalResults = await mcpClient.sendRequest('retrieve-chunks', {
        query,
        limit: limit * 2 // Get more results to filter
      })
      
      // Filter results that contain image metadata
      results = (generalResults || []).filter((result: any) => 
        result.metadata && (
          result.metadata.mime_type?.startsWith('image/') ||
          result.metadata.filename?.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i) ||
          result.metadata.type === 'image'
        )
      ).slice(0, limit)
    }

    // Process results to ensure proper image URLs
    const processedResults: ImageResult[] = results.map((result: any) => ({
      ...result,
      metadata: {
        ...result.metadata,
        // Ensure image URL is properly formatted
        image_url: result.metadata?.image_url || result.metadata?.path || result.metadata?.filename,
        thumbnail_url: result.metadata?.thumbnail_url || result.metadata?.image_url || result.metadata?.path,
        // Extract dimensions if available
        width: result.metadata?.width || result.metadata?.image_width,
        height: result.metadata?.height || result.metadata?.image_height,
        // Include extracted text from image processing
        extracted_text: result.metadata?.extracted_text || result.metadata?.ocr_text || result.content
      }
    }))

    return NextResponse.json({
      success: true,
      data: {
        images: processedResults,
        total: processedResults.length,
        query,
        has_more: processedResults.length === limit
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Morphik image search error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET /api/morphik/images - List all available images
export async function GET(request: NextRequest): Promise<NextResponse<MorphikResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const mcpClient = MorphikMCPClient.getInstance()
    
    try {
      // Try to get images specifically
      const result = await mcpClient.sendRequest('list-images', {
        limit,
        offset
      })

      return NextResponse.json({
        success: true,
        data: {
          images: result?.images || [],
          total: result?.total || 0,
          offset,
          limit
        },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.log('Image listing not available, using document search')
      
      // Fallback: Get all documents and filter for images
      const documents = await mcpClient.sendRequest('list-documents')
      
      const imageDocuments = (documents || []).filter((doc: any) => 
        doc.metadata && (
          doc.metadata.mime_type?.startsWith('image/') ||
          doc.metadata.filename?.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i) ||
          doc.metadata.type === 'image'
        )
      )

      const paginatedResults = imageDocuments.slice(offset, offset + limit)

      return NextResponse.json({
        success: true,
        data: {
          images: paginatedResults,
          total: imageDocuments.length,
          offset,
          limit
        },
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('List images error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}



