import { describe, expect, it } from "vitest";
import { normalize } from "./normalize.js";
import { parse } from "./index.js";

describe("normalize", () => {
  describe("alias expansion", () => {
    it("expands temp → temperature", () => {
      const config = parse("llm://api.openai.com/gpt-5.2?temp=0.7");
      const { config: result } = normalize(config);
      expect(result.params).toEqual({ temperature: "0.7" });
    });

    it("expands max → max_tokens for OpenAI", () => {
      const config = parse("llm://api.openai.com/gpt-5.2?max=1500");
      const { config: result } = normalize(config);
      expect(result.params).toEqual({ max_tokens: "1500" });
    });

    it("expands multiple aliases at once", () => {
      const config = parse(
        "llm://api.openai.com/gpt-5.2?temp=0.7&max=1500&topp=0.9",
      );
      const { config: result } = normalize(config);
      expect(result.params).toEqual({
        temperature: "0.7",
        max_tokens: "1500",
        top_p: "0.9",
      });
    });

    it("expands freq_penalty and pres_penalty", () => {
      const config = parse(
        "llm://api.openai.com/gpt-5.2?freq_penalty=0.5&pres_penalty=0.3",
      );
      const { config: result } = normalize(config);
      expect(result.params).toEqual({
        frequency_penalty: "0.5",
        presence_penalty: "0.3",
      });
    });
  });

  describe("provider-specific mapping", () => {
    it("maps max_tokens → maxOutputTokens for Google", () => {
      const config = parse(
        "llm://generativelanguage.googleapis.com/gemini-3-flash-preview?max=1500&top_p=0.9",
      );
      const { config: result, provider } = normalize(config);
      expect(provider).toBe("google");
      expect(result.params).toEqual({
        maxOutputTokens: "1500",
        topP: "0.9",
      });
    });

    it("maps top_p → p and top_k → k for Cohere", () => {
      const config = parse(
        "llm://api.cohere.com/command-a-03-2025?top_p=0.9&top_k=40",
      );
      const { config: result, provider } = normalize(config);
      expect(provider).toBe("cohere");
      expect(result.params).toEqual({ p: "0.9", k: "40" });
    });

    it("maps stop → stop_sequences for Anthropic", () => {
      const config = parse(
        "llm://api.anthropic.com/claude-sonnet-4-5?stop=END",
      );
      const { config: result } = normalize(config);
      expect(result.params).toEqual({ stop_sequences: "END" });
    });

    it("maps seed → random_seed for Mistral", () => {
      const config = parse("llm://api.mistral.ai/mistral-large-latest?seed=42");
      const { config: result } = normalize(config);
      expect(result.params).toEqual({ random_seed: "42" });
    });

    it("maps effort → reasoning_effort for OpenAI", () => {
      const config = parse("llm://api.openai.com/o3?effort=high");
      const { config: result } = normalize(config);
      expect(result.params).toHaveProperty("reasoning_effort", "high");
    });

    it("keeps effort as effort for Anthropic", () => {
      const config = parse(
        "llm://api.anthropic.com/claude-opus-4-6?effort=high",
      );
      const { config: result } = normalize(config);
      expect(result.params).toEqual({ effort: "high" });
    });
    it("resolves reasoning_effort as effort for Anthropic", () => {
      const config = parse(
        "llm://api.anthropic.com/claude-opus-4-6?reasoning_effort=high",
      );
      const { config: result } = normalize(config);
      expect(result.params).toEqual({ effort: "high" });
    });
  });

  describe("cache normalization", () => {
    it("maps cache=true → cache_control=ephemeral for Anthropic", () => {
      const config = parse(
        "llm://api.anthropic.com/claude-sonnet-4-5?cache=true",
      );
      const { config: result } = normalize(config);
      expect(result.params).toEqual({ cache_control: "ephemeral" });
    });

    it("maps cache=5m → cache_control=ephemeral + cache_ttl=5m for Anthropic", () => {
      const config = parse(
        "llm://api.anthropic.com/claude-sonnet-4-5?cache=5m",
      );
      const { config: result } = normalize(config);
      expect(result.params).toEqual({
        cache_control: "ephemeral",
        cache_ttl: "5m",
      });
    });

    it("maps cache=1h → cache_control=ephemeral + cache_ttl=1h for Anthropic", () => {
      const config = parse(
        "llm://api.anthropic.com/claude-sonnet-4-5?cache=1h",
      );
      const { config: result } = normalize(config);
      expect(result.params).toEqual({
        cache_control: "ephemeral",
        cache_ttl: "1h",
      });
    });

    it("maps cache=1h for Claude on Bedrock", () => {
      const config = parse(
        "llm://bedrock-runtime.us-east-1.amazonaws.com/anthropic.claude-sonnet-4-5-20250929-v1:0?cache=1h",
      );
      const { config: result } = normalize(config);
      expect(result.params).toEqual({
        cache_control: "ephemeral",
        cache_ttl: "1h",
      });
    });

    it("drops cache param for providers without explicit caching", () => {
      const config = parse("llm://api.openai.com/gpt-5.2?cache=true");
      const { config: result } = normalize(config);
      expect(result.params).toEqual({});
    });
  });

  describe("OpenAI reasoning models", () => {
    it("remaps max_tokens → max_completion_tokens for o3", () => {
      const config = parse("llm://api.openai.com/o3?max=4096");
      const { config: result } = normalize(config);
      expect(result.params).toEqual({ max_completion_tokens: "4096" });
    });

    it("remaps max_tokens → max_completion_tokens for o4-mini", () => {
      const config = parse("llm://api.openai.com/o4-mini?max=2048");
      const { config: result } = normalize(config);
      expect(result.params).toEqual({ max_completion_tokens: "2048" });
    });
  });

  describe("AWS Bedrock", () => {
    it("detects bedrock from amazonaws.com host", () => {
      const config = parse(
        "llm://bedrock-runtime.us-east-1.amazonaws.com/anthropic.claude-sonnet-4-5-20250929-v1:0",
      );
      expect(normalize(config).provider).toBe("bedrock");
    });

    it("maps max_tokens → maxTokens for Bedrock Converse API", () => {
      const config = parse(
        "llm://bedrock-runtime.us-east-1.amazonaws.com/anthropic.claude-sonnet-4-5-20250929-v1:0?max=4096",
      );
      const { config: result } = normalize(config);
      expect(result.params).toEqual({ maxTokens: "4096" });
    });

    it("maps top_p → topP and stop → stopSequences", () => {
      const config = parse(
        "llm://bedrock-runtime.us-west-2.amazonaws.com/meta.llama4-maverick-17b-instruct-v1:0?top_p=0.9&stop=END",
      );
      const { config: result } = normalize(config);
      expect(result.params).toEqual({ topP: "0.9", stopSequences: "END" });
    });

    it("maps top_k → topK for Claude on Bedrock", () => {
      const config = parse(
        "llm://bedrock-runtime.us-east-1.amazonaws.com/anthropic.claude-sonnet-4-5-20250929-v1:0?topk=40",
      );
      const { config: result } = normalize(config);
      expect(result.params).toEqual({ topK: "40" });
    });

    it("maps cache=true → cache_control=ephemeral for Claude on Bedrock", () => {
      const config = parse(
        "llm://bedrock-runtime.us-east-1.amazonaws.com/anthropic.claude-sonnet-4-5-20250929-v1:0?cache=true",
      );
      const { config: result } = normalize(config);
      expect(result.params).toEqual({ cache_control: "ephemeral" });
    });

    it("drops cache for non-Claude models on Bedrock", () => {
      const config = parse(
        "llm://bedrock-runtime.us-east-1.amazonaws.com/meta.llama4-maverick-17b-instruct-v1:0?cache=true",
      );
      const { config: result } = normalize(config);
      expect(result.params).toEqual({});
    });

    it("normalizes a full Bedrock connection string", () => {
      const config = parse(
        "llm://bedrock-runtime.us-east-1.amazonaws.com/amazon.nova-lite-v1:0?temp=0.5&max=500&top_p=0.9",
      );
      const { config: result, provider } = normalize(config);
      expect(provider).toBe("bedrock");
      expect(result.params).toEqual({
        temperature: "0.5",
        maxTokens: "500",
        topP: "0.9",
      });
    });
  });

  describe("OpenRouter", () => {
    it("detects openrouter and uses OpenAI-compatible params", () => {
      const config = parse(
        "llm://openrouter.ai/anthropic/claude-sonnet-4-5?temp=0.7&max=2000",
      );
      const { config: result, provider, subProvider } = normalize(config);
      expect(provider).toBe("openrouter");
      expect(subProvider).toBe("anthropic");
      expect(result.params).toEqual({
        temperature: "0.7",
        max_tokens: "2000",
      });
    });

    it("maps effort → reasoning_effort", () => {
      const config = parse(
        "llm://openrouter.ai/openai/o3?effort=high",
      );
      const { config: result } = normalize(config);
      expect(result.params).toEqual({ reasoning_effort: "high" });
    });

    it("remaps max_tokens → max_completion_tokens for reasoning models via OpenRouter", () => {
      const config = parse(
        "llm://openrouter.ai/openai/o3?max=4096",
      );
      const { config: result } = normalize(config);
      expect(result.params).toEqual({ max_completion_tokens: "4096" });
    });

    it("drops cache for OpenRouter (no explicit caching)", () => {
      const config = parse(
        "llm://openrouter.ai/anthropic/claude-sonnet-4-5?cache=true",
      );
      const { config: result } = normalize(config);
      expect(result.params).toEqual({});
    });
  });

  describe("Vercel AI Gateway", () => {
    it("detects vercel and uses OpenAI-compatible params", () => {
      const config = parse(
        "llm://gateway.ai.vercel.sh/openai/gpt-5.2?temp=0.7&max=1500&top_p=0.9",
      );
      const { config: result, provider, subProvider } = normalize(config);
      expect(provider).toBe("vercel");
      expect(subProvider).toBe("openai");
      expect(result.params).toEqual({
        temperature: "0.7",
        max_tokens: "1500",
        top_p: "0.9",
      });
    });

    it("keeps top_k as top_k (gateway supports multi-provider)", () => {
      const config = parse(
        "llm://gateway.ai.vercel.sh/anthropic/claude-sonnet-4-5?topk=40",
      );
      const { config: result, subProvider } = normalize(config);
      expect(subProvider).toBe("anthropic");
      expect(result.params).toEqual({ top_k: "40" });
    });

    it("returns undefined subProvider for unknown prefix", () => {
      const config = parse(
        "llm://gateway.ai.vercel.sh/qwen/qwen2.5-pro?temp=0.7",
      );
      const { subProvider } = normalize(config);
      expect(subProvider).toBeUndefined();
    });
  });

  describe("provider detection", () => {
    it("detects openai", () => {
      const config = parse("llm://api.openai.com/gpt-5.2");
      expect(normalize(config).provider).toBe("openai");
    });

    it("detects anthropic", () => {
      const config = parse("llm://api.anthropic.com/claude-sonnet-4-5");
      expect(normalize(config).provider).toBe("anthropic");
    });

    it("detects google", () => {
      const config = parse(
        "llm://generativelanguage.googleapis.com/gemini-3-flash-preview",
      );
      expect(normalize(config).provider).toBe("google");
    });

    it("detects mistral", () => {
      const config = parse("llm://api.mistral.ai/mistral-large-latest");
      expect(normalize(config).provider).toBe("mistral");
    });

    it("detects cohere", () => {
      const config = parse("llm://api.cohere.com/command-a-03-2025");
      expect(normalize(config).provider).toBe("cohere");
    });

    it("detects bedrock", () => {
      const config = parse(
        "llm://bedrock-runtime.us-east-1.amazonaws.com/anthropic.claude-sonnet-4-5-20250929-v1:0",
      );
      expect(normalize(config).provider).toBe("bedrock");
    });

    it("detects openrouter", () => {
      const config = parse(
        "llm://openrouter.ai/anthropic/claude-sonnet-4-5",
      );
      expect(normalize(config).provider).toBe("openrouter");
    });

    it("detects vercel", () => {
      const config = parse(
        "llm://gateway.ai.vercel.sh/openai/gpt-5.2",
      );
      expect(normalize(config).provider).toBe("vercel");
    });

    it("returns undefined for unknown host", () => {
      const config = parse("llm://custom-api.example.com/my-model?temp=0.5");
      const { provider, config: result } = normalize(config);
      expect(provider).toBeUndefined();
      // aliases still expand even without provider
      expect(result.params).toEqual({ temperature: "0.5" });
    });
  });

  describe("verbose mode", () => {
    it("returns changes when verbose is true", () => {
      const config = parse(
        "llm://api.anthropic.com/claude-sonnet-4-5?temp=0.7&cache=true",
      );
      const { changes } = normalize(config, { verbose: true });
      expect(changes.length).toBeGreaterThan(0);
      expect(changes.some((c) => c.from === "temp")).toBe(true);
      expect(changes.some((c) => c.from === "cache")).toBe(true);
    });

    it("returns empty changes when verbose is false", () => {
      const config = parse(
        "llm://api.openai.com/gpt-5.2?temp=0.7",
      );
      const { changes } = normalize(config, { verbose: false });
      expect(changes).toEqual([]);
    });
  });

  describe("passthrough", () => {
    it("passes through already-canonical params unchanged", () => {
      const config = parse(
        "llm://api.openai.com/gpt-5.2?temperature=0.7&max_tokens=1500",
      );
      const { config: result } = normalize(config);
      expect(result.params).toEqual({
        temperature: "0.7",
        max_tokens: "1500",
      });
    });

    it("passes through unknown params for unknown providers", () => {
      const config = parse(
        "llm://custom.api.com/my-model?custom_param=hello",
      );
      const { config: result } = normalize(config);
      expect(result.params).toEqual({ custom_param: "hello" });
    });
  });
});
