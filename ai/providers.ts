import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGroq } from "@ai-sdk/groq";
import { createXai } from "@ai-sdk/xai";

import {
  customProvider,
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

const languageModels = {
  // OpenAI Models
  "gpt-4o": wrapLanguageModel({
    model: openaiClient("gpt-4o"),
    middleware
  }),
  "gpt-4o-mini": wrapLanguageModel({
    model: openaiClient("gpt-4o-mini"),
    middleware
  }),

  // Anthropic Models
  "claude-3-5-sonnet": wrapLanguageModel({
    model: anthropicClient("claude-3-5-sonnet-20240620"),
    middleware
  }),

  // Groq Models (from original scira-mcp-chat)
  "qwen3-32b": wrapLanguageModel(
    {
      model: groqClient('qwen/qwen3-32b'),
      middleware
    }
  ),
  "kimi-k2": groqClient('moonshotai/kimi-k2-instruct'),
  "llama4": groqClient('meta-llama/llama-4-scout-17b-16e-instruct'),

  // XAI Models (from original scira-mcp-chat)
  "grok-3-mini": xaiClient("grok-3-mini-latest"),
};

export const modelDetails: Record<keyof typeof languageModels, ModelInfo> = {
  // OpenAI
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

  // Anthropic
  "claude-3-5-sonnet": {
    provider: "Anthropic",
    name: "Claude 3.5 Sonnet",
    description: "Most capable Claude model with excellent reasoning and coding abilities.",
    apiVersion: "claude-3-5-sonnet-20240620",
    capabilities: ["Reasoning", "Code", "Analysis", "Long Context"]
  },

  // Groq (from original scira-mcp-chat)
  "kimi-k2": {
    provider: "Groq",
    name: "Kimi K2",
    description: "Latest version of Moonshot AI's Kimi K2 with good balance of capabilities.",
    apiVersion: "kimi-k2-instruct",
    capabilities: ["Balanced", "Efficient", "Agentic"]
  },
  "qwen3-32b": {
    provider: "Groq",
    name: "Qwen 3 32B",
    description: "Latest version of Alibaba's Qwen 32B with strong reasoning and coding capabilities.",
    apiVersion: "qwen3-32b",
    capabilities: ["Reasoning", "Efficient", "Agentic"]
  },
  "llama4": {
    provider: "Groq",
    name: "Llama 4",
    description: "Latest version of Meta's Llama 4 with good balance of capabilities.",
    apiVersion: "llama-4-scout-17b-16e-instruct",
    capabilities: ["Balanced", "Efficient", "Agentic"]
  },

  // XAI (from original scira-mcp-chat)
  "grok-3-mini": {
    provider: "XAI",
    name: "Grok 3 Mini",
    description: "Latest version of XAI's Grok 3 Mini with strong reasoning and coding capabilities.",
    apiVersion: "grok-3-mini-latest",
    capabilities: ["Reasoning", "Efficient", "Agentic"]
  }
};

// Update API keys when localStorage changes (for runtime updates)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    // Reload the page if any API key changed to refresh the providers
    if (event.key?.includes('API_KEY')) {
      window.location.reload();
    }
  });
}

export const model = customProvider({
  languageModels,
});

export type modelID = keyof typeof languageModels;

export const MODELS = Object.keys(languageModels);

export const defaultModel: modelID = "claude-3-5-sonnet";