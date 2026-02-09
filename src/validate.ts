import type { LlmConnectionConfig } from "./index.js";
import {
  PARAM_SPECS,
  PROVIDER_PARAMS,
  REASONING_MODEL_UNSUPPORTED,
  detectBedrockModelFamily,
  detectProvider,
  isReasoningModel,
} from "./providers.js";

export interface ValidationIssue {
  param: string;
  value: string;
  message: string;
  severity: "error" | "warning";
}

/**
 * Validate params in a (preferably already-normalized) config.
 *
 * Returns a list of issues found. An empty array means all params look valid.
 * Call `normalize()` first to expand aliases and map to provider-specific names.
 */
export function validate(config: LlmConnectionConfig): ValidationIssue[] {
  const provider = detectProvider(config.host);
  const issues: ValidationIssue[] = [];

  if (!provider) {
    issues.push({
      param: "host",
      value: config.host,
      message: `Unknown provider for host "${config.host}". Validation skipped.`,
      severity: "warning",
    });
    return issues;
  }

  const specs = PARAM_SPECS[provider];
  const knownParams = new Set(Object.values(PROVIDER_PARAMS[provider]));

  for (const [key, value] of Object.entries(config.params)) {
    // Check for OpenAI reasoning model restrictions
    if (
      provider === "openai" &&
      isReasoningModel(config.model) &&
      REASONING_MODEL_UNSUPPORTED.has(key)
    ) {
      issues.push({
        param: key,
        value,
        message: `"${key}" is not supported by OpenAI reasoning model "${config.model}". Use "reasoning_effort" instead of temperature for controlling output.`,
        severity: "error",
      });
      continue;
    }

    // Bedrock model-family-specific checks
    if (provider === "bedrock") {
      const family = detectBedrockModelFamily(config.model);

      // topK is only supported by Claude and Cohere on Bedrock
      if (key === "topK" && family && family !== "anthropic" && family !== "cohere") {
        issues.push({
          param: key,
          value,
          message: `"topK" is not supported by ${family} models on Bedrock.`,
          severity: "error",
        });
        continue;
      }

      // cache_control is only supported by Claude on Bedrock
      if (key === "cache_control" && family !== "anthropic") {
        issues.push({
          param: key,
          value,
          message: `Prompt caching is only supported for Anthropic Claude models on Bedrock, not ${family ?? "unknown"} models.`,
          severity: "error",
        });
        continue;
      }
    }

    // Check if param is known for this provider
    if (!knownParams.has(key) && !specs[key]) {
      issues.push({
        param: key,
        value,
        message: `Unknown param "${key}" for ${provider}.`,
        severity: "warning",
      });
      continue;
    }

    // Validate against spec
    const spec = specs[key];
    if (!spec) continue;

    if (spec.type === "number") {
      const num = Number(value);
      if (isNaN(num)) {
        issues.push({
          param: key,
          value,
          message: `"${key}" should be a number, got "${value}".`,
          severity: "error",
        });
        continue;
      }
      if (spec.min !== undefined && num < spec.min) {
        issues.push({
          param: key,
          value,
          message: `"${key}" must be >= ${spec.min}, got ${num}.`,
          severity: "error",
        });
      }
      if (spec.max !== undefined && num > spec.max) {
        issues.push({
          param: key,
          value,
          message: `"${key}" must be <= ${spec.max}, got ${num}.`,
          severity: "error",
        });
      }
    }

    if (spec.type === "boolean") {
      if (!["true", "false", "0", "1"].includes(value)) {
        issues.push({
          param: key,
          value,
          message: `"${key}" should be a boolean (true/false), got "${value}".`,
          severity: "error",
        });
      }
    }

    if (spec.type === "string" && spec.values) {
      if (!spec.values.includes(value)) {
        issues.push({
          param: key,
          value,
          message: `"${key}" must be one of [${spec.values.join(", ")}], got "${value}".`,
          severity: "error",
        });
      }
    }
  }

  return issues;
}
