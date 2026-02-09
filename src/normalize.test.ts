import { describe, expect, it } from "vitest";
import { normalize } from "./normalize.js";
import { parse } from "./index.js";

describe("normalize", () => {
  describe("alias expansion", () => {
    it("expands temp → temperature", () => {
      const config = parse("llm://api.openai.com/gpt-4o?temp=0.7");
      const { config: result } = normalize(config);
      expect(result.params).toEqual({ temperature: "0.7" });
    });

    it("expands max → max_tokens for OpenAI", () => {
      const config = parse("llm://api.openai.com/gpt-4o?max=1500");
      const { config: result } = normalize(config);
      expect(result.params).toEqual({ max_tokens: "1500" });
    });

    it("expands multiple aliases at once", () => {
      const config = parse(
        "llm://api.openai.com/gpt-4o?temp=0.7&max=1500&topp=0.9",
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
        "llm://api.openai.com/gpt-4o?freq_penalty=0.5&pres_penalty=0.3",
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
        "llm://generativelanguage.googleapis.com/gemini-2.5-pro?max=1500&top_p=0.9",
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
        "llm://api.cohere.com/command-r-plus?top_p=0.9&top_k=40",
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
      const config = parse("llm://api.mistral.ai/mistral-large?seed=42");
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
  });

  describe("cache normalization", () => {
    it("maps cache=true → cache_control=ephemeral for Anthropic", () => {
      const config = parse(
        "llm://api.anthropic.com/claude-sonnet-4-5?cache=true",
      );
      const { config: result } = normalize(config);
      expect(result.params).toEqual({ cache_control: "ephemeral" });
    });

    it("drops cache param for providers without explicit caching", () => {
      const config = parse("llm://api.openai.com/gpt-4o?cache=true");
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

  describe("provider detection", () => {
    it("detects openai", () => {
      const config = parse("llm://api.openai.com/gpt-4o");
      expect(normalize(config).provider).toBe("openai");
    });

    it("detects anthropic", () => {
      const config = parse("llm://api.anthropic.com/claude-sonnet-4-5");
      expect(normalize(config).provider).toBe("anthropic");
    });

    it("detects google", () => {
      const config = parse(
        "llm://generativelanguage.googleapis.com/gemini-2.5-pro",
      );
      expect(normalize(config).provider).toBe("google");
    });

    it("detects mistral", () => {
      const config = parse("llm://api.mistral.ai/mistral-large");
      expect(normalize(config).provider).toBe("mistral");
    });

    it("detects cohere", () => {
      const config = parse("llm://api.cohere.com/command-r-plus");
      expect(normalize(config).provider).toBe("cohere");
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
        "llm://api.openai.com/gpt-4o?temp=0.7",
      );
      const { changes } = normalize(config, { verbose: false });
      expect(changes).toEqual([]);
    });
  });

  describe("passthrough", () => {
    it("passes through already-canonical params unchanged", () => {
      const config = parse(
        "llm://api.openai.com/gpt-4o?temperature=0.7&max_tokens=1500",
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
