import { NextRequest, NextResponse } from 'next/server'

interface MCPRequest {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: any
}

interface MCPResponse {
  jsonrpc: '2.0'
  id: string | number
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

interface MCPTool {
  name: string
  description: string
  inputSchema: any
}

// MCP Server Capabilities
const SERVER_INFO = {
  name: 'sica-morphik-mcp',
  version: '1.0.0',
  description: 'Sica Frontend MCP Server with Morphik integration',
  capabilities: {
    tools: {
      listChanged: false
    }
  }
}

// Available MCP Tools
const TOOLS: MCPTool[] = [
  {
    name: 'morphik_search',
    description: 'Search through Morphik knowledge base using semantic similarity',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to find relevant content'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 10
        }
      },
      required: ['query']
    }
  },
  {
    name: 'morphik_list_documents',
    description: 'List all available documents in the Morphik knowledge base',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'morphik_retrieve_chunks',
    description: 'Retrieve relevant text chunks from Morphik knowledge base',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The query to find relevant chunks'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of chunks to return',
          default: 5
        }
      },
      required: ['query']
    }
  },
  {
    name: 'morphik_retrieve_visual',
    description: 'Search for visual content (images, PDFs with images) using ColPali visual understanding model',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to find relevant visual content'
        },
        k: {
          type: 'number',
          description: 'Number of results to return',
          default: 8
        },
        useColpali: {
          type: 'boolean',
          description: 'Use ColPali visual embedding model (always true for this tool)',
          default: true
        },
        padding: {
          type: 'number',
          description: 'Additional chunks/pages around matches for context',
          default: 1
        },
        minScore: {
          type: 'number',
          description: 'Minimum relevance score',
          default: 0
        }
      },
      required: ['query']
    }
  },
  {
    name: 'morphik_ingest_file',
    description: 'Add image or document files to Morphik knowledge base with visual understanding',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file to ingest'
        },
        useColpali: {
          type: 'boolean',
          description: 'Use ColPali for visual understanding (recommended for images)',
          default: true
        },
        metadata: {
          type: 'object',
          description: 'Optional metadata to associate with the file'
        },
        folderName: {
          type: 'string',
          description: 'Optional folder to organize the document'
        }
      },
      required: ['path']
    }
  }
]

// Authentication middleware
function authenticateRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.MCP_AUTH_TOKEN

  // If no token is configured, allow all requests (dev mode)
  if (!expectedToken) {
    console.warn('MCP_AUTH_TOKEN not configured, allowing all requests')
    return true
  }

  if (!authHeader) {
    return false
  }

  const token = authHeader.replace('Bearer ', '')
  return token === expectedToken
}

// Tool execution handlers
async function executeTool(name: string, params: any): Promise<any> {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000'

  switch (name) {
    case 'morphik_search':
      const searchResponse = await fetch(`${baseUrl}/api/morphik/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: params.query,
          limit: params.limit || 10
        })
      })
      const searchData = await searchResponse.json()
      if (!searchData.success) {
        throw new Error(searchData.error || 'Search failed')
      }
      return {
        results: searchData.data?.results || [],
        total: searchData.data?.total || 0,
        query: params.query,
        timestamp: searchData.timestamp
      }

    case 'morphik_list_documents':
      const docsResponse = await fetch(`${baseUrl}/api/morphik/documents`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      const docsData = await docsResponse.json()
      if (!docsData.success) {
        throw new Error(docsData.error || 'Failed to list documents')
      }
      return {
        documents: docsData.data || [],
        timestamp: docsData.timestamp
      }

    case 'morphik_retrieve_chunks':
      const chunksResponse = await fetch(`${baseUrl}/api/morphik/chunks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: params.query,
          limit: params.limit || 5
        })
      })
      const chunksData = await chunksResponse.json()
      if (!chunksData.success) {
        throw new Error(chunksData.error || 'Failed to retrieve chunks')
      }
      return {
        chunks: chunksData.data || [],
        query: params.query,
        timestamp: chunksData.timestamp
      }

    case 'morphik_retrieve_visual':
      const visualResponse = await fetch(`${baseUrl}/api/morphik/chunks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: params.query,
          k: params.k || 8,
          useColpali: true,
          padding: params.padding || 1,
          minScore: params.minScore || 0
        })
      })
      const visualData = await visualResponse.json()
      if (!visualData.success) {
        throw new Error(visualData.error || 'Failed to retrieve visual content')
      }
      return {
        chunks: visualData.data || [],
        query: params.query,
        useColpali: true,
        timestamp: visualData.timestamp
      }

    case 'morphik_ingest_file':
      // This would need to be implemented as a file ingestion endpoint
      // For now, return a placeholder response
      return {
        message: 'File ingestion endpoint not yet implemented in HTTP bridge',
        path: params.path,
        useColpali: params.useColpali,
        timestamp: new Date().toISOString()
      }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

// Handle MCP requests
async function handleMCPRequest(mcpRequest: MCPRequest): Promise<MCPResponse> {
  try {
    switch (mcpRequest.method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id: mcpRequest.id,
          result: {
            protocolVersion: '2024-11-05',
            serverInfo: SERVER_INFO,
            capabilities: SERVER_INFO.capabilities
          }
        }

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id: mcpRequest.id,
          result: { tools: TOOLS }
        }

      case 'tools/call':
        const { name, arguments: args } = mcpRequest.params
        const result = await executeTool(name, args)
        return {
          jsonrpc: '2.0',
          id: mcpRequest.id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          }
        }

      default:
        return {
          jsonrpc: '2.0',
          id: mcpRequest.id,
          error: {
            code: -32601,
            message: `Method not found: ${mcpRequest.method}`
          }
        }
    }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: mcpRequest.id,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error'
      }
    }
  }
}

// HTTP Handlers
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Health check endpoint
  return NextResponse.json({
    server: SERVER_INFO,
    tools: TOOLS.length,
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Authentication
  if (!authenticateRequest(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const mcpRequest: MCPRequest = await request.json()
    const mcpResponse = await handleMCPRequest(mcpRequest)
    
    return NextResponse.json(mcpResponse, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error'
        }
      },
      { status: 400 }
    )
  }
}

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
