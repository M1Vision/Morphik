"use client";

import { defaultModel, type modelID } from "@/ai/providers";
import { useChat } from "@ai-sdk/react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Textarea } from "./textarea";
import { ProjectOverview } from "./project-overview";
import { Messages } from "./messages";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { getUserId } from "@/lib/user-id";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { useQueryClient } from "@tanstack/react-query";
import { type Message as DBMessage } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { useMCP } from "@/lib/context/mcp-context";
import { useAuth } from "@/lib/context/auth-context";

// Type for chat data from DB
interface ChatData {
  id: string;
  messages: DBMessage[];
  createdAt: string;
  updatedAt: string;
}

export default function Chat() {
  const router = useRouter();
  const params = useParams();
  const chatId = params?.id as string | undefined;
  const queryClient = useQueryClient();
  
  const [selectedModel, setSelectedModel] = useLocalStorage<modelID>("selectedModel", defaultModel);
  const [userId, setUserId] = useState<string>('');
  const [generatedChatId, setGeneratedChatId] = useState<string>('');
  const [isUserIdReady, setIsUserIdReady] = useState(false);
  
  // Get MCP server data from context
  const { mcpServersForApi } = useMCP();
  
  // Get authenticated user from Supabase
  const { user, loading } = useAuth();
  
  // Initialize userId from authenticated user
  useEffect(() => {
    console.log('=== USER ID INITIALIZATION ===');
    console.log('Auth loading:', loading);
    console.log('Authenticated user:', user);
    
    if (!loading) {
      if (user?.id) {
        // Use authenticated user ID
        console.log('Using authenticated user ID:', user.id);
        setUserId(user.id);
        setIsUserIdReady(true);
      } else {
        // Fallback to generated ID for unauthenticated users (if needed)
        console.log('No authenticated user, using fallback ID generation');
        const id = getUserId();
        console.log('Generated fallback userId:', id);
        setUserId(id);
        setIsUserIdReady(true);
      }
    }
    console.log('===============================');
  }, [user, loading]);
  
  // Generate a chat ID if needed
  useEffect(() => {
    if (!chatId) {
      setGeneratedChatId(nanoid());
    }
  }, [chatId]);
  
  // Use React Query to fetch chat history
  // const { data: chatData, isLoading: isLoadingChat, error } = useQuery({
  //   queryKey: ['chat', chatId, userId] as const,
  //   queryFn: async ({ queryKey }) => {
  //     const [_, chatId, userId] = queryKey;
  //     if (!chatId || !userId) return null;
      
  //     const response = await fetch(`/api/chats/${chatId}`, {
  //       headers: {
  //         'x-user-id': userId
  //       }
  //     });
      
  //     if (!response.ok) {
  //       // For 404, return empty chat data instead of throwing
  //       if (response.status === 404) {
  //         return { id: chatId, messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  //       }
  //       throw new Error('Failed to load chat');
  //     }
      
  //     return response.json() as Promise<ChatData>;
  //   },
  //   enabled: !!chatId && !!userId,
  //   retry: 1,
  //   staleTime: 1000 * 60 * 5, // 5 minutes
  //   refetchOnWindowFocus: false
  // });
  
  // Handle query errors
  // useEffect(() => {
  //   if (error) {
  //     console.error('Error loading chat history:', error);
  //     toast.error('Failed to load chat history');
  //   }
  // }, [error]);
  
  // Prepare initial messages from query data
  const initialMessages = useMemo(() => {
    return [];
  }, []);
  
  // Use useChat with custom fetch function to dynamically pass headers
  const { messages, status, sendMessage, stop, append } = useChat({
    api: '/api/chat',
    id: chatId || generatedChatId,
    initialMessages,
    fetch: async (url, options) => {
      // Custom fetch function that adds dynamic headers
      const headers = {
        ...options?.headers,
        'x-user-id': userId,
        'x-selected-model': selectedModel,
        'x-chat-id': chatId || generatedChatId,
      };
      
      console.log('Custom fetch - sending headers:', headers);
      console.log('Custom fetch - userId value:', userId);
      
      return fetch(url, {
        ...options,
        headers,
        body: JSON.stringify({
          ...JSON.parse(options?.body as string || '{}'),
          mcpServers: mcpServersForApi,
        }),
      });
    },
    onFinish: () => {
      // Invalidate the chats query to refresh the sidebar
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['chats', userId] });
      }
    },
    onError: (error) => {
      console.error('useChat error:', error);
      toast.error(
        error.message.length > 0
          ? error.message
          : "An error occured, please try again later.",
        { position: "top-center", richColors: true },
      );
    },
    // Only initialize when authentication is complete and userId is ready
    enabled: !loading && isUserIdReady && !!userId,
  });

  // Input state for the new sendMessage pattern
  const [input, setInput] = useState("");
  
  // Debug logging
  console.log('useChat values:', { 
    messagesLength: messages?.length,
    status,
    sendMessage: typeof sendMessage,
    userId,
    isUserIdReady,
    authLoading: loading,
    authenticatedUser: user?.id
  });
  
  console.log('useChat config - API endpoint: /api/chat');
  console.log('useChat enabled condition:', !loading && isUserIdReady && !!userId);
  console.log('userId value:', userId);
  console.log('auth user ID:', user?.id);
  
  // Early return if authentication is still loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Early return if no authenticated user (shouldn't happen due to AuthGuard, but safety check)
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Please sign in to use the chat</div>
      </div>
    );
  }
    
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Custom submit handler using the official sendMessage pattern
  const handleFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input?.trim()) {
      return; // Don't submit empty messages
    }
    
    const messageText = input.trim();
    setInput(""); // Clear input immediately
    
    // Use the official sendMessage from useChat
    sendMessage({ text: messageText });
    
    // Redirect to chat page if this was a new conversation
    if (!chatId && generatedChatId) {
      router.push(`/chat/${generatedChatId}`);
    }
  }, [input, sendMessage, chatId, generatedChatId, router]);

  const isLoading = status === "streaming" || status === "submitted";

  // Show loading state while userId is being initialized
  if (!isUserIdReady) {
    return (
      <div className="h-dvh flex flex-col justify-center items-center w-full max-w-3xl mx-auto px-4 sm:px-6 md:py-4">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col justify-center w-full max-w-3xl mx-auto px-4 sm:px-6 md:py-4">
      {messages.length === 0 ? (
        <div className="max-w-xl mx-auto w-full">
          <ProjectOverview />
          <form
            onSubmit={handleFormSubmit}
            className="mt-4 w-full mx-auto"
          >
            <Textarea
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              handleInputChange={handleInputChange}
              input={input}
              isLoading={isLoading}
              status={status}
              stop={stop}
            />
          </form>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto min-h-0 pb-2">
            <Messages messages={messages} isLoading={isLoading} status={status} append={append} />
          </div>
          <form
            onSubmit={handleFormSubmit}
            className="mt-2 w-full mx-auto mb-4 sm:mb-auto"
          >
            <Textarea
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              handleInputChange={handleInputChange}
              input={input}
              isLoading={isLoading}
              status={status}
              stop={stop}
            />
          </form>
        </>
      )}
    </div>
  );
}
