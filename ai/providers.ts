import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { groq } from "@ai-sdk/groq";
import { xai } from "@ai-sdk/xai";

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

// Function to get a language model by ID - following the official AI SDK v5 pattern
export const getLanguageModel = (modelId: string) => {
  switch (modelId) {
    // OpenAI Models
    case "gpt-4o":
      return wrapLanguageModel({
        model: openai("gpt-4o"),
        middleware
      });
    case "gpt-4o-mini":
      return wrapLanguageModel({
        model: openai("gpt-4o-mini"),
        middleware
      });

    // Anthropic Models
    case "claude-3-5-sonnet":
      return anthropic("claude-3-5-sonnet-20240620");
    case "claude-4-sonnet":
      return wrapLanguageModel({
        model: anthropic('claude-sonnet-4-20250514'),
        middleware
      });

    // Groq Models
    case "qwen-qwq":
      return wrapLanguageModel({
        model: groq("qwen-qwq-32b"),
        middleware
      });

    // XAI Models
    case "grok-3-mini":
      return xai("grok-3-mini-latest");

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
    name: "Claude 4 Sonnet",
    description: "Latest version of Anthropic's Claude 4 Sonnet with thinking mode and strong reasoning capabilities.",
    apiVersion: "claude-sonnet-4-20250514",
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

export const defaultModel: modelID = "claude-3-5-sonnet";