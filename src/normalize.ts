import type { LlmConnectionConfig } from "./index.js";
import {
  ALIASES,
  CACHE_VALUES,
  PROVIDER_PARAMS,
  detectProvider,
  isReasoningModel,
  type Provider,
} from "./providers.js";

export interface NormalizeChange {
  from: string;
  to: string;
  value: string;
  reason: string;
}

export interface NormalizeResult {
  config: LlmConnectionConfig;
  provider: Provider | undefined;
  changes: NormalizeChange[];
}

export interface NormalizeOptions {
  /** Include detailed change log in the result. */
  verbose?: boolean;
}

/**
 * Normalize an LLM connection config's params for its target provider.
 *
 * 1. Expands shorthand aliases (e.g. `temp` → `temperature`)
 * 2. Maps canonical param names to provider-specific names
 *    (e.g. `max_tokens` → `maxOutputTokens` for Google)
 * 3. Normalizes special values (e.g. `cache=true` → `cache_control=ephemeral` for Anthropic)
 * 4. For OpenAI reasoning models, remaps `max_tokens` → `max_completion_tokens`
 *    and warns about unsupported sampling params
 */
export function normalize(
  config: LlmConnectionConfig,
  options: NormalizeOptions = {},
): NormalizeResult {
  const provider = detectProvider(config.host);
  const changes: NormalizeChange[] = [];
  const params: Record<string, string> = {};

  for (const [rawKey, value] of Object.entries(config.params)) {
    let key = rawKey;

    // Step 1: Expand aliases to canonical name
    if (ALIASES[key]) {
      const canonical = ALIASES[key];
      if (options.verbose) {
        changes.push({
          from: key,
          to: canonical,
          value,
          reason: `alias: "${key}" → "${canonical}"`,
        });
      }
      key = canonical;
    }

    // Step 2: Handle special "cache" param
    if (key === "cache" && provider) {
      const cacheValue = CACHE_VALUES[provider];
      if (
        cacheValue &&
        (value === "true" || value === "1" || value === "yes")
      ) {
        const providerKey =
          PROVIDER_PARAMS[provider]?.["cache"] ?? "cache";
        if (options.verbose) {
          changes.push({
            from: "cache",
            to: providerKey,
            value: cacheValue,
            reason: `cache=true → ${providerKey}=${cacheValue} for ${provider}`,
          });
        }
        params[providerKey] = cacheValue;
        continue;
      }
      // Provider doesn't support cache param — drop it with a note
      if (!cacheValue) {
        if (options.verbose) {
          changes.push({
            from: "cache",
            to: "(dropped)",
            value,
            reason: `${provider} does not use a cache param (caching is automatic or API-level)`,
          });
        }
        continue;
      }
    }

    // Step 3: Map canonical → provider-specific param name
    if (provider && PROVIDER_PARAMS[provider]) {
      const providerKey = PROVIDER_PARAMS[provider][key];
      if (providerKey && providerKey !== key) {
        if (options.verbose) {
          changes.push({
            from: key,
            to: providerKey,
            value,
            reason: `${provider} uses "${providerKey}" instead of "${key}"`,
          });
        }
        key = providerKey;
      }
    }

    // Step 4: OpenAI reasoning model adjustments
    if (
      provider === "openai" &&
      isReasoningModel(config.model) &&
      key === "max_tokens"
    ) {
      if (options.verbose) {
        changes.push({
          from: "max_tokens",
          to: "max_completion_tokens",
          value,
          reason:
            "OpenAI reasoning models use max_completion_tokens instead of max_tokens",
        });
      }
      key = "max_completion_tokens";
    }

    params[key] = value;
  }

  return {
    config: { ...config, params },
    provider,
    changes,
  };
}
