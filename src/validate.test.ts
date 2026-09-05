import { describe, expect, it } from "vitest";
import { validate } from "./validate.js";

describe("validate", () => {
  it("applies current GPT-6 Astra reasoning effort levels", () => {
    expect(validate("llm://openai/gpt-6-astra?effort=low")).toEqual([]);
    expect(validate("llm://openai/gpt-6-astra?effort=none")).toEqual([
      expect.objectContaining({ param: "reasoning_effort", severity: "error" }),
    ]);
  });

  it("rejects minimal thinking for Gemini 3.8 Flash", () => {
    expect(validate("llm://google/gemini-3.8-flash?effort=medium")).toEqual([]);
    expect(validate("llm://google/gemini-3.8-flash?effort=minimal")).toEqual([
      expect.objectContaining({ param: "thinkingLevel", severity: "error" }),
    ]);
  });

  it("validates structured OpenAI-compatible arguments as JSON", () => {
    expect(
      validate(
        "llm://openrouter/openai/gpt-5.6-sol?response_format=%7B%22type%22%3A%22json_object%22%7D",
      ),
    ).toEqual([]);
    expect(
      validate("llm://openai/gpt-5.6-sol?response_format=not-json"),
    ).toEqual([
      expect.objectContaining({
        param: "response_format",
        severity: "error",
        message: '"response_format" should be valid JSON.',
      }),
    ]);
  });

  describe("valid configs", () => {
    it("returns no issues for valid OpenAI reasoning params", () => {
      const issues = validate(
        "llm://api.openai.com/gpt-5.6-sol?max=1500&effort=medium",
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
        "llm://generativelanguage.googleapis.com/gemini-3.5-flash?temp=1.0&max=2048",
      );
      expect(issues).toEqual([]);
    });

    it("returns no issues for valid Mistral params", () => {
      const issues = validate(
        "llm://api.mistral.ai/mistral-large-latest?temp=0.8&max=1000&seed=42",
      );
      expect(issues).toEqual([]);
    });

    it("returns no issues for bare future model connection strings", () => {
      for (const raw of [
        "llm://openai/gpt-7",
        "llm://anthropic/sonnet-6.5",
        "llm://anthropic/fable-6.1",
      ]) {
        expect(validate(raw), raw).toEqual([]);
      }
    });

    it("returns no issues for params on future model names", () => {
      for (const raw of [
        "llm://openai/gpt-7?temp=0.7&max=4096",
        "llm://anthropic/sonnet-6.5?temp=0.5&max=4096&top_k=40",
        "llm://anthropic/fable-6.1?temp=0.5&max=4096&top_k=40",
      ]) {
        expect(validate(raw), raw).toEqual([]);
      }
    });
  });

  describe("out of range", () => {
    it("flags temperature > 2 for Google", () => {
      const issues = validate("llm://google/gemini-3.5-flash?temp=3.0");
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
      const issues = validate("llm://google/gemini-3.5-flash?temp=-0.5");
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe("error");
      expect(issues[0].message).toContain(">= 0");
    });

    it("flags top_p > 1", () => {
      const issues = validate("llm://google/gemini-3.5-flash?top_p=1.5");
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain("<= 1");
    });

    it("flags Cohere k > 500", () => {
      const issues = validate(
        "llm://api.cohere.com/command-a-03-2025?topk=600",
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain("<= 500");
    });
  });

  describe("type errors", () => {
    it("flags non-numeric temperature", () => {
      const issues = validate("llm://google/gemini-3.5-flash?temp=hot");
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe("error");
      expect(issues[0].message).toContain("number");
    });

    it("flags invalid boolean for stream", () => {
      const issues = validate("llm://api.openai.com/gpt-5.5?stream=yes");
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
      expect(issues[0].message).toContain("low, medium, high, xhigh, max");
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
    it("allows unknown params by default", () => {
      const issues = validate(
        "llm://api.openai.com/gpt-5.5?made_up_param=hello",
      );
      expect(issues).toEqual([]);
    });
  });

  describe("reasoning model restrictions", () => {
    it("allows temperature to be normalized away on OpenAI reasoning models", () => {
      const issues = validate("llm://api.openai.com/o3?temp=0.7");
      expect(issues).toEqual([]);
    });

    it("allows top_p to be normalized away on OpenAI reasoning models", () => {
      const issues = validate("llm://api.openai.com/o3-mini?top_p=0.9");
      expect(issues).toEqual([]);
    });

    it("uses fuzzy GPT-5 family matching for reasoning restrictions", () => {
      const issues = validate("llm://api.openai.com/gpt-5.12-preview?temp=0.7");
      expect(issues).toEqual([]);
    });

    it("allows effort on OpenAI reasoning models", () => {
      const issues = validate("llm://api.openai.com/o3?effort=high");
      expect(issues).toEqual([]);
    });

    it("allows max_completion_tokens on reasoning models", () => {
      const issues = validate("llm://api.openai.com/o3?max=4096");
      expect(issues.filter((i) => i.severity === "error")).toEqual([]);
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

    it("flags temperature > 2 on OpenRouter for a non-OpenAI route", () => {
      const issues = validate(
        "llm://openrouter.ai/google/gemini-3.5-flash?temp=3.0",
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain("<= 2");
    });

    it("allows temperature to be normalized away on reasoning models via OpenRouter", () => {
      const issues = validate("llm://openrouter.ai/openai/o3?temp=0.7");
      expect(issues).toEqual([]);
    });

    it("uses fuzzy reasoning matching for suffixed OpenRouter model versions", () => {
      const issues = validate(
        "llm://openrouter.ai/OpenAI/GPT-5-20260703-preview?temp=0.7&max=4096",
      );
      expect(issues).toEqual([]);
    });

    it("accepts OpenRouter routing and transform params", () => {
      const issues = validate(
        "llm://openrouter.ai/openai/gpt-5.6-sol?provider.order=openai,anthropic&provider.allow_fallbacks=false&transforms=middle-out&plugins=context-compression",
      );
      expect(issues).toEqual([]);
    });
  });

  describe("Vercel AI Gateway", () => {
    it("detects and validates Vercel gateway params", () => {
      const issues = validate(
        "llm://vercel/openai/gpt-5.6-sol?temp=0.7&max=1500",
      );
      expect(issues).toEqual([]);
    });

    it("accepts Vercel gateway provider options", () => {
      const issues = validate(
        "llm://gateway.ai.vercel.sh/anthropic/claude-sonnet-4?order=vertex,anthropic&sort=ttft&caching=auto&tags=chat,v2",
      );
      expect(issues).toEqual([]);
    });

    it("flags invalid Vercel gateway provider option values", () => {
      const issues = validate(
        "llm://gateway.ai.vercel.sh/anthropic/claude-sonnet-4?sort=latency&caching=manual",
      );
      expect(issues).toHaveLength(2);
      expect(issues.every((i) => i.message.includes("must be one of"))).toBe(
        true,
      );
    });

    it("flags invalid param types on Vercel", () => {
      const issues = validate(
        "llm://gateway.ai.vercel.sh/anthropic/claude-sonnet-4-5?temp=hot",
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain("number");
    });

    it("allows temperature to be normalized away on reasoning models via Vercel", () => {
      const issues = validate(
        "llm://gateway.ai.vercel.sh/openai/o4-mini?temp=0.5",
      );
      expect(issues).toEqual([]);
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
      expect(
        issues.some((i) => i.message.includes("Cannot specify both")),
      ).toBe(true);
    });

    it("falls back to gateway specs for unknown sub-provider", () => {
      const issues = validate("llm://openrouter.ai/qwen/qwen2.5-pro?temp=1.5");
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

    it("rejects unknown effort values for Anthropic via gateway", () => {
      const issues = validate(
        "llm://openrouter.ai/anthropic/claude-sonnet-4-5?effort=extreme",
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain("must be one of");
    });
  });

  describe("flexible media provider params", () => {
    it("accepts common fal params and passes unknown model inputs by default", () => {
      const issues = validate(
        "llm://fal/fal-ai/flux-pro?image_size=square_hd&num_images=2&model_specific=ok",
      );
      expect(issues).toEqual([]);
    });

    it("uses strict mode to catch unknown media provider params", () => {
      const issues = validate("llm://fal/fal-ai/flux-pro?image_szie=square", {
        strict: true,
      });
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain("Unknown param");
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
        "llm://api.openai.com/gpt-5.5?made_up_param=hello",
        { strict: true },
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe("error");
      expect(issues[0].message).toContain("Unknown param");
    });

    it("does not affect valid configs", () => {
      const issues = validate(
        "llm://api.openai.com/gpt-5.6-sol?max=1500&effort=medium",
        {
          strict: true,
        },
      );
      expect(issues).toEqual([]);
    });
  });
});
