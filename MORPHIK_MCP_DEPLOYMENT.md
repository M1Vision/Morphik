# Scira Frontend Deployment on Vercel

This document describes how to deploy the Scira Frontend chat interface to Vercel. The frontend connects to a separate dedicated Morphik MCP server.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cursor/Claude │────│   Dedicated      │────│  Morphik Local  │
│   MCP Clients   │    │   MCP Server     │    │  Instance       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              ▲
                              │ (connects to)
                       ┌──────────────────┐
                       │  Scira Frontend  │
                       │  Chat Interface  │
                       └──────────────────┘
```

## Features

✅ **Pure MCP Client** - No embedded server logic  
✅ **HTTP & SSE Transport** - Modern transport methods  
✅ **Multiple MCP Servers** - Connect to any MCP server  
✅ **Vercel Deployment** - Optimized for frontend hosting  
✅ **Modern UI/UX** - Built with Next.js and shadcn/ui  
✅ **MCP-UI Support** - Rich tool response rendering  

## Deployment Steps

### 1. Environment Variables

Set these environment variables in your Vercel dashboard:

```bash
# MCP Server Authentication
MCP_AUTH_TOKEN=your-secure-random-token

# Morphik Configuration (if using cloud)
MORPHIK_API_URL=https://your-morphik-instance.com
MORPHIK_API_KEY=your-morphik-api-key

# Vercel URL (auto-populated)
VERCEL_URL=your-app.vercel.app
```

### 2. Deploy to Vercel

#### Option A: Git Integration (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repository to Vercel
3. Vercel will auto-deploy on every push

#### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
cd "Sica Frontend"
vercel

# Set environment variables
vercel env add MCP_AUTH_TOKEN
vercel env add MORPHIK_API_URL
vercel env add MORPHIK_API_KEY
```

### 3. Configure MCP Clients

Once deployed, configure your MCP clients to connect to:

**MCP Server URL**: `https://your-app.vercel.app/api/mcp`

#### Cursor Configuration

Add to your Cursor settings:

```json
{
  "mcp": {
    "servers": {
      "sica-morphik": {
        "url": "https://your-app.vercel.app/api/mcp",
        "auth": {
          "type": "bearer",
          "token": "your-secure-random-token"
        }
      }
    }
  }
}
```

#### Claude Desktop Configuration

Create/update `~/.config/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sica-morphik": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "-H", "Content-Type: application/json",
        "-H", "Authorization: Bearer your-secure-random-token",
        "https://your-app.vercel.app/api/mcp"
      ]
    }
  }
}
```

## Available MCP Tools

### 1. morphik_search
Search through Morphik knowledge base using semantic similarity.

**Parameters:**
- `query` (string, required): Search query
- `limit` (number, optional): Max results (default: 10)

### 2. morphik_list_documents  
List all available documents in the Morphik knowledge base.

**Parameters:** None

### 3. morphik_retrieve_chunks
Retrieve relevant text chunks from Morphik knowledge base.

**Parameters:**
- `query` (string, required): Search query  
- `limit` (number, optional): Max chunks (default: 5)

## Testing the Deployment

### Health Check
```bash
curl https://your-app.vercel.app/api/mcp
```

### MCP Protocol Test
```bash
curl -X POST https://your-app.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

### Tool Execution Test
```bash
curl -X POST https://your-app.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "morphik_search",
      "arguments": {
        "query": "test search",
        "limit": 5
      }
    }
  }'
```

## Security

- **Authentication**: All requests require Bearer token
- **CORS**: Configured for MCP client origins
- **Rate Limiting**: Vercel's built-in protection
- **HTTPS**: Automatic SSL/TLS encryption

## Monitoring

### Vercel Dashboard
- Function logs and analytics
- Performance metrics
- Error tracking

### Health Monitoring
```bash
# Check server status
curl https://your-app.vercel.app/api/mcp

# Expected response:
{
  "server": {
    "name": "sica-morphik-mcp",
    "version": "1.0.0"
  },
  "tools": 3,
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check MCP_AUTH_TOKEN environment variable
   - Verify Authorization header format

2. **Tool Execution Fails**
   - Ensure Morphik instance is running
   - Check MORPHIK_API_URL and MORPHIK_API_KEY

3. **CORS Errors**
   - Verify client origin is allowed
   - Check browser developer tools

### Debug Mode

Set `NODE_ENV=development` to enable debug logging:

```bash
vercel env add NODE_ENV development
```

## Scaling

- **Automatic**: Vercel scales based on demand
- **Global**: Edge network for low latency
- **Concurrent**: Handles multiple MCP clients
- **Cost-Effective**: Pay per request

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Configure MCP clients  
3. 🔄 Test tool functionality
4. 📊 Monitor usage and performance
5. 🚀 Scale as needed

Your Morphik MCP server is now ready for production use!



