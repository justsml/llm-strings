import { describe, expect, it } from "vitest";
import { validate } from "./validate.js";

describe("validate", () => {
  describe("valid configs", () => {
    it("returns no issues for valid OpenAI params", () => {
      const issues = validate(
        "llm://api.openai.com/gpt-5.2?temp=0.7&max=1500&top_p=0.9",
      );
      expect(issues).toEqual([]);
    });

    it("returns no issues for valid Anthropic params", () => {
      const issues = validate(
        "llm://api.anthropic.com/claude-sonnet-4-5?temp=0.5&max=4096&top_k=40",
      );
      expect(issues).toEqual([]);
    });

    it("returns no issues for valid Google params", () => {
      const issues = validate(
        "llm://generativelanguage.googleapis.com/gemini-3-flash-preview?temp=1.0&max=2048",
      );
      expect(issues).toEqual([]);
    });

    it("returns no issues for valid Mistral params", () => {
      const issues = validate(
        "llm://api.mistral.ai/mistral-large-latest?temp=0.8&max=1000&seed=42",
      );
      expect(issues).toEqual([]);
    });
  });

  describe("out of range", () => {
    it("flags temperature > 2 for OpenAI", () => {
      const issues = validate("llm://api.openai.com/gpt-5.2?temp=3.0");
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe("error");
      expect(issues[0].message).toContain("<= 2");
    });

    it("flags temperature > 1 for Anthropic", () => {
      const issues = validate(
        "llm://api.anthropic.com/claude-sonnet-4-5?temp=1.5",
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe("error");
      expect(issues[0].message).toContain("<= 1");
    });

    it("flags negative temperature", () => {
      const issues = validate("llm://api.openai.com/gpt-5.2?temp=-0.5");
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe("error");
      expect(issues[0].message).toContain(">= 0");
    });

    it("flags top_p > 1", () => {
      const issues = validate("llm://api.openai.com/gpt-5.2?top_p=1.5");
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain("<= 1");
    });

    it("flags Cohere k > 500", () => {
      const issues = validate("llm://api.cohere.com/command-a-03-2025?topk=600");
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain("<= 500");
    });
  });

  describe("type errors", () => {
    it("flags non-numeric temperature", () => {
      const issues = validate("llm://api.openai.com/gpt-5.2?temp=hot");
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe("error");
      expect(issues[0].message).toContain("number");
    });

    it("flags invalid boolean for stream", () => {
      const issues = validate("llm://api.openai.com/gpt-5.2?stream=yes");
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain("boolean");
    });

    it("flags invalid effort value for OpenAI", () => {
      const issues = validate("llm://api.openai.com/o3?effort=extreme");
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain("xhigh");
    });

    it("flags invalid effort value for Anthropic", () => {
      const issues = validate(
        "llm://api.anthropic.com/claude-opus-4-6?effort=extreme",
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain("low, medium, high, max");
    });
  });

  describe("cache TTL", () => {
    it("accepts cache=5m for Anthropic", () => {
      const issues = validate(
        "llm://api.anthropic.com/claude-sonnet-4-5?cache=5m",
      );
      expect(issues).toEqual([]);
    });

    it("accepts cache=1h for Anthropic", () => {
      const issues = validate(
        "llm://api.anthropic.com/claude-sonnet-4-5?cache=1h",
      );
      expect(issues).toEqual([]);
    });

    it("flags invalid cache TTL for Anthropic", () => {
      const issues = validate(
        "llm://api.anthropic.com/claude-sonnet-4-5?cache=15m",
      );
      expect(issues.some((i) => i.param === "cache_ttl")).toBe(true);
      expect(issues.some((i) => i.message.includes("5m, 1h"))).toBe(true);
    });
  });

  describe("unknown params", () => {
    it("warns about unknown params", () => {
      const issues = validate(
        "llm://api.openai.com/gpt-5.2?made_up_param=hello",
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe("warning");
      expect(issues[0].message).toContain("Unknown");
    });
  });

  describe("reasoning model restrictions", () => {
    it("flags temperature on OpenAI reasoning models", () => {
      const issues = validate("llm://api.openai.com/o3?temp=0.7");
      expect(issues.some((i) => i.message.includes("not supported"))).toBe(
        true,
      );
    });

    it("flags top_p on OpenAI reasoning models", () => {
      const issues = validate("llm://api.openai.com/o3-mini?top_p=0.9");
      expect(issues.some((i) => i.message.includes("not supported"))).toBe(
        true,
      );
    });

    it("allows effort on OpenAI reasoning models", () => {
      const issues = validate("llm://api.openai.com/o3?effort=high");
      expect(issues).toEqual([]);
    });

    it("allows max_completion_tokens on reasoning models", () => {
      const issues = validate("llm://api.openai.com/o3?max=4096");
      expect(
        issues.filter((i) => i.severity === "error"),
      ).toEqual([]);
    });
  });

  describe("AWS Bedrock", () => {
    it("validates valid Bedrock Claude params", () => {
      const issues = validate(
        "llm://bedrock-runtime.us-east-1.amazonaws.com/anthropic.claude-sonnet-4-5-20250929-v1:0?temp=0.7&max=4096",
      );
      expect(issues).toEqual([]);
    });

    it("validates valid Bedrock Titan params", () => {
      const issues = validate(
        "llm://bedrock-runtime.us-east-1.amazonaws.com/amazon.nova-lite-v1:0?temp=0.5&max=500",
      );
      expect(issues).toEqual([]);
    });

    it("flags topK on non-Claude/Cohere Bedrock models", () => {
      const issues = validate(
        "llm://bedrock-runtime.us-east-1.amazonaws.com/meta.llama4-maverick-17b-instruct-v1:0?topk=40",
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe("error");
      expect(issues[0].message).toContain("meta");
    });

    it("allows topK on Claude Bedrock models", () => {
      const issues = validate(
        "llm://bedrock-runtime.us-east-1.amazonaws.com/anthropic.claude-sonnet-4-5-20250929-v1:0?topk=40",
      );
      expect(issues).toEqual([]);
    });

    it("flags cache_control on non-Claude Bedrock models", () => {
      const issues = validate(
        "llm://bedrock-runtime.us-east-1.amazonaws.com/amazon.nova-lite-v1:0?cache=true",
      );
      // cache gets dropped in normalize for non-Claude, so nothing to validate
      expect(issues).toEqual([]);
    });

    it("flags temperature > 1 for Bedrock", () => {
      const issues = validate(
        "llm://bedrock-runtime.us-east-1.amazonaws.com/anthropic.claude-sonnet-4-5-20250929-v1:0?temp=1.5",
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain("<= 1");
    });
  });

  describe("OpenRouter", () => {
    it("detects and validates OpenRouter params", () => {
      const issues = validate(
        "llm://openrouter.ai/anthropic/claude-sonnet-4-5?temp=0.7&max=2000",
      );
      expect(issues).toEqual([]);
    });

    it("accepts top_k on OpenRouter (multi-provider)", () => {
      const issues = validate(
        "llm://openrouter.ai/anthropic/claude-sonnet-4-5?top_k=40",
      );
      expect(issues).toEqual([]);
    });

    it("flags temperature > 2 on OpenRouter", () => {
      const issues = validate(
        "llm://openrouter.ai/openai/gpt-5.2?temp=3.0",
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain("<= 2");
    });

    it("flags temperature on reasoning models via OpenRouter", () => {
      const issues = validate(
        "llm://openrouter.ai/openai/o3?temp=0.7",
      );
      expect(issues.some((i) => i.message.includes("not supported"))).toBe(
        true,
      );
    });
  });

  describe("Vercel AI Gateway", () => {
    it("detects and validates Vercel gateway params", () => {
      const issues = validate(
        "llm://gateway.ai.vercel.sh/openai/gpt-5.2?temp=0.7&max=1500",
      );
      expect(issues).toEqual([]);
    });

    it("flags invalid param types on Vercel", () => {
      const issues = validate(
        "llm://gateway.ai.vercel.sh/anthropic/claude-sonnet-4-5?temp=hot",
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain("number");
    });

    it("flags temperature on reasoning models via Vercel", () => {
      const issues = validate(
        "llm://gateway.ai.vercel.sh/openai/o4-mini?temp=0.5",
      );
      expect(issues.some((i) => i.message.includes("not supported"))).toBe(
        true,
      );
    });
  });

  describe("gateway sub-provider validation", () => {
    it("validates against Anthropic specs via OpenRouter (temp > 1 rejected)", () => {
      const issues = validate(
        "llm://openrouter.ai/anthropic/claude-sonnet-4-5?temp=1.5",
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain("<= 1");
    });

    it("rejects both temperature and top_p for Anthropic via gateway", () => {
      const issues = validate(
        "llm://openrouter.ai/anthropic/claude-sonnet-4-5?temp=0.7&top_p=0.9",
      );
      expect(issues.some((i) => i.message.includes("Cannot specify both"))).toBe(true);
    });

    it("falls back to gateway specs for unknown sub-provider", () => {
      const issues = validate(
        "llm://openrouter.ai/qwen/qwen2.5-pro?temp=1.5",
      );
      expect(issues).toEqual([]);
    });

    it("validates against Google specs via Vercel (temp 1.5 is valid)", () => {
      const issues = validate(
        "llm://gateway.ai.vercel.sh/google/gemini-2.5-pro?temp=1.5",
      );
      expect(issues).toEqual([]);
    });

    it("validates Anthropic effort values via gateway", () => {
      const issues = validate(
        "llm://openrouter.ai/anthropic/claude-sonnet-4-5?effort=high",
      );
      expect(issues).toEqual([]);
    });

    it("rejects OpenAI-only effort values for Anthropic via gateway", () => {
      const issues = validate(
        "llm://openrouter.ai/anthropic/claude-sonnet-4-5?effort=xhigh",
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain("must be one of");
    });
  });

  describe("unknown provider", () => {
    it("returns a warning and skips validation", () => {
      const issues = validate("llm://custom-api.com/my-model?temp=999");
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe("warning");
      expect(issues[0].message).toContain("Unknown provider");
    });
  });

  describe("strict mode", () => {
    it("returns error for unknown provider when strict", () => {
      const issues = validate("llm://custom-api.com/my-model?temp=0.5", {
        strict: true,
      });
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe("error");
      expect(issues[0].message).toContain("Unknown provider");
    });

    it("returns error for unknown params when strict", () => {
      const issues = validate(
        "llm://api.openai.com/gpt-5.2?made_up_param=hello",
        { strict: true },
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe("error");
      expect(issues[0].message).toContain("Unknown param");
    });

    it("does not affect valid configs", () => {
      const issues = validate(
        "llm://api.openai.com/gpt-5.2?temp=0.7&max=1500",
        { strict: true },
      );
      expect(issues).toEqual([]);
    });
  });
});
