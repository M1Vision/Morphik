import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGroq } from "@ai-sdk/groq";
import { createXai } from "@ai-sdk/xai";

import {
  wrapLanguageModel,
  extractReasoningMiddleware
} from "ai";

export interface ModelInfo {
  provider: string;
  name: string;
  description: string;
  apiVersion: string;
  capabilities: string[];
}

const middleware = extractReasoningMiddleware({
  tagName: 'think',
});

// Helper to get API keys from environment variables first, then localStorage
const getApiKey = (key: string): string | undefined => {
  // Check for environment variables first
  if (process.env[key]) {
    return process.env[key] || undefined;
  }

  // Fall back to localStorage if available
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem(key) || undefined;
  }

  return undefined;
};

// Create provider instances with API key handling
const openaiClient = createOpenAI({
  apiKey: getApiKey('OPENAI_API_KEY'),
});

const anthropicClient = createAnthropic({
  apiKey: getApiKey('ANTHROPIC_API_KEY'),
});

const groqClient = createGroq({
  apiKey: getApiKey('GROQ_API_KEY'),
});

const xaiClient = createXai({
  apiKey: getApiKey('XAI_API_KEY'),
});

// Function to get a language model by ID - following the official AI SDK v5 pattern
export const getLanguageModel = (modelId: string) => {
  switch (modelId) {
    // OpenAI Models
    case "gpt-4o":
      return wrapLanguageModel({
        model: openaiClient("gpt-4o"),
        middleware
      });
    case "gpt-4o-mini":
      return wrapLanguageModel({
        model: openaiClient("gpt-4o-mini"),
        middleware
      });

    // Anthropic Models
    case "claude-3-5-sonnet":
      // claude-3-5-sonnet doesn't support thinking mode, so don't wrap it
      return anthropicClient("claude-3-5-sonnet-20240620");
    case "claude-4-sonnet":
      // Claude 3.7 Sonnet with thinking mode (official model name from Vercel docs)
      return wrapLanguageModel({
        model: anthropicClient('claude-3-7-sonnet-20250219'),
        middleware
      });

    // Groq Models
    case "qwen-qwq":
      return wrapLanguageModel({
        model: groqClient("qwen-qwq-32b"),
        middleware
      });

    // XAI Models
    case "grok-3-mini":
      return xaiClient("grok-3-mini-latest");

    default:
      throw new Error(`Unknown model: ${modelId}`);
  }
};

export const modelDetails: Record<string, ModelInfo> = {
  // OpenAI Models
  "gpt-4o": {
    provider: "OpenAI",
    name: "GPT-4o",
    description: "Most advanced GPT-4 model with vision capabilities and improved reasoning.",
    apiVersion: "gpt-4o",
    capabilities: ["Vision", "Reasoning", "Code", "Function Calling"]
  },
  "gpt-4o-mini": {
    provider: "OpenAI", 
    name: "GPT-4o Mini",
    description: "Faster and more efficient version of GPT-4o.",
    apiVersion: "gpt-4o-mini",
    capabilities: ["Fast", "Efficient", "Function Calling"]
  },

  // Anthropic Models
  "claude-3-5-sonnet": {
    provider: "Anthropic",
    name: "Claude 3.5 Sonnet",
    description: "Most capable Claude model with excellent reasoning and coding abilities.",
    apiVersion: "claude-3-5-sonnet-20240620",
    capabilities: ["Reasoning", "Code", "Analysis", "Long Context"]
  },
  "claude-4-sonnet": {
    provider: "Anthropic",
    name: "Claude 3.7 Sonnet",
    description: "Most intelligent model with extended thinking",
    apiVersion: "claude-3-7-sonnet-20250219",
    capabilities: ["Thinking", "Reasoning", "Efficient", "Agentic"]
  },

  // Groq Models
  "qwen-qwq": {
    provider: "Groq",
    name: "Qwen QWQ",
    description: "Latest version of Alibaba's Qwen QWQ with strong reasoning and coding capabilities.",
    apiVersion: "qwen-qwq",
    capabilities: ["Reasoning", "Efficient", "Agentic"]
  },

  // XAI Models
  "grok-3-mini": {
    provider: "XAI",
    name: "Grok 3 Mini",
    description: "Latest version of XAI's Grok 3 Mini with strong reasoning capabilities.",
    apiVersion: "grok-3-mini-latest",
    capabilities: ["Reasoning", "Efficient", "Agentic"]
  },
};

export type modelID = keyof typeof modelDetails;

export const MODELS = Object.keys(modelDetails);

export const defaultModel: modelID = "claude-4-sonnet";