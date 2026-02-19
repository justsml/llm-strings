import { describe, expect, it } from "vitest";
import {
  PROVIDER_META,
  MODELS,
  CANONICAL_PARAM_SPECS,
  PARAM_SPECS,
  PROVIDER_PARAMS,
  detectProvider,
  detectGatewaySubProvider,
  isGatewayProvider,
} from "./providers.js";
import type { Provider } from "./providers.js";

const ALL_PROVIDERS: Provider[] = [
  "openai",
  "anthropic",
  "google",
  "mistral",
  "cohere",
  "bedrock",
  "openrouter",
  "vercel",
];

describe("PROVIDER_META", () => {
  it("has an entry for every provider", () => {
    const ids = PROVIDER_META.map((m) => m.id);
    for (const p of ALL_PROVIDERS) {
      expect(ids).toContain(p);
    }
  });

  it("each entry has required fields", () => {
    for (const meta of PROVIDER_META) {
      expect(meta.id).toBeTruthy();
      expect(meta.name).toBeTruthy();
      expect(meta.host).toBeTruthy();
      expect(meta.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("hosts are detectable by detectProvider", () => {
    for (const meta of PROVIDER_META) {
      expect(detectProvider(meta.host)).toBe(meta.id);
    }
  });
});

describe("MODELS", () => {
  it("has entries for every provider", () => {
    for (const p of ALL_PROVIDERS) {
      expect(MODELS[p]).toBeDefined();
      expect(MODELS[p].length).toBeGreaterThan(0);
    }
  });
});

describe("CANONICAL_PARAM_SPECS", () => {
  it("has entries for every provider", () => {
    for (const p of ALL_PROVIDERS) {
      expect(CANONICAL_PARAM_SPECS[p]).toBeDefined();
    }
  });

  it("canonical keys match PROVIDER_PARAMS keys", () => {
    for (const p of ALL_PROVIDERS) {
      const canonicalKeys = Object.keys(CANONICAL_PARAM_SPECS[p]);
      const providerCanonicalKeys = Object.keys(PROVIDER_PARAMS[p]);
      for (const key of canonicalKeys) {
        expect(
          providerCanonicalKeys,
          `${p}: canonical key "${key}" missing from PROVIDER_PARAMS`,
        ).toContain(key);
      }
    }
  });

  it("each spec has type and description", () => {
    for (const p of ALL_PROVIDERS) {
      for (const [name, spec] of Object.entries(CANONICAL_PARAM_SPECS[p])) {
        expect(spec.type, `${p}.${name} missing type`).toBeTruthy();
        expect(
          spec.description,
          `${p}.${name} missing description`,
        ).toBeTruthy();
      }
    }
  });

  it("enum specs have values array", () => {
    for (const p of ALL_PROVIDERS) {
      for (const [name, spec] of Object.entries(CANONICAL_PARAM_SPECS[p])) {
        if (spec.type === "enum") {
          expect(
            spec.values,
            `${p}.${name} is enum but has no values`,
          ).toBeDefined();
          expect(spec.values!.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("number ranges match PARAM_SPECS ranges", () => {
    for (const p of ALL_PROVIDERS) {
      for (const [canonicalName, cSpec] of Object.entries(
        CANONICAL_PARAM_SPECS[p],
      )) {
        if (cSpec.type !== "number") continue;
        const providerName = PROVIDER_PARAMS[p][canonicalName];
        if (!providerName) continue;
        const pSpec = PARAM_SPECS[p][providerName];
        if (!pSpec) continue;
        if (cSpec.min !== undefined) {
          expect(
            cSpec.min,
            `${p}.${canonicalName} min mismatch`,
          ).toBe(pSpec.min);
        }
        if (cSpec.max !== undefined) {
          expect(
            cSpec.max,
            `${p}.${canonicalName} max mismatch`,
          ).toBe(pSpec.max);
        }
      }
    }
  });
});

describe("PARAM_SPECS defaults and descriptions", () => {
  it("every spec has a description", () => {
    for (const p of ALL_PROVIDERS) {
      for (const [name, spec] of Object.entries(PARAM_SPECS[p])) {
        expect(
          spec.description,
          `${p}.${name} missing description`,
        ).toBeTruthy();
      }
    }
  });
});

describe("isGatewayProvider", () => {
  it("returns true for openrouter and vercel", () => {
    expect(isGatewayProvider("openrouter")).toBe(true);
    expect(isGatewayProvider("vercel")).toBe(true);
  });

  it("returns false for direct providers", () => {
    expect(isGatewayProvider("openai")).toBe(false);
    expect(isGatewayProvider("anthropic")).toBe(false);
    expect(isGatewayProvider("google")).toBe(false);
    expect(isGatewayProvider("bedrock")).toBe(false);
  });
});

describe("detectGatewaySubProvider", () => {
  it("detects known sub-providers from model prefix", () => {
    expect(detectGatewaySubProvider("openai/gpt-5.2")).toBe("openai");
    expect(detectGatewaySubProvider("anthropic/claude-sonnet-4-5")).toBe("anthropic");
    expect(detectGatewaySubProvider("google/gemini-2.5-pro")).toBe("google");
    expect(detectGatewaySubProvider("mistral/mistral-large-latest")).toBe("mistral");
    expect(detectGatewaySubProvider("cohere/command-r-plus")).toBe("cohere");
  });

  it("returns undefined for unknown sub-providers", () => {
    expect(detectGatewaySubProvider("qwen/qwen2.5-pro")).toBeUndefined();
    expect(detectGatewaySubProvider("deepseek/deepseek-v3")).toBeUndefined();
  });

  it("returns undefined for models without a slash", () => {
    expect(detectGatewaySubProvider("gpt-5.2")).toBeUndefined();
    expect(detectGatewaySubProvider("claude-sonnet-4-5")).toBeUndefined();
  });

  it("does not match gateways as sub-providers", () => {
    expect(detectGatewaySubProvider("openrouter/some-model")).toBeUndefined();
    expect(detectGatewaySubProvider("vercel/some-model")).toBeUndefined();
    expect(detectGatewaySubProvider("bedrock/some-model")).toBeUndefined();
  });
});
