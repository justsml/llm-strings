import { resolveHostAlias } from "./host-alias.js";
import type { HostAlias } from "./host-alias.js";

export interface LlmConnectionConfig {
  /** The original connection string */
  raw: string;
  /** Provider's API host (e.g. "api.openai.com") */
  host: string;
  /** Short provider alias that was expanded to host, if any. */
  hostAlias?: HostAlias;
  /** Model name (e.g. "gpt-6-astra") */
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
 * parse("llm://api.openai.com/gpt-6-astra?effort=medium&max_tokens=1500")
 * parse("llm://app-name:sk-ant-123456@api.anthropic.com/claude-sonnet-5?cache=5m")
 * ```
 */
export function parse(connectionString: string): LlmConnectionConfig {
  const url = new URL(connectionString);

  if (url.protocol !== "llm:") {
    throw new Error(
      `Invalid scheme: expected "llm://", got "${url.protocol}//"`,
    );
  }

  const { host, alias: hostAlias } = resolveHostAlias(url.host);
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
    hostAlias,
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
  const { host } = resolveHostAlias(config.host);
  const auth =
    config.label || config.apiKey
      ? `${config.label ?? ""}${config.apiKey ? `:${config.apiKey}` : ""}@`
      : "";

  const query = new URLSearchParams(config.params).toString();
  const qs = query ? `?${query}` : "";

  return `llm://${auth}${host}/${config.model}${qs}`;
}
