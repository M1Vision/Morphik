import { createOpenAI } from "@ai-sdk/openai";
import { createGroq } from "@ai-sdk/groq";
import { createAnthropic } from "@ai-sdk/anthropic";
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

// Helper to get API keys from localStorage (client-side only)
const getApiKey = (key: string): string | undefined => {
  // Only check localStorage on client side
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem(key) || undefined;
  }
  
  return undefined;
};

// Create provider instances only when API keys are available
const createLanguageModels = () => {
  const models: Record<string, any> = {};
  
  // Only create providers if we have valid API keys
  const anthropicKey = getApiKey('ANTHROPIC_API_KEY');
  if (anthropicKey) {
    const anthropicClient = createAnthropic({
      apiKey: anthropicKey,
    });
    models["claude-4-sonnet"] = anthropicClient('claude-sonnet-4-20250514');
  }
  
  const groqKey = getApiKey('GROQ_API_KEY');
  if (groqKey) {
    const groqClient = createGroq({
      apiKey: groqKey,
    });
    models["qwen-qwq"] = wrapLanguageModel({
      model: groqClient("qwen-qwq-32b"),
      middleware
    });
  }
  
  return models;
};

export const modelDetails: Record<string, ModelInfo> = {
  "claude-4-sonnet": {
    provider: "Anthropic",
    name: "Claude 4 Sonnet",
    description: "Latest version of Anthropic's Claude 4 Sonnet with strong reasoning and coding capabilities.",
    apiVersion: "claude-sonnet-4-20250514",
    capabilities: ["Reasoning", "Efficient", "Agentic"]
  },
  "qwen-qwq": {
    provider: "Groq",
    name: "Qwen QWQ",
    description: "Latest version of Alibaba's Qwen QWQ with strong reasoning and coding capabilities.",
    apiVersion: "qwen-qwq",
    capabilities: ["Reasoning", "Efficient", "Agentic"]
  },
};

// Create a custom provider that dynamically creates language models
export const model = customProvider({
  languageModels: createLanguageModels(),
});

export type modelID = keyof typeof modelDetails;

export const MODELS = Object.keys(modelDetails);

export const defaultModel: modelID = "qwen-qwq";

// Update API keys when localStorage changes (for runtime updates)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    // Reload the page if any API key changed to refresh the providers
    if (event.key?.includes('API_KEY')) {
      window.location.reload();
    }
  });
}

