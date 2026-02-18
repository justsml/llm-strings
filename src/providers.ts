export type Provider =
  | "openai"
  | "anthropic"
  | "google"
  | "mistral"
  | "cohere"
  | "bedrock"
  | "openrouter"
  | "vercel";

export function detectProvider(host: string): Provider | undefined {
  // Gateways and aggregators first — they proxy to other providers
  if (host.includes("openrouter")) return "openrouter";
  if (host.includes("gateway.ai.vercel")) return "vercel";
  // Bedrock before native providers since it hosts models from multiple vendors
  if (host.includes("amazonaws") || host.includes("bedrock")) return "bedrock";
  if (host.includes("openai")) return "openai";
  if (host.includes("anthropic") || host.includes("claude")) return "anthropic";
  if (host.includes("googleapis") || host.includes("google")) return "google";
  if (host.includes("mistral")) return "mistral";
  if (host.includes("cohere")) return "cohere";
  return undefined;
}

/**
 * Shorthand aliases → canonical param name.
 * Canonical names use snake_case and follow OpenAI conventions where possible.
 */
export const ALIASES: Record<string, string> = {
  // temperature
  temp: "temperature",

  // max_tokens
  max: "max_tokens",
  max_out: "max_tokens",
  max_output: "max_tokens",
  max_output_tokens: "max_tokens",
  max_completion_tokens: "max_tokens",
  maxOutputTokens: "max_tokens",
  maxTokens: "max_tokens",

  // top_p
  topp: "top_p",
  topP: "top_p",
  nucleus: "top_p",

  // top_k
  topk: "top_k",
  topK: "top_k",

  // frequency_penalty
  freq: "frequency_penalty",
  freq_penalty: "frequency_penalty",
  frequencyPenalty: "frequency_penalty",
  repetition_penalty: "frequency_penalty",

  // presence_penalty
  pres: "presence_penalty",
  pres_penalty: "presence_penalty",
  presencePenalty: "presence_penalty",

  // stop
  stop_sequences: "stop",
  stopSequences: "stop",
  stop_sequence: "stop",

  // seed
  random_seed: "seed",
  randomSeed: "seed",

  // n (completions count)
  candidateCount: "n",
  candidate_count: "n",
  num_completions: "n",

  // effort / reasoning
  reasoning_effort: "effort",
  reasoning: "effort",

  // cache
  cache_control: "cache",
  cacheControl: "cache",
  cachePoint: "cache",
  cache_point: "cache",
};

/**
 * Canonical param name → provider-specific API param name.
 * Only includes params the provider actually supports.
 */
export const PROVIDER_PARAMS: Record<Provider, Record<string, string>> = {
  openai: {
    temperature: "temperature",
    max_tokens: "max_tokens",
    top_p: "top_p",
    frequency_penalty: "frequency_penalty",
    presence_penalty: "presence_penalty",
    stop: "stop",
    n: "n",
    seed: "seed",
    stream: "stream",
    effort: "reasoning_effort",
  },
  anthropic: {
    temperature: "temperature",
    max_tokens: "max_tokens",
    top_p: "top_p",
    top_k: "top_k",
    stop: "stop_sequences",
    stream: "stream",
    effort: "effort",
    cache: "cache_control",
    cache_ttl: "cache_ttl",
  },
  google: {
    temperature: "temperature",
    max_tokens: "maxOutputTokens",
    top_p: "topP",
    top_k: "topK",
    frequency_penalty: "frequencyPenalty",
    presence_penalty: "presencePenalty",
    stop: "stopSequences",
    n: "candidateCount",
    stream: "stream",
    seed: "seed",
    responseMimeType: "responseMimeType",
    responseSchema: "responseSchema",
  },
  mistral: {
    temperature: "temperature",
    max_tokens: "max_tokens",
    top_p: "top_p",
    frequency_penalty: "frequency_penalty",
    presence_penalty: "presence_penalty",
    stop: "stop",
    n: "n",
    seed: "random_seed",
    stream: "stream",
    safe_prompt: "safe_prompt",
    min_tokens: "min_tokens",
  },
  cohere: {
    temperature: "temperature",
    max_tokens: "max_tokens",
    top_p: "p",
    top_k: "k",
    frequency_penalty: "frequency_penalty",
    presence_penalty: "presence_penalty",
    stop: "stop_sequences",
    stream: "stream",
    seed: "seed",
  },
  bedrock: {
    // Bedrock Converse API uses camelCase
    temperature: "temperature",
    max_tokens: "maxTokens",
    top_p: "topP",
    top_k: "topK", // Claude models via additionalModelRequestFields
    stop: "stopSequences",
    stream: "stream",
    cache: "cache_control",
    cache_ttl: "cache_ttl",
  },
  openrouter: {
    // OpenAI-compatible API with extra routing params
    temperature: "temperature",
    max_tokens: "max_tokens",
    top_p: "top_p",
    top_k: "top_k",
    frequency_penalty: "frequency_penalty",
    presence_penalty: "presence_penalty",
    stop: "stop",
    n: "n",
    seed: "seed",
    stream: "stream",
    effort: "reasoning_effort",
  },
  vercel: {
    // OpenAI-compatible gateway
    temperature: "temperature",
    max_tokens: "max_tokens",
    top_p: "top_p",
    top_k: "top_k",
    frequency_penalty: "frequency_penalty",
    presence_penalty: "presence_penalty",
    stop: "stop",
    n: "n",
    seed: "seed",
    stream: "stream",
    effort: "reasoning_effort",
  },
};

