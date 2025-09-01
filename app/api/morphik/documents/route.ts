import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'

interface MorphikResponse {
  success: boolean
  data?: any
  error?: string
  timestamp: string
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

// GET /api/morphik/documents - List all documents
export async function GET(request: NextRequest): Promise<NextResponse<MorphikResponse>> {
  try {
    const mcpClient = MorphikMCPClient.getInstance()
    const result = await mcpClient.sendRequest('list-documents')

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('List documents error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// POST /api/morphik/documents - Retrieve specific documents
export async function POST(request: NextRequest): Promise<NextResponse<MorphikResponse>> {
  try {
    const body = await request.json()
    const { query, limit = 5 } = body

    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Query is required',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    const mcpClient = MorphikMCPClient.getInstance()
    const result = await mcpClient.sendRequest('retrieve-docs', {
      query,
      limit
    })

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Retrieve documents error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}



