import { describe, it, expect } from "vitest";
import { normalize } from "./normalize.js";
import { parse } from "./index.js";
import { validate } from "./validate.js";

describe("Parameter Discrepancies & Validation", () => {
  describe("Anthropic / Bedrock Claude Mutual Exclusion", () => {
    it("should fail validation if both temperature and top_p are provided for Anthropic", () => {
      const issues = validate(
        "llm://api.anthropic.com/claude-3-5-sonnet-20240620?temperature=0.7&top_p=0.9",
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain('Cannot specify both "temperature" and "top_p"');
    });

    it("should fail validation if both temperature and topP are provided for Bedrock Claude", () => {
      const issues = validate(
        "llm://bedrock-runtime.us-east-1.amazonaws.com/anthropic.claude-3-5-sonnet-20240620-v1:0?temperature=0.7&top_p=0.9",
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain('Cannot specify both "temperature" and "topP"');
    });

    it("should pass validation if only temperature is provided", () => {
      const issues = validate(
        "llm://api.anthropic.com/claude-3-5-sonnet-20240620?temperature=0.7",
      );
      expect(issues).toHaveLength(0);
    });
  });

  describe("Bedrock Mistral Support", () => {
    it("should allow topK for Mistral models on Bedrock", () => {
      const issues = validate(
        "llm://bedrock-runtime.us-east-1.amazonaws.com/mistral.mistral-large-2402-v1:0?topk=50",
      );
      expect(issues).toHaveLength(0);
    });

    it("should fail topK for Amazon Titan models on Bedrock", () => {
      const issues = validate(
        "llm://bedrock-runtime.us-east-1.amazonaws.com/amazon.titan-text-express-v1?topk=50",
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain('"topK" is not supported by amazon models');
    });
  });

  describe("Google Gemini Parameters", () => {
    it("should normalize responseMimeType and responseSchema", () => {
      const config = parse(
        "llm://generativelanguage.googleapis.com/gemini-1.5-pro?responseMimeType=application/json&responseSchema={}",
      );
      const { config: normalized } = normalize(config);
      expect(normalized.params.responseMimeType).toBe("application/json");
      expect(normalized.params.responseSchema).toBe("{}");

      const issues = validate(config.raw);
      expect(issues).toHaveLength(0);
    });
  });

  describe("Mistral Native Parameters", () => {
    it("should normalize safe_prompt and min_tokens", () => {
      const config = parse(
        "llm://api.mistral.ai/mistral-large-latest?safe_prompt=true&min_tokens=100",
      );
      const { config: normalized } = normalize(config);
      expect(normalized.params.safe_prompt).toBe("true");
      expect(normalized.params.min_tokens).toBe("100");

      const issues = validate(config.raw);
      expect(issues).toHaveLength(0);
    });
  });
});
