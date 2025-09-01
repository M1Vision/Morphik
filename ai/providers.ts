import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogle } from "@ai-sdk/google";
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

const googleClient = createGoogle({
  apiKey: getApiKey('GOOGLE_API_KEY'),
});

const groqClient = createGroq({
  apiKey: getApiKey('GROQ_API_KEY'),
});

const xaiClient = createXai({
  apiKey: getApiKey('XAI_API_KEY'),
});

const languageModels = {
  // OpenAI Models
  "gpt-4": openaiClient('gpt-4'),
  "gpt-4-turbo": openaiClient('gpt-4-turbo'),
  "gpt-4o": openaiClient('gpt-4o'),
  "gpt-4o-mini": openaiClient('gpt-4o-mini'),
  
  // Anthropic Models
  "claude-3-5-sonnet": anthropicClient('claude-3-5-sonnet-20241022'),
  "claude-3-5-haiku": anthropicClient('claude-3-5-haiku-20241022'),
  "claude-3-opus": anthropicClient('claude-3-opus-20240229'),
  
  // Google Models
  "gemini-1.5-pro": googleClient('gemini-1.5-pro'),
  "gemini-1.5-flash": googleClient('gemini-1.5-flash'),
  
  // Groq Models (from original)
  "qwen3-32b": wrapLanguageModel({
    model: groqClient('qwen/qwen3-32b'),
    middleware
  }),
  "kimi-k2": groqClient('moonshotai/kimi-k2-instruct'),
  "llama4": groqClient('meta-llama/llama-4-scout-17b-16e-instruct'),
  
  // XAI Models (from original)
  "grok-3-mini": xaiClient("grok-3-mini-latest"),
};

export const modelDetails: Record<keyof typeof languageModels, ModelInfo> = {
  // OpenAI
  "gpt-4": {
    provider: "OpenAI",
    name: "GPT-4",
    description: "Most capable GPT-4 model for complex tasks requiring advanced reasoning.",
    apiVersion: "gpt-4",
    capabilities: ["Reasoning", "Creative", "Analysis"]
  },
  "gpt-4-turbo": {
    provider: "OpenAI",
    name: "GPT-4 Turbo",
    description: "Faster and more efficient version of GPT-4 with extended context.",
    apiVersion: "gpt-4-turbo",
    capabilities: ["Reasoning", "Efficient", "Extended Context"]
  },
  "gpt-4o": {
    provider: "OpenAI",
    name: "GPT-4o",
    description: "Latest GPT-4 Omni model with multimodal capabilities.",
    apiVersion: "gpt-4o",
    capabilities: ["Multimodal", "Reasoning", "Latest"]
  },
  "gpt-4o-mini": {
    provider: "OpenAI",
    name: "GPT-4o Mini",
    description: "Smaller, faster version of GPT-4o with good performance.",
    apiVersion: "gpt-4o-mini",
    capabilities: ["Efficient", "Fast", "Cost-Effective"]
  },
  
  // Anthropic
  "claude-3-5-sonnet": {
    provider: "Anthropic",
    name: "Claude 3.5 Sonnet",
    description: "Most intelligent Claude model with excellent reasoning and coding capabilities.",
    apiVersion: "claude-3-5-sonnet-20241022",
    capabilities: ["Reasoning", "Coding", "Analysis"]
  },
  "claude-3-5-haiku": {
    provider: "Anthropic",
    name: "Claude 3.5 Haiku",
    description: "Fast and efficient Claude model for quick tasks.",
    apiVersion: "claude-3-5-haiku-20241022",
    capabilities: ["Fast", "Efficient", "Balanced"]
  },
  "claude-3-opus": {
    provider: "Anthropic",
    name: "Claude 3 Opus",
    description: "Most powerful Claude 3 model for complex reasoning tasks.",
    apiVersion: "claude-3-opus-20240229",
    capabilities: ["Reasoning", "Creative", "Complex Tasks"]
  },
  
  // Google
  "gemini-1.5-pro": {
    provider: "Google",
    name: "Gemini 1.5 Pro",
    description: "Google's most capable model with large context window.",
    apiVersion: "gemini-1.5-pro",
    capabilities: ["Large Context", "Multimodal", "Reasoning"]
  },
  "gemini-1.5-flash": {
    provider: "Google",
    name: "Gemini 1.5 Flash",
    description: "Fast and efficient Gemini model for quick responses.",
    apiVersion: "gemini-1.5-flash",
    capabilities: ["Fast", "Efficient", "Multimodal"]
  },
  
  // Groq (from original)
  "qwen3-32b": {
    provider: "Groq",
    name: "Qwen 3 32B",
    description: "Latest version of Alibaba's Qwen 32B with strong reasoning and coding capabilities.",
    apiVersion: "qwen3-32b",
    capabilities: ["Reasoning", "Efficient", "Agentic"]
  },
  "kimi-k2": {
    provider: "Groq",
    name: "Kimi K2",
    description: "Latest version of Moonshot AI's Kimi K2 with good balance of capabilities.",
    apiVersion: "kimi-k2-instruct",
    capabilities: ["Balanced", "Efficient", "Agentic"]
  },
  "llama4": {
    provider: "Groq",
    name: "Llama 4",
    description: "Latest version of Meta's Llama 4 with good balance of capabilities.",
    apiVersion: "llama-4-scout-17b-16e-instruct",
    capabilities: ["Balanced", "Efficient", "Agentic"]
  },
  
  // XAI (from original)
  "grok-3-mini": {
    provider: "XAI",
    name: "Grok 3 Mini",
    description: "Latest version of XAI's Grok 3 Mini with strong reasoning and coding capabilities.",
    apiVersion: "grok-3-mini-latest",
    capabilities: ["Reasoning", "Efficient", "Agentic"]
  },
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