/**
 * Validation specs per provider, keyed by provider-specific param name.
 */
export interface ParamSpec {
  type: "number" | "string" | "boolean";
  min?: number;
  max?: number;
  values?: string[];
}

export const PARAM_SPECS: Record<Provider, Record<string, ParamSpec>> = {
  openai: {
    temperature: { type: "number", min: 0, max: 2 },
    max_tokens: { type: "number", min: 1 },
    top_p: { type: "number", min: 0, max: 1 },
    frequency_penalty: { type: "number", min: -2, max: 2 },
    presence_penalty: { type: "number", min: -2, max: 2 },
    stop: { type: "string" },
    n: { type: "number", min: 1 },
    seed: { type: "number" },
    stream: { type: "boolean" },
    reasoning_effort: {
      type: "string",
      values: ["none", "minimal", "low", "medium", "high", "xhigh"],
    },
  },
  anthropic: {
    temperature: { type: "number", min: 0, max: 1 },
    max_tokens: { type: "number", min: 1 },
    top_p: { type: "number", min: 0, max: 1 },
    top_k: { type: "number", min: 0 },
    stop_sequences: { type: "string" },
    stream: { type: "boolean" },
    effort: { type: "string", values: ["low", "medium", "high", "max"] },
    cache_control: { type: "string", values: ["ephemeral"] },
    cache_ttl: { type: "string", values: ["5m", "1h"] },
  },
  google: {
    temperature: { type: "number", min: 0, max: 2 },
    maxOutputTokens: { type: "number", min: 1 },
    topP: { type: "number", min: 0, max: 1 },
    topK: { type: "number", min: 0 },
    frequencyPenalty: { type: "number", min: -2, max: 2 },
    presencePenalty: { type: "number", min: -2, max: 2 },
    stopSequences: { type: "string" },
    candidateCount: { type: "number", min: 1 },
    stream: { type: "boolean" },
    seed: { type: "number" },
    responseMimeType: { type: "string" },
    responseSchema: { type: "string" },
  },
  mistral: {
    temperature: { type: "number", min: 0, max: 1 },
    max_tokens: { type: "number", min: 1 },
    top_p: { type: "number", min: 0, max: 1 },
    frequency_penalty: { type: "number", min: -2, max: 2 },
    presence_penalty: { type: "number", min: -2, max: 2 },
    stop: { type: "string" },
    n: { type: "number", min: 1 },
    random_seed: { type: "number" },
    stream: { type: "boolean" },
    safe_prompt: { type: "boolean" },
    min_tokens: { type: "number", min: 0 },
  },
  cohere: {
    temperature: { type: "number", min: 0, max: 1 },
    max_tokens: { type: "number", min: 1 },
    p: { type: "number", min: 0, max: 1 },
    k: { type: "number", min: 0, max: 500 },
    frequency_penalty: { type: "number", min: 0, max: 1 },
    presence_penalty: { type: "number", min: 0, max: 1 },
    stop_sequences: { type: "string" },
    stream: { type: "boolean" },
    seed: { type: "number" },
  },
  bedrock: {
    // Converse API inferenceConfig params
    temperature: { type: "number", min: 0, max: 1 },
    maxTokens: { type: "number", min: 1 },
    topP: { type: "number", min: 0, max: 1 },
    topK: { type: "number", min: 0 },
    stopSequences: { type: "string" },
    stream: { type: "boolean" },
    cache_control: { type: "string", values: ["ephemeral"] },
    cache_ttl: { type: "string", values: ["5m", "1h"] },
  },
  openrouter: {
    // Loose validation — proxies to many providers with varying ranges
    temperature: { type: "number", min: 0, max: 2 },
    max_tokens: { type: "number", min: 1 },
    top_p: { type: "number", min: 0, max: 1 },
    top_k: { type: "number", min: 0 },
    frequency_penalty: { type: "number", min: -2, max: 2 },
    presence_penalty: { type: "number", min: -2, max: 2 },
    stop: { type: "string" },
    n: { type: "number", min: 1 },
    seed: { type: "number" },
    stream: { type: "boolean" },
    reasoning_effort: {
      type: "string",
      values: ["none", "minimal", "low", "medium", "high", "xhigh"],
    },
  },
  vercel: {
    // Loose validation — proxies to many providers with varying ranges
    temperature: { type: "number", min: 0, max: 2 },
    max_tokens: { type: "number", min: 1 },
    top_p: { type: "number", min: 0, max: 1 },
    top_k: { type: "number", min: 0 },
    frequency_penalty: { type: "number", min: -2, max: 2 },
    presence_penalty: { type: "number", min: -2, max: 2 },
    stop: { type: "string" },
    n: { type: "number", min: 1 },
    seed: { type: "number" },
    stream: { type: "boolean" },
    reasoning_effort: {
      type: "string",
      values: ["none", "minimal", "low", "medium", "high", "xhigh"],
    },
  },
};

