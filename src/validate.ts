import { parse } from "./parse.js";
import { normalize } from "./normalize.js";
import {
  PARAM_SPECS,
  PROVIDER_PARAMS,
  REASONING_MODEL_UNSUPPORTED,
  bedrockSupportsCaching,
  canHostOpenAIModels,
  detectBedrockModelFamily,
  isReasoningModel,
  type ParamSpec,
  type Provider,
} from "./provider-core.js";

export interface ValidationIssue {
  param: string;
  value: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidateOptions {
  /** Promote warnings (unknown provider, unknown params) to errors. */
  strict?: boolean;
}

/**
 * Build a reverse map from provider-specific param names back to canonical names.
 */
function buildReverseParamMap(
  provider: Provider,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [canonical, specific] of Object.entries(
    PROVIDER_PARAMS[provider],
  )) {
    map[specific] = canonical;
  }
  return map;
}

/**
 * Look up a sub-provider's ParamSpec for a gateway-normalized param name.
 * Maps: gateway param → canonical → sub-provider-specific → spec.
 */
function lookupSubProviderSpec(
  gatewayParamName: string,
  gatewayReverseMap: Record<string, string>,
  subProvider: Provider,
) {
  const canonical = gatewayReverseMap[gatewayParamName] ?? gatewayParamName;
  const subProviderKey = PROVIDER_PARAMS[subProvider]?.[canonical];
  if (!subProviderKey) return { spec: undefined, canonical };
  return { spec: PARAM_SPECS[subProvider]?.[subProviderKey], canonical };
}

/**
 * Build the set of gateway param names that correspond to params the sub-provider supports.
 */
function buildSubProviderKnownParams(
  gateway: Provider,
  subProvider: Provider,
): Set<string> {
  const known = new Set<string>();
  const subProviderCanonicals = new Set(
    Object.keys(PROVIDER_PARAMS[subProvider]),
  );
  for (const [canonical, gatewaySpecific] of Object.entries(
    PROVIDER_PARAMS[gateway],
  )) {
    if (subProviderCanonicals.has(canonical)) {
      known.add(gatewaySpecific);
    }
  }
  return known;
}

/**
 * Validate an LLM connection string.
 *
 * Parses and normalizes the string, then checks params against provider specs.
 * For gateway providers (OpenRouter, Vercel), detects the sub-provider from the
 * model prefix and validates against the sub-provider's rules when known.
 * Returns a list of issues found. An empty array means all params look valid.
 */
export function validate(
  connectionString: string,
  options: ValidateOptions = {},
): ValidationIssue[] {
  const parsed = parse(connectionString);
  const { config, provider, subProvider } = normalize(parsed);
  const issues: ValidationIssue[] = [];

  if (!provider) {
    issues.push({
      param: "host",
      value: config.host,
      message: `Unknown provider for host "${config.host}". Validation skipped.`,
      severity: options.strict ? "error" : "warning",
    });
    return issues;
  }

  // When routing through a gateway to a known sub-provider, validate against
  // the sub-provider's specs. Fall back to the gateway's loose specs otherwise.
  const effectiveProvider = subProvider ?? provider;
  const specs = PARAM_SPECS[effectiveProvider];

  const gatewayReverseMap = subProvider
    ? buildReverseParamMap(provider)
    : undefined;

  const knownParams = subProvider
    ? buildSubProviderKnownParams(provider, subProvider)
    : new Set(Object.values(PROVIDER_PARAMS[provider]));

  for (const [key, value] of Object.entries(config.params)) {
    // Check for OpenAI reasoning model restrictions (direct or via gateway)
    if (
      canHostOpenAIModels(provider) &&
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

      // topK is only supported by Claude, Cohere, and Mistral on Bedrock
      if (
        key === "topK" &&
        family &&
        family !== "anthropic" &&
        family !== "cohere" &&
        family !== "mistral"
      ) {
        issues.push({
          param: key,
          value,
          message: `"topK" is not supported by ${family} models on Bedrock.`,
          severity: "error",
        });
        continue;
      }

      // cache_control is only supported by Claude and Nova on Bedrock
      if (key === "cache_control" && !bedrockSupportsCaching(config.model)) {
        issues.push({
          param: key,
          value,
          message: `Prompt caching is only supported for Anthropic Claude and Amazon Nova models on Bedrock, not ${family ?? "unknown"} models.`,
          severity: "error",
        });
        continue;
      }
    }

    // Check if param is known for this provider (or sub-provider)
    if (!knownParams.has(key) && !specs[key]) {
      issues.push({
        param: key,
        value,
        message: `Unknown param "${key}" for ${effectiveProvider}.`,
        severity: options.strict ? "error" : "warning",
      });
      continue;
    }

    // Look up the spec — for gateways with a sub-provider, map through
    // canonical names to find the sub-provider's spec
    let spec: ParamSpec | undefined = specs[key];
    if (subProvider && gatewayReverseMap && !spec) {
      const result = lookupSubProviderSpec(
        key,
        gatewayReverseMap,
        subProvider,
      );
      spec = result.spec;
    }
    if (!spec) continue;

    // Anthropic (and Bedrock Claude, and Anthropic via gateway) mutual exclusion for temperature/top_p
    if (
      (effectiveProvider === "anthropic" ||
        (provider === "bedrock" &&
          detectBedrockModelFamily(config.model) === "anthropic")) &&
      (key === "temperature" || key === "top_p" || key === "topP")
    ) {
      const otherKey =
        key === "temperature"
          ? provider === "bedrock"
            ? "topP"
            : "top_p"
          : "temperature";
      // Only report error once (on the temperature param) to avoid duplicate errors
      if (key === "temperature" && config.params[otherKey] !== undefined) {
        issues.push({
          param: key,
          value,
          message: `Cannot specify both "temperature" and "${otherKey}" for Anthropic models.`,
          severity: "error",
        });
      }
    }

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
