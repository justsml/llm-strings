import type { Provider } from "./provider-core.js";

/* ------------------------------------------------------------------ */
/*  UI-consumable metadata for 3rd-party integrations                 */
/* ------------------------------------------------------------------ */

export interface ProviderMeta {
  /** Provider identifier — matches the Provider union type. */
  id: Provider;
  /** Human-readable display name. */
  name: string;
  /** Default / canonical API hostname. */
  host: string;
  /** Brand color as a CSS hex value. */
  color: string;
}

export const PROVIDER_META: ProviderMeta[] = [
  { id: "openai",     name: "OpenAI",     host: "api.openai.com",                          color: "#10a37f" },
  { id: "anthropic",  name: "Anthropic",   host: "api.anthropic.com",                       color: "#e8956a" },
  { id: "google",     name: "Google",      host: "generativelanguage.googleapis.com",        color: "#4285f4" },
  { id: "mistral",    name: "Mistral",     host: "api.mistral.ai",                          color: "#ff7000" },
  { id: "cohere",     name: "Cohere",      host: "api.cohere.com",                          color: "#39594d" },
  { id: "bedrock",    name: "Bedrock",     host: "bedrock-runtime.us-east-1.amazonaws.com", color: "#ff9900" },
  { id: "openrouter", name: "OpenRouter",  host: "openrouter.ai",                           color: "#818cf8" },
  { id: "vercel",     name: "Vercel",      host: "gateway.ai.vercel.app",                   color: "#ededed" },
];

/**
 * Suggested / common model IDs per provider, ordered by recency.
 * Not exhaustive — providers add models frequently.
 */
export const MODELS: Record<Provider, string[]> = {
  openai: [
    "gpt-5.2", "gpt-5.2-pro",
    "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano",
    "o3", "o3-mini", "o4-mini", "o1-pro",
  ],
  anthropic: [
    "claude-opus-4-6", "claude-sonnet-4-6",
    "claude-sonnet-4-5", "claude-haiku-4-5",
  ],
  google: [
    "gemini-3-pro-preview", "gemini-3-flash-preview",
    "gemini-2.5-pro", "gemini-2.5-flash",
  ],
  mistral: [
    "mistral-large-latest", "mistral-medium-latest",
    "mistral-small-latest", "codestral-latest",
    "magistral-medium-latest",
  ],
  cohere: [
    "command-a-03-2025",
    "command-r-plus-08-2024", "command-r-08-2024",
    "command-r7b-12-2024",
  ],
  bedrock: [
    "anthropic.claude-opus-4-6-v1", "anthropic.claude-sonnet-4-6-v1",
    "anthropic.claude-haiku-4-5-v1",
    "amazon.nova-pro-v1", "amazon.nova-lite-v1",
    "meta.llama3-70b-instruct-v1:0",
  ],
  openrouter: [
    "openai/gpt-5.2", "anthropic/claude-opus-4-6",
    "google/gemini-2.5-pro", "mistral/mistral-large-latest",
  ],
  vercel: [
    "openai/gpt-5.2", "anthropic/claude-opus-4-6",
    "google/gemini-2.5-pro", "google/gemini-3-pro-preview",
    "google/gemini-3-flash-preview", "mistral/mistral-large-latest",
    "qwen/qwen2.5-pro",
  ],
};

/**
 * Canonical parameter spec — keyed by canonical (snake_case) param names
 * with defaults and descriptions for UI consumption.
 */
export interface CanonicalParamSpec {
  type: "number" | "string" | "boolean" | "enum";
  min?: number;
  max?: number;
  values?: string[];
  default?: string | number | boolean;
  description?: string;
}

