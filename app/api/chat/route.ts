import { getLanguageModel, type modelID } from '@/ai/providers';
import { smoothStream, streamText, convertToModelMessages, type UIMessage, stepCountIs } from 'ai';
import { AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { nanoid } from 'nanoid';
import { initializeMCPClients, type MCPServerConfig } from '@/lib/mcp-client';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { saveChat, convertToDBMessages } from '@/lib/chat-store';
import { db } from '@/lib/db';
import { chats } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

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
  
  // AI SDK v5 standard format: messages and data in body
  const { 
    messages, 
    mcpServers = [], 
    userId: bodyUserId, 
    selectedModel: bodySelectedModel, 
    chatId: bodyChatId 
  }: {
    messages: UIMessage[];
    mcpServers?: MCPServerConfig[];
    userId?: string;
    selectedModel?: string;
    chatId?: string;
  } = requestBody;
  
  // Get user from Supabase session (more reliable than body)
  const supabase = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  // Use authenticated user ID, fallback to body userId
  const userId = user?.id || bodyUserId;
  const selectedModel = bodySelectedModel;
  const chatId = bodyChatId;

  if (!userId) {
    console.error('Authentication failed:', { authError, bodyUserId, user: user?.id });
    return new Response(JSON.stringify({ error: 'User ID is required - please sign in' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  console.log('User authenticated:', { userId: user?.id, fallbackUserId: bodyUserId, finalUserId: userId });

  const id = chatId || nanoid();

  // Check if this is a new chat and create it in the database
  if (id && userId) {
    try {
      // Check if chat already exists for the given ID
      const existingChat = await db.query.chats.findFirst({
        where: and(eq(chats.id, id), eq(chats.userId, userId)),
      });

      if (!existingChat) {
        // This is a new chat, save it immediately so it appears in the sidebar
        await saveChat({
          id,
          userId,
          title: "New Chat",
          messages: [],
        });
        console.log('Created new chat:', id);
      }
    } catch (error) {
      console.error("Error checking/creating new chat:", error);
    }
  }

  // Initialize MCP clients using the already running persistent SSE servers
  // mcpServers now only contains SSE and HTTP configurations
  // have been converted to SSE in the MCP context
  const { tools, cleanup } = await initializeMCPClients(mcpServers, req.signal);

  // Only enable thinking for models that support it
  const supportsThinking = selectedModel === "claude-4-sonnet";
  
  // Use the getLanguageModel function to properly handle reasoning middleware
  const modelInstance = getLanguageModel(selectedModel || "claude-4-sonnet");

  console.log('messages', messages);
  console.log('parts', messages.map(m => m.parts?.map ? m.parts.map(p => p) : []));
  console.log('Selected model:', selectedModel);
  console.log('Supports thinking:', supportsThinking);
  console.log('Model instance:', typeof modelInstance);

  // Track if the response has completed
  let responseCompleted = false;
  
  const result = streamText({
    model: modelInstance,
    system: `You are a helpful assistant with access to a variety of tools.

    Today's date is ${new Date().toISOString().split('T')[0]}.

    The tools are very powerful, and you can use them to answer the user's question.
    So choose the tool that is most relevant to the user's question.

    If tools are not available, say you don't know or if the user wants a tool they can add one from the server icon in bottom left corner in the sidebar.

    You can use multiple tools in a single response.
    Always respond after using the tools for better user experience.
    You can run multiple steps using all the tools!!!!
    Make sure to use the right tool to respond to the user's question.

    Multiple tools can be used in a single response and multiple steps can be used to answer the user's question.

    ## Response Format
    - Markdown is supported.
    - Respond according to tool's response.
    - Use the tools to answer the user's question.
    - If you don't know the answer, use the tools to find the answer or say you don't know.
    `,
    messages: convertToModelMessages(messages),
    tools,
    toolChoice: 'auto', // Enable automatic tool selection
    stopWhen: stepCountIs(5), // Allow multi-step tool execution (up to 5 steps)
    providerOptions: {
      anthropic: {
        thinking: { type: 'enabled', budgetTokens: 12000 },
      } satisfies AnthropicProviderOptions,
    },
    experimental_transform: smoothStream({
      delayInMs: 5, // optional: defaults to 10ms
      chunking: 'line', // optional: defaults to 'word'
    }),
    onError: (error) => {
      console.error(JSON.stringify(error, null, 2));
    },
    onStepFinish: ({ text, reasoning, toolCalls, toolResults }) => {
      console.log('Step finished:', { hasText: !!text, hasReasoning: !!reasoning, toolCallsCount: toolCalls?.length });
      if (reasoning && Array.isArray(reasoning)) {
        console.log('Reasoning generated:', reasoning.length + ' reasoning parts');
      }
    },
    async onFinish({ text, reasoning, toolCalls, toolResults, usage }) {
      responseCompleted = true;
      console.log('Final response:', { hasText: !!text, hasReasoning: !!reasoning, toolCallsCount: toolCalls?.length });
      if (reasoning && Array.isArray(reasoning)) {
        console.log('Final reasoning parts:', reasoning.length);
      }

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

  // Return the streaming response using the AI SDK v5 method with proper persistence
  return result.toUIMessageStreamResponse({
    originalMessages: messages, // Critical: Pass original messages for conversation continuity
    sendReasoning: true,
    headers: {
      'X-Chat-ID': id,
    },
    onFinish: async ({ messages: finalMessages }) => {
      // Save conversation to database after completion (AI SDK v5 way)
      try {
        await saveChat({
          id,
          userId,
          messages: finalMessages,
        });
        console.log('Chat saved to database:', id);
      } catch (error) {
        console.error('Error saving chat to database:', error);
      }
    },
  });
}
