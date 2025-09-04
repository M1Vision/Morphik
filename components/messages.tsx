import type { UIMessage as TMessage } from "ai";
import type { UseChatHelpers } from "@ai-sdk/react";
import { Message } from "./message";
import { useScrollToBottom } from "@/lib/hooks/use-scroll-to-bottom";

export const Messages = ({
  messages,
  isLoading,
  status,
}: {
  messages: TMessage[];
  isLoading: boolean;
  status: "error" | "submitted" | "streaming" | "ready";
}) => {
  const [containerRef, endRef] = useScrollToBottom();
  
  return (
    <div
      className="h-full overflow-y-auto no-scrollbar"
      ref={containerRef}
    >
      <div className="max-w-lg sm:max-w-3xl mx-auto py-4">
        {messages.map((m, i) => {
          // Debug message parts
          console.log(`Message ${i} (${m.role}):`, {
            id: m.id,
            partsCount: m.parts?.length,
            partTypes: m.parts?.map(p => p.type),
            hasReasoning: m.parts?.some(p => p.type === 'reasoning'),
            fullParts: m.parts
          });
          
          return (
            <Message
              key={i}
              isLatestMessage={i === messages.length - 1}
              isLoading={isLoading}
              message={m}
              status={status}
            />
          );
        })}
        <div className="h-1" ref={endRef} />
      </div>
    </div>
  );
};
