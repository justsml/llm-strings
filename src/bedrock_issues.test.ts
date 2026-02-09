
import { describe, it, expect } from "vitest";
import { normalize } from "./normalize.js";
import { detectBedrockModelFamily } from "./providers.js";

describe("Bedrock Inference Profiles", () => {
  it("should detect family for standard model IDs", () => {
    expect(detectBedrockModelFamily("anthropic.claude-3-5-sonnet-20241022-v2:0")).toBe("anthropic");
    expect(detectBedrockModelFamily("amazon.nova-pro-v1:0")).toBe("amazon");
  });

  it("should detect family for cross-region inference profiles", () => {
    // Current implementation fails here because it splits by '.' and takes the first part ('us')
    expect(detectBedrockModelFamily("us.anthropic.claude-3-5-sonnet-20241022-v2:0")).toBe("anthropic");
    expect(detectBedrockModelFamily("eu.anthropic.claude-3-5-sonnet-20241022-v2:0")).toBe("anthropic");
    expect(detectBedrockModelFamily("global.anthropic.claude-3-5-sonnet-20241022-v2:0")).toBe("anthropic");
  });

  it("should preserve cache for cross-region Bedrock Anthropic models", () => {
    const config = {
      raw: "llm://bedrock/us.anthropic.claude-3-5-sonnet-20241022-v2:0?cache=true",
      host: "bedrock",
      model: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
      params: { cache: "true" },
    };
    const result = normalize(config);
    // Currently fails because family detection fails, so it drops the cache param
    expect(result.config.params.cache_control).toBe("ephemeral");
  });
});

describe("Bedrock Nova Caching", () => {
  it("should support caching for Amazon Nova models", () => {
    const config = {
      raw: "llm://bedrock/amazon.nova-pro-v1:0?cache=true",
      host: "bedrock",
      model: "amazon.nova-pro-v1:0",
      params: { cache: "true" },
    };
    const result = normalize(config);
    // Currently fails because normalize.ts only checks for "anthropic" family
    expect(result.config.params.cache_control).toBe("ephemeral");
  });
});
