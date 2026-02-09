import { describe, expect, it } from "vitest";
import { build, parse } from "./index.js";

describe("parse", () => {
  it("parses a basic connection string", () => {
    const result = parse("llm://api.openai.com/gpt-5.2?temp=0.7&max_tokens=1500");

    expect(result.host).toBe("api.openai.com");
    expect(result.model).toBe("gpt-5.2");
    expect(result.params).toEqual({ temp: "0.7", max_tokens: "1500" });
    expect(result.label).toBeUndefined();
    expect(result.apiKey).toBeUndefined();
  });

  it("parses auth credentials", () => {
    const result = parse(
      "llm://app-name:sk-proj-123456@api.openai.com/gpt-5.2?temp=0.7",
    );

    expect(result.host).toBe("api.openai.com");
    expect(result.model).toBe("gpt-5.2");
    expect(result.label).toBe("app-name");
    expect(result.apiKey).toBe("sk-proj-123456");
    expect(result.params).toEqual({ temp: "0.7" });
  });

  it("parses a string with no query params", () => {
    const result = parse("llm://api.openai.com/gpt-5.2");

    expect(result.host).toBe("api.openai.com");
    expect(result.model).toBe("gpt-5.2");
    expect(result.params).toEqual({});
  });

  it("throws on invalid scheme", () => {
    expect(() => parse("http://api.openai.com/gpt-5.2")).toThrow(
      "Invalid scheme",
    );
  });
});

describe("build", () => {
  it("builds a basic connection string", () => {
    const result = build({
      host: "api.openai.com",
      model: "gpt-5.2",
      params: { temp: "0.7", max_tokens: "1500" },
    });

    expect(result).toBe(
      "llm://api.openai.com/gpt-5.2?temp=0.7&max_tokens=1500",
    );
  });

  it("builds with auth credentials", () => {
    const result = build({
      host: "api.openai.com",
      model: "gpt-5.2",
      label: "app-name",
      apiKey: "sk-proj-123456",
      params: { temp: "0.7" },
    });

    expect(result).toBe(
      "llm://app-name:sk-proj-123456@api.openai.com/gpt-5.2?temp=0.7",
    );
  });

  it("builds with no params", () => {
    const result = build({
      host: "api.openai.com",
      model: "gpt-5.2",
      params: {},
    });

    expect(result).toBe("llm://api.openai.com/gpt-5.2");
  });
});
