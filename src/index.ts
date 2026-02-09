export interface LlmConnectionConfig {
  /** The original connection string */
  raw: string;
  /** Provider's API base URL (e.g. "api.openai.com") */
  host: string;
  /** Model name (e.g. "gpt-5.2") */
  model: string;
  /** Optional label or app name */
  label?: string;
  /** Optional API key or password */
  apiKey?: string;
  /** Additional config parameters (temp, max_tokens, etc.) */
  params: Record<string, string>;
}

/**
 * Parse an LLM connection string into its component parts.
 *
 * Format: `llm://[label[:apiKey]@]host/model[?key=value&...]`
 *
 * @example
 * ```ts
 * parse("llm://api.openai.com/gpt-5.2?temp=0.7&max_tokens=1500")
 * parse("llm://app-name:sk-proj-123456@api.openai.com/gpt-5.2?temp=0.7")
 * ```
 */
export function parse(connectionString: string): LlmConnectionConfig {
  const url = new URL(connectionString);

  if (url.protocol !== "llm:") {
    throw new Error(
      `Invalid scheme: expected "llm://", got "${url.protocol}//"`,
    );
  }

  const host = url.hostname;
  const model = url.pathname.replace(/^\//, "");
  const label = url.username || undefined;
  const apiKey = url.password || undefined;

  const params: Record<string, string> = {};
  for (const [key, value] of url.searchParams) {
    params[key] = value;
  }

  return {
    raw: connectionString,
    host,
    model,
    label,
    apiKey,
    params,
  };
}

/**
 * Build an LLM connection string from a config object.
 */
export function build(config: Omit<LlmConnectionConfig, "raw">): string {
  const auth =
    config.label || config.apiKey
      ? `${config.label ?? ""}${config.apiKey ? `:${config.apiKey}` : ""}@`
      : "";

  const query = new URLSearchParams(config.params).toString();
  const qs = query ? `?${query}` : "";

  return `llm://${auth}${config.host}/${config.model}${qs}`;
}

export { normalize } from "./normalize.js";
export type { NormalizeChange, NormalizeOptions, NormalizeResult } from "./normalize.js";

export { validate } from "./validate.js";
export type { ValidationIssue } from "./validate.js";

export { detectProvider, detectBedrockModelFamily, ALIASES, PROVIDER_PARAMS } from "./providers.js";
export type { Provider, BedrockModelFamily } from "./providers.js";
