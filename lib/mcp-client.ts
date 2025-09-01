import { experimental_createMCPClient as createMCPClient } from 'ai';


export interface KeyValuePair {
  key: string;
  value: string;
}

export interface MCPServerConfig {
  url: string;
  type: 'http' | 'sse' | 'stdio';
  command?: string;
  args?: string[];
  env?: KeyValuePair[];
  headers?: KeyValuePair[];
}

export interface MCPClientManager {
  tools: Record<string, any>;
  clients: any[];
  cleanup: () => Promise<void>;
}

/**
 * Initialize MCP clients for API calls
 * This uses the already running persistent SSE servers
 */
export async function initializeMCPClients(
  mcpServers: MCPServerConfig[] = [],
  abortSignal?: AbortSignal
): Promise<MCPClientManager> {
  // Initialize tools
  let tools = {};
  const mcpClients: any[] = [];

  // Process each MCP server configuration
  for (const mcpServer of mcpServers) {
    try {
      // Create transport based on server type
      const transport = createTransport(mcpServer);

      const mcpClient = await createMCPClient({ transport });
      mcpClients.push(mcpClient);

      const mcptools = await mcpClient.tools();

      console.log(`MCP tools from ${mcpServer.url}:`, Object.keys(mcptools));

      // Add MCP tools to tools object
      tools = { ...tools, ...mcptools };
    } catch (error) {
      console.error("Failed to initialize MCP client:", error);
      // Continue with other servers instead of failing the entire request
    }
  }

  // Register cleanup for all clients if an abort signal is provided
  if (abortSignal && mcpClients.length > 0) {
    abortSignal.addEventListener('abort', async () => {
      await cleanupMCPClients(mcpClients);
    });
  }

  return {
    tools,
    clients: mcpClients,
    cleanup: async () => await cleanupMCPClients(mcpClients)
  };
}

/**
 * Create transport configuration based on server type
 */
function createTransport(server: MCPServerConfig) {
  const headers = server.headers?.reduce((acc, header) => {
    if (header.key) acc[header.key] = header.value || '';
    return acc;
  }, {} as Record<string, string>);

  switch (server.type) {
    case 'http':
      return {
        type: 'http' as const,
        url: server.url,
        headers
      };
    case 'sse':
      return {
        type: 'sse' as const,
        url: server.url,
        headers
      };
    case 'stdio':
      // stdio is handled differently in the context, this shouldn't be reached
      throw new Error('stdio transport should be handled by the sandbox system');
    default:
      throw new Error(`Unsupported transport type: ${server.type}`);
  }
}

async function cleanupMCPClients(clients: any[]): Promise<void> {
  // Clean up the MCP clients
  for (const client of clients) {
    try {
      await client.close();
    } catch (error) {
      console.error("Error closing MCP client:", error);
    }
  }
} 