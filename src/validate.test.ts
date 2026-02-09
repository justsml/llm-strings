import { describe, expect, it } from "vitest";
import { validate } from "./validate.js";
import { normalize } from "./normalize.js";
import { parse } from "./index.js";

/** Helper: parse + normalize + validate */
function check(connectionString: string) {
  const config = parse(connectionString);
  const { config: normalized } = normalize(config);
  return validate(normalized);
}

describe("validate", () => {
  describe("valid configs", () => {
    it("returns no issues for valid OpenAI params", () => {
      const issues = check(
        "llm://api.openai.com/gpt-4o?temp=0.7&max=1500&top_p=0.9",
      );
      expect(issues).toEqual([]);
    });

    it("returns no issues for valid Anthropic params", () => {
      const issues = check(
        "llm://api.anthropic.com/claude-sonnet-4-5?temp=0.5&max=4096&top_k=40",
      );
      expect(issues).toEqual([]);
    });

    it("returns no issues for valid Google params", () => {
      const issues = check(
        "llm://generativelanguage.googleapis.com/gemini-2.5-pro?temp=1.0&max=2048",
      );
      expect(issues).toEqual([]);
    });

    it("returns no issues for valid Mistral params", () => {
      const issues = check(
        "llm://api.mistral.ai/mistral-large?temp=0.8&max=1000&seed=42",
      );
      expect(issues).toEqual([]);
    });
  });

  describe("out of range", () => {
    it("flags temperature > 2 for OpenAI", () => {
      const issues = check("llm://api.openai.com/gpt-4o?temp=3.0");
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe("error");
      expect(issues[0].message).toContain("<= 2");
    });

    it("flags temperature > 1 for Anthropic", () => {
      const issues = check(
        "llm://api.anthropic.com/claude-sonnet-4-5?temp=1.5",
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe("error");
      expect(issues[0].message).toContain("<= 1");
    });

    it("flags negative temperature", () => {
      const issues = check("llm://api.openai.com/gpt-4o?temp=-0.5");
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe("error");
      expect(issues[0].message).toContain(">= 0");
    });

    it("flags top_p > 1", () => {
      const issues = check("llm://api.openai.com/gpt-4o?top_p=1.5");
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain("<= 1");
    });

    it("flags Cohere k > 500", () => {
      const issues = check("llm://api.cohere.com/command-r-plus?topk=600");
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain("<= 500");
    });
  });

  describe("type errors", () => {
    it("flags non-numeric temperature", () => {
      const issues = check("llm://api.openai.com/gpt-4o?temp=hot");
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe("error");
      expect(issues[0].message).toContain("number");
    });

    it("flags invalid boolean for stream", () => {
      const issues = check("llm://api.openai.com/gpt-4o?stream=yes");
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain("boolean");
    });

    it("flags invalid effort value for OpenAI", () => {
      const issues = check("llm://api.openai.com/o3?effort=extreme");
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain("low, medium, high");
    });

    it("flags invalid effort value for Anthropic", () => {
      const issues = check(
        "llm://api.anthropic.com/claude-opus-4-6?effort=extreme",
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain("low, medium, high, max");
    });
  });

  describe("unknown params", () => {
    it("warns about unknown params", () => {
      const issues = check(
        "llm://api.openai.com/gpt-4o?made_up_param=hello",
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe("warning");
      expect(issues[0].message).toContain("Unknown");
    });
  });

  describe("reasoning model restrictions", () => {
    it("flags temperature on OpenAI reasoning models", () => {
      const issues = check("llm://api.openai.com/o3?temp=0.7");
      expect(issues.some((i) => i.message.includes("not supported"))).toBe(
        true,
      );
    });

    it("flags top_p on OpenAI reasoning models", () => {
      const issues = check("llm://api.openai.com/o3-mini?top_p=0.9");
      expect(issues.some((i) => i.message.includes("not supported"))).toBe(
        true,
      );
    });

    it("allows effort on OpenAI reasoning models", () => {
      const issues = check("llm://api.openai.com/o3?effort=high");
      expect(issues).toEqual([]);
    });

    it("allows max_completion_tokens on reasoning models", () => {
      const issues = check("llm://api.openai.com/o3?max=4096");
      expect(
        issues.filter((i) => i.severity === "error"),
      ).toEqual([]);
    });
  });

  describe("unknown provider", () => {
    it("returns a warning and skips validation", () => {
      const config = parse("llm://custom-api.com/my-model?temp=999");
      const issues = validate(config);
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe("warning");
      expect(issues[0].message).toContain("Unknown provider");
    });
  });
});
