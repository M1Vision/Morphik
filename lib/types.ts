// Shared types that can be safely imported by both client and server code
// This file contains NO imports from server-only modules

export type MessagePart = {
  type: string;
  text?: string;
  toolCallId?: string;
  toolName?: string;
  args?: any;
  result?: any;
  reasoning?: string;
  [key: string]: any;
};

export type DBMessage = {
  id: string;
  chatId: string;
  role: string;
  parts: MessagePart[];
  createdAt: Date;
};

export type ChatData = {
  id: string;
  messages: DBMessage[];
  createdAt: string;
  updatedAt: string;
};

export type Attachment = {
  type: string;
  [key: string]: any;
};

// Helper function to get text content from message parts (client-safe)
export function getTextContent(message: { parts: MessagePart[] }): string {
  try {
    return message.parts
      .filter((part) => part.type === "text" && part.text)
      .map((part) => part.text)
      .join("\n");
  } catch (e) {
    // If parsing fails, return empty string
    return "";
  }
}
