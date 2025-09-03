import { getLanguageModel, type modelID } from '@/ai/providers';
import { smoothStream, streamText, convertToModelMessages, type UIMessage } from 'ai';
import { nanoid } from 'nanoid';
import { initializeMCPClients, type MCPServerConfig } from '@/lib/mcp-client';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const requestBody = await req.json();
  
  console.log('=== CHAT API REQUEST ===');
  console.log('Full request body:', JSON.stringify(requestBody, null, 2));
  console.log('Headers:', {
    'x-user-id': req.headers.get('x-user-id'),
    'x-selected-model': req.headers.get('x-selected-model'),
    'x-chat-id': req.headers.get('x-chat-id'),
  });
  console.log('========================');
  
  // AI SDK v5 standard format: messages in body, additional data from headers
  const { messages, mcpServers = [] }: {
    messages: UIMessage[];
    mcpServers?: MCPServerConfig[];
  } = requestBody;
  
  // Get user from Supabase session (more reliable than headers)
  const supabase = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  // Fallback to headers if Supabase auth fails
  const headerUserId = req.headers.get('x-user-id');
  const selectedModel = req.headers.get('x-selected-model');
  const chatId = req.headers.get('x-chat-id');
  
  const userId = user?.id || headerUserId;

  if (!userId) {
    console.error('Authentication failed:', { authError, headerUserId, user: user?.id });
    return new Response(JSON.stringify({ error: 'User ID is required - please sign in' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  console.log('User authenticated:', { userId: user?.id, fallbackUserId: headerUserId, finalUserId: userId });

  const id = chatId || nanoid();

  // Initialize MCP clients using the already running persistent SSE servers
  // mcpServers now only contains SSE and HTTP configurations
  // have been converted to SSE in the MCP context
  const { tools, cleanup } = await initializeMCPClients(mcpServers, req.signal);

  console.log('messages', messages);
  console.log('parts', messages.map(m => m.parts?.map ? m.parts.map(p => p) : []));

  // Track if the response has completed
  let responseCompleted = false;

  // Use direct model access to avoid any middleware issues
  let modelInstance;
  switch (selectedModel) {
    case "claude-3-5-sonnet":
      const { anthropic } = await import('@ai-sdk/anthropic');
      modelInstance = anthropic("claude-3-5-sonnet-20240620");
      break;
    case "claude-4-sonnet":
      const { anthropic: anthropic2 } = await import('@ai-sdk/anthropic');
      modelInstance = anthropic2('claude-sonnet-4-20250514');
      break;
    case "gpt-4o":
      const { openai } = await import('@ai-sdk/openai');
      modelInstance = openai("gpt-4o");
      break;
    case "gpt-4o-mini":
      const { openai: openai2 } = await import('@ai-sdk/openai');
      modelInstance = openai2("gpt-4o-mini");
      break;
    case "qwen-qwq":
      const { groq } = await import('@ai-sdk/groq');
      modelInstance = groq("qwen-qwq-32b");
      break;
    case "grok-3-mini":
      const { xai } = await import('@ai-sdk/xai');
      modelInstance = xai("grok-3-mini-latest");
      break;
    default:
      modelInstance = getLanguageModel(selectedModel || "claude-3-5-sonnet");
  }

  const result = streamText({
    model: modelInstance,
    system: `You are a helpful assistant with access to a variety of tools.

    Today's date is ${new Date().toISOString().split('T')[0]}.

    The tools are very powerful, and you can use them to answer the user's question.
    So choose the tool that is most relevant to the user's question.

    If tools are not available, say you don't know or if the user wants a tool they can add one from the server icon in bottom left corner in the sidebar.

    Always respond after using the tools for better user experience.
    Make sure to use the right tool to respond to the user's question.
    Use only one tool at a time. If you need to use multiple tools, use the tool that is most relevant to the user's question.

    ## Response Format
    - Markdown is supported.
    - Respond according to tool's response.
    - Use the tools to answer the user's question.
    - If you don't know the answer, use the tools to find the answer or say you don't know.
    `,
    messages: convertToModelMessages(messages),
    tools,
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingBudget: 2048,
        },
      },
    },
    experimental_transform: smoothStream({
      delayInMs: 5, // optional: defaults to 10ms
      chunking: 'line', // optional: defaults to 'word'
    }),
    onError: (error) => {
      console.error(JSON.stringify(error, null, 2));
    },
    async onFinish() {
      responseCompleted = true;

      // Clean up resources - now this just closes the client connections
      // not the actual servers which persist in the MCP context
      await cleanup();
    },
  });

  // Ensure cleanup happens if the request is terminated early
  req.signal.addEventListener('abort', async () => {
    if (!responseCompleted) {
      console.log('Request aborted, cleaning up resources');
      try {
        await cleanup();
      } catch (error) {
        console.error('Error during cleanup on abort:', error);
      }
    }
  });

  // Return the streaming response using the AI SDK v5 method
  return result.toUIMessageStreamResponse({
    headers: {
      'X-Chat-ID': id,
    },
  });
}