export const CANONICAL_PARAM_SPECS: Record<Provider, Record<string, CanonicalParamSpec>> = {
  openai: {
    temperature:       { type: "number",  min: 0, max: 2,  default: 0.7,  description: "Controls randomness" },
    max_tokens:        { type: "number",  min: 1,          default: 4096, description: "Maximum output tokens" },
    top_p:             { type: "number",  min: 0, max: 1,  default: 1,    description: "Nucleus sampling" },
    frequency_penalty: { type: "number",  min: -2, max: 2, default: 0,    description: "Penalize frequent tokens" },
    presence_penalty:  { type: "number",  min: -2, max: 2, default: 0,    description: "Penalize repeated topics" },
    stop:              { type: "string",                    default: "",   description: "Stop sequences" },
    n:                 { type: "number",  min: 1,           default: 1,    description: "Completions count" },
    seed:              { type: "number",                    default: "",   description: "Random seed" },
    stream:            { type: "boolean",                   default: false, description: "Stream response" },
    effort:            { type: "enum", values: ["none", "minimal", "low", "medium", "high", "xhigh"], default: "medium", description: "Reasoning effort" },
  },
  anthropic: {
    temperature: { type: "number",  min: 0, max: 1, default: 0.7,  description: "Controls randomness" },
    max_tokens:  { type: "number",  min: 1,         default: 4096, description: "Maximum output tokens" },
    top_p:       { type: "number",  min: 0, max: 1, default: 1,    description: "Nucleus sampling" },
    top_k:       { type: "number",  min: 0,         default: 40,   description: "Top-K sampling" },
    stop:        { type: "string",                   default: "",   description: "Stop sequences" },
    stream:      { type: "boolean",                  default: false, description: "Stream response" },
    effort:      { type: "enum", values: ["low", "medium", "high", "max"], default: "medium", description: "Thinking effort" },
    cache:       { type: "enum", values: ["ephemeral"],   default: "ephemeral", description: "Cache control" },
    cache_ttl:   { type: "enum", values: ["5m", "1h"],    default: "5m",        description: "Cache TTL" },
  },
  google: {
    temperature:       { type: "number",  min: 0, max: 2,  default: 0.7,  description: "Controls randomness" },
    max_tokens:        { type: "number",  min: 1,          default: 4096, description: "Maximum output tokens" },
    top_p:             { type: "number",  min: 0, max: 1,  default: 1,    description: "Nucleus sampling" },
    top_k:             { type: "number",  min: 0,          default: 40,   description: "Top-K sampling" },
    frequency_penalty: { type: "number",  min: -2, max: 2, default: 0,    description: "Penalize frequent tokens" },
    presence_penalty:  { type: "number",  min: -2, max: 2, default: 0,    description: "Penalize repeated topics" },
    stop:              { type: "string",                    default: "",   description: "Stop sequences" },
    n:                 { type: "number",  min: 1,           default: 1,    description: "Candidate count" },
    stream:            { type: "boolean",                   default: false, description: "Stream response" },
    seed:              { type: "number",                    default: "",   description: "Random seed" },
  },
  mistral: {
    temperature:       { type: "number",  min: 0, max: 1,  default: 0.7,  description: "Controls randomness" },
    max_tokens:        { type: "number",  min: 1,          default: 4096, description: "Maximum output tokens" },
    top_p:             { type: "number",  min: 0, max: 1,  default: 1,    description: "Nucleus sampling" },
    frequency_penalty: { type: "number",  min: -2, max: 2, default: 0,    description: "Penalize frequent tokens" },
    presence_penalty:  { type: "number",  min: -2, max: 2, default: 0,    description: "Penalize repeated topics" },
    stop:              { type: "string",                    default: "",   description: "Stop sequences" },
    n:                 { type: "number",  min: 1,           default: 1,    description: "Completions count" },
    seed:              { type: "number",                    default: "",   description: "Random seed" },
    stream:            { type: "boolean",                   default: false, description: "Stream response" },
    safe_prompt:       { type: "boolean",                   default: false, description: "Enable safe prompt" },
    min_tokens:        { type: "number",  min: 0,          default: 0,    description: "Minimum tokens" },
  },
  cohere: {
    temperature:       { type: "number",  min: 0, max: 1,       default: 0.7,  description: "Controls randomness" },
    max_tokens:        { type: "number",  min: 1,               default: 4096, description: "Maximum output tokens" },
    top_p:             { type: "number",  min: 0, max: 1,       default: 1,    description: "Nucleus sampling (p)" },
    top_k:             { type: "number",  min: 0, max: 500,     default: 40,   description: "Top-K sampling (k)" },
    frequency_penalty: { type: "number",  min: 0, max: 1,       default: 0,    description: "Penalize frequent tokens" },
    presence_penalty:  { type: "number",  min: 0, max: 1,       default: 0,    description: "Penalize repeated topics" },
    stop:              { type: "string",                         default: "",   description: "Stop sequences" },
    stream:            { type: "boolean",                        default: false, description: "Stream response" },
    seed:              { type: "number",                         default: "",   description: "Random seed" },
  },
  bedrock: {
    temperature: { type: "number",  min: 0, max: 1, default: 0.7,  description: "Controls randomness" },
    max_tokens:  { type: "number",  min: 1,         default: 4096, description: "Maximum output tokens" },
    top_p:       { type: "number",  min: 0, max: 1, default: 1,    description: "Nucleus sampling" },
    top_k:       { type: "number",  min: 0,         default: 40,   description: "Top-K sampling" },
    stop:        { type: "string",                   default: "",   description: "Stop sequences" },
    stream:      { type: "boolean",                  default: false, description: "Stream response" },
    cache:       { type: "enum", values: ["ephemeral"],   default: "ephemeral", description: "Cache control" },
    cache_ttl:   { type: "enum", values: ["5m", "1h"],    default: "5m",        description: "Cache TTL" },
  },
  openrouter: {
    temperature:       { type: "number",  min: 0, max: 2,  default: 0.7,  description: "Controls randomness" },
    max_tokens:        { type: "number",  min: 1,          default: 4096, description: "Maximum output tokens" },
    top_p:             { type: "number",  min: 0, max: 1,  default: 1,    description: "Nucleus sampling" },
    top_k:             { type: "number",  min: 0,          default: 40,   description: "Top-K sampling" },
    frequency_penalty: { type: "number",  min: -2, max: 2, default: 0,    description: "Penalize frequent tokens" },
    presence_penalty:  { type: "number",  min: -2, max: 2, default: 0,    description: "Penalize repeated topics" },
    stop:              { type: "string",                    default: "",   description: "Stop sequences" },
    n:                 { type: "number",  min: 1,           default: 1,    description: "Completions count" },
    seed:              { type: "number",                    default: "",   description: "Random seed" },
    stream:            { type: "boolean",                   default: false, description: "Stream response" },
    effort:            { type: "enum", values: ["none", "minimal", "low", "medium", "high", "xhigh"], default: "medium", description: "Reasoning effort" },
  },
  vercel: {
    temperature:       { type: "number",  min: 0, max: 2,  default: 0.7,  description: "Controls randomness" },
    max_tokens:        { type: "number",  min: 1,          default: 4096, description: "Maximum output tokens" },
    top_p:             { type: "number",  min: 0, max: 1,  default: 1,    description: "Nucleus sampling" },
    top_k:             { type: "number",  min: 0,          default: 40,   description: "Top-K sampling" },
    frequency_penalty: { type: "number",  min: -2, max: 2, default: 0,    description: "Penalize frequent tokens" },
    presence_penalty:  { type: "number",  min: -2, max: 2, default: 0,    description: "Penalize repeated topics" },
    stop:              { type: "string",                    default: "",   description: "Stop sequences" },
    n:                 { type: "number",  min: 1,           default: 1,    description: "Completions count" },
    seed:              { type: "number",                    default: "",   description: "Random seed" },
    stream:            { type: "boolean",                   default: false, description: "Stream response" },
    effort:            { type: "enum", values: ["none", "minimal", "low", "medium", "high", "xhigh"], default: "medium", description: "Reasoning effort" },
  },
};
