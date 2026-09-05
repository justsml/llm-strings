import { describe, expect, it } from "vitest";
import { parse } from "./index.js";

function withParams(base: string, params: Record<string, string>): string {
  return `${base}?${new URLSearchParams(params).toString()}`;
}

describe("createAiSdkProviderOptions", () => {
  it("maps Gemini 3.8 thinking effort into thinkingConfig", async () => {
    const { createAiSdkProviderOptions } = await import("./ai-sdk.js");

    expect(
      createAiSdkProviderOptions(
        "llm://google/gemini-3.8-flash?effort=high&include_thoughts=true",
      ).providerOptions,
    ).toEqual({
      google: {
        thinkingConfig: { thinkingLevel: "high", includeThoughts: true },
      },
    });
  });

  it("loads from the AI SDK adapter submodule with dynamic import", async () => {
    const { createAiSdkProviderOptions } = await import("./ai-sdk.js");

    const result = createAiSdkProviderOptions(
      parse("llm://api.openai.com/o3?effort=high"),
    );

    expect(result.providerOptions).toEqual({
      openai: { reasoningEffort: "high" },
    });
  });

  it("parses connection strings directly", async () => {
    const { createAiSdkProviderOptions } = await import("./ai-sdk.js");

    const result = createAiSdkProviderOptions(
      "llm://api.openai.com/o3?effort=high",
    );

    expect(result.providerOptions).toEqual({
      openai: { reasoningEffort: "high" },
    });
  });

  it("maps Anthropic cache and effort options", async () => {
    const { createAiSdkProviderOptions } = await import("./ai-sdk.js");

    const result = createAiSdkProviderOptions(
      parse("llm://api.anthropic.com/claude-sonnet-4-5?cache=1h&effort=max"),
    );

    expect(result.providerOptions).toEqual({
      anthropic: {
        cacheControl: { type: "ephemeral", ttl: "1h" },
        effort: "max",
      },
    });
  });

  it("maps Bedrock cache options to cachePoint", async () => {
    const { createAiSdkProviderOptions } = await import("./ai-sdk.js");

    const result = createAiSdkProviderOptions(
      parse(
        "llm://bedrock-runtime.us-east-1.amazonaws.com/anthropic.claude-sonnet-4-5-20250929-v1:0?cache=1h",
      ),
    );

    expect(result.providerOptions).toEqual({
      bedrock: { cachePoint: { type: "default", ttl: "1h" } },
    });
  });

  it("maps Mistral options to AI SDK camelCase", async () => {
    const { createAiSdkProviderOptions } = await import("./ai-sdk.js");

    const result = createAiSdkProviderOptions(
      parse("llm://api.mistral.ai/mistral-large-latest?safe_prompt=true"),
    );

    expect(result.providerOptions).toEqual({
      mistral: { safePrompt: true },
    });
  });

  it("maps Google thinking options into thinkingConfig", async () => {
    const { createAiSdkProviderOptions } = await import("./ai-sdk.js");

    const result = createAiSdkProviderOptions(
      parse(
        "llm://google/gemini-3.5-flash?thinking_level=high&thinking_budget=1024&include_thoughts=true",
      ),
    );

    expect(result.providerOptions).toEqual({
      google: {
        thinkingConfig: {
          thinkingLevel: "high",
          thinkingBudget: 1024,
          includeThoughts: true,
        },
      },
    });
  });

  it("uses gateway as the providerOptions key for Vercel AI Gateway", async () => {
    const { createAiSdkProviderOptions } = await import("./ai-sdk.js");

    const result = createAiSdkProviderOptions(
      parse(
        "llm://vercel/anthropic/claude-sonnet-4?order=vertex,anthropic&sort=ttft&caching=auto",
      ),
    );

    expect(result.providerOptions).toEqual({
      gateway: {
        order: ["vertex", "anthropic"],
        sort: "ttft",
        caching: "auto",
      },
    });
  });

  it("uses xai as the providerOptions key for xAI aliases", async () => {
    const { createAiSdkProviderOptions } = await import("./ai-sdk.js");

    const result = createAiSdkProviderOptions("llm://grok/grok-4?effort=high");

    expect(result.provider).toBe("xai");
    expect(result.providerOptions).toEqual({
      xai: { reasoningEffort: "high" },
    });
  });

  it("uses meta as the providerOptions key for Meta aliases", async () => {
    const { createAiSdkProviderOptions } = await import("./ai-sdk.js");

    const result = createAiSdkProviderOptions(
      "llm://meta/muse-spark-1.1?effort=high&max=4096",
    );

    expect(result.provider).toBe("meta");
    expect(result.providerOptions).toEqual({
      meta: { reasoningEffort: "high" },
    });
  });

  it("uses vertex as the providerOptions key for Google Vertex", async () => {
    const { createAiSdkProviderOptions } = await import("./ai-sdk.js");

    const result = createAiSdkProviderOptions(
      'llm://vertex/gemini-2.5-pro?safety_settings={"threshold":"BLOCK_LOW_AND_ABOVE"}',
    );

    expect(result.provider).toBe("google-vertex");
    expect(result.providerOptions).toEqual({
      vertex: { safetySettings: { threshold: "BLOCK_LOW_AND_ABOVE" } },
    });
  });

  it("passes flexible Fal providerOptions through", async () => {
    const { createAiSdkProviderOptions } = await import("./ai-sdk.js");

    const result = createAiSdkProviderOptions(
      "llm://fal/fal-ai/flux-pro?image_size=square_hd&num_images=2",
    );

    expect(result.provider).toBe("fal");
    expect(result.providerOptions).toEqual({
      fal: { image_size: "square_hd", num_images: 2 },
    });
  });

  it("uses blackForestLabs as the providerOptions key for Black Forest Labs", async () => {
    const { createAiSdkProviderOptions } = await import("./ai-sdk.js");

    const result = createAiSdkProviderOptions(
      "llm://bfl/flux-pro-1.1?output_format=jpeg",
    );

    expect(result.provider).toBe("black-forest-labs");
    expect(result.providerOptions).toEqual({
      blackForestLabs: { output_format: "jpeg" },
    });
  });

  it("maps OpenRouter reasoning effort into its nested reasoning option", async () => {
    const { createAiSdkProviderOptions } = await import("./ai-sdk.js");

    const result = createAiSdkProviderOptions(
      parse("llm://openrouter.ai/openai/o3?effort=high"),
    );

    expect(result.providerOptions).toEqual({
      openrouter: { reasoning: { effort: "high" } },
    });
  });

  it("maps OpenRouter routing params into provider options", async () => {
    const { createAiSdkProviderOptions } = await import("./ai-sdk.js");

    const result = createAiSdkProviderOptions(
      parse(
        "llm://openrouter.ai/openai/gpt-5.6-sol?provider.order=openai,anthropic&provider.allow_fallbacks=false&transforms=middle-out&plugins=context-compression",
      ),
    );

    expect(result.providerOptions).toEqual({
      openrouter: {
        provider: {
          order: ["openai", "anthropic"],
          allow_fallbacks: false,
        },
        transforms: ["middle-out"],
        plugins: ["context-compression"],
      },
    });
  });

  it("does not put common generation settings into providerOptions", async () => {
    const { createAiSdkProviderOptions } = await import("./ai-sdk.js");

    const result = createAiSdkProviderOptions(
      parse("llm://google/gemini-3.5-flash?temp=0.7&top_p=0.9&seed=42"),
    );

    expect(result.providerOptions).toEqual({});
  });

  it("maps advanced provider option branches", async () => {
    const { createAiSdkProviderOptions } = await import("./ai-sdk.js");
    const opts = (input: string) =>
      createAiSdkProviderOptions(input).providerOptions;
    const outputs = [
      opts(
        withParams("llm://api.openai.com/gpt-5.6-sol", {
          include: '["reasoning.encrypted_content",3]',
          metadata: '{"team":"eval"}',
          allowed_tools: '{"mode":"auto"}',
          parallel_tool_calls: "false",
        }),
      ),
      opts(
        withParams("llm://api.anthropic.com/claude-sonnet-4-5", {
          thinking: '{"type":"enabled","budgetTokens":64}',
          thinking_budget: "1024",
          anthropic_beta: "tools,context",
          mcp_servers: '{"docs":{"url":"https://example.com"}}',
        }),
      ),
      opts(
        withParams("llm://bedrock/anthropic.claude-sonnet-4-5-20250929-v1:0", {
          reasoning_config: '{"type":"enabled","budgetTokens":256}',
          budget_tokens: "512",
          additional_model_request_fields: '{"top_k":40}',
          anthropic_beta: "tools,context",
        }),
      ),
      opts(
        withParams("llm://openrouter.ai/openai/gpt-5.6-sol", {
          models: "openai/gpt-5.6-sol,anthropic/claude-sonnet-5",
          provider: '{"require_parameters":true}',
          "provider.sort": '{"field":"latency"}',
          plugins: '["web",{"id":"compress"}]',
          reasoning: '{"effort":"low"}',
          reasoning_enabled: "true",
          reasoning_exclude: "false",
          max_reasoning_tokens: "512",
          user: "user_1",
        }),
      ),
    ];

    expect([
      outputs[0].openai?.include,
      outputs[1].anthropic?.thinking,
      outputs[2].bedrock?.reasoningConfig,
      outputs[3].openrouter?.reasoning,
      createAiSdkProviderOptions(
        "llm://vercel/openai/gpt-5.6-sol?order=openai",
        {
          includeGatewayOptions: false,
        },
      ).providerOptions,
    ]).toEqual([
      ["reasoning.encrypted_content"],
      { type: "enabled", budgetTokens: 1024 },
      { type: "enabled", budgetTokens: 512 },
      {
        effort: '{"effort":"low"}',
        enabled: true,
        exclude: false,
        max_tokens: 512,
      },
      {},
    ]);
  });

  it("maps additional provider option keys", async () => {
    const { createAiSdkProviderOptions } = await import("./ai-sdk.js");
    const openAiCompatible = "azure groq deepinfra together".split(" ");
    const flexible =
      "replicate prodia luma bytedance kling elevenlabs assemblyai deepgram gladia lmnt hume revai".split(
        " ",
      );

    expect(
      openAiCompatible.map(
        (alias) =>
          Object.keys(
            createAiSdkProviderOptions(
              `llm://${alias}/provider-options-probe?effort=high`,
            ).providerOptions,
          )[0],
      ),
    ).toEqual(openAiCompatible);
    expect(
      flexible.map((alias) => {
        const options = createAiSdkProviderOptions(
          `llm://${alias}/model?custom_option=true&count=2&payload=%7B%22a%22%3A1%7D`,
        ).providerOptions;
        const key = Object.keys(options)[0];
        return [key, options[key].payload];
      }),
    ).toEqual(flexible.map((key) => [key, { a: 1 }]));
  });
});
