export type Provider =
  | "openai"
  | "anthropic"
  | "google"
  | "mistral"
  | "cohere";

export function detectProvider(host: string): Provider | undefined {
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
      values: ["low", "medium", "high"],
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
};

/** OpenAI reasoning models don't support standard sampling params. */
export function isReasoningModel(model: string): boolean {
  return /^o[134]/.test(model);
}

export const REASONING_MODEL_UNSUPPORTED = new Set([
  "temperature",
  "top_p",
  "frequency_penalty",
  "presence_penalty",
  "n",
]);

/** Cache value normalization per provider. */
export const CACHE_VALUES: Record<Provider, string | undefined> = {
  openai: undefined, // OpenAI auto-caches; no explicit param
  anthropic: "ephemeral",
  google: undefined, // Google uses explicit caching API, not a param
  mistral: undefined,
  cohere: undefined,
};