/** OpenAI reasoning models don't support standard sampling params. */
export function isReasoningModel(model: string): boolean {
  // Strip gateway prefix: "openai/o3" → "o3"
  const name = model.includes("/") ? model.split("/").pop()! : model;
  return /^o[134]/.test(name);
}

/** Providers that can route to OpenAI models (and need reasoning-model checks). */
export function canHostOpenAIModels(provider: Provider): boolean {
  return provider === "openai" || provider === "openrouter" || provider === "vercel";
}

export const REASONING_MODEL_UNSUPPORTED = new Set([
  "temperature",
  "top_p",
  "frequency_penalty",
  "presence_penalty",
  "n",
]);

/**
 * Bedrock model IDs are prefixed with the vendor name.
 * e.g. "anthropic.claude-sonnet-4-5-20250929-v1:0"
 */
export type BedrockModelFamily =
  | "anthropic"
  | "meta"
  | "amazon"
  | "mistral"
  | "cohere"
  | "ai21";

export function detectBedrockModelFamily(
  model: string,
): BedrockModelFamily | undefined {
  // Handle cross-region inference profiles (e.g. "us.anthropic.claude-sonnet-4-5...")
  // and global inference profiles (e.g. "global.anthropic.claude-sonnet-4-5...")
  const parts = model.split(".");

  // If first part is a region prefix (us, eu, apac) or global, skip it
  let prefix = parts[0];
  if (["us", "eu", "apac", "global"].includes(prefix) && parts.length > 1) {
    prefix = parts[1];
  }

  const families: BedrockModelFamily[] = [
    "anthropic",
    "meta",
    "amazon",
    "mistral",
    "cohere",
    "ai21",
  ];
  return families.find((f) => prefix === f);
}

/** Whether a Bedrock model supports prompt caching (Claude and Nova only). */
export function bedrockSupportsCaching(model: string): boolean {
  const family = detectBedrockModelFamily(model);
  if (family === "anthropic") return true;
  if (family === "amazon" && model.includes("nova")) return true;
  return false;
}

/** Cache value normalization per provider. */
export const CACHE_VALUES: Record<Provider, string | undefined> = {
  openai: undefined, // OpenAI auto-caches; no explicit param
  anthropic: "ephemeral",
  google: undefined, // Google uses explicit caching API, not a param
  mistral: undefined,
  cohere: undefined,
  bedrock: "ephemeral", // Supported for Claude models on Bedrock
  openrouter: undefined, // Depends on underlying provider
  vercel: undefined, // Depends on underlying provider
};

/** Valid cache TTL values per provider. */
export const CACHE_TTLS: Record<Provider, string[] | undefined> = {
  openai: undefined,
  anthropic: ["5m", "1h"],
  google: undefined,
  mistral: undefined,
  cohere: undefined,
  bedrock: ["5m", "1h"], // Claude on Bedrock uses same TTLs as direct Anthropic
  openrouter: undefined,
  vercel: undefined,
};

/** Match a duration expression like "5m", "1h", "30m". */
export const DURATION_RE = /^\d+[mh]$/;

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
