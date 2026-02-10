# llm-strings

**Connection strings for LLMs. Like database URLs, but for AI.**

[![npm version](https://img.shields.io/npm/v/llm-strings.svg)](https://www.npmjs.com/package/llm-strings)
[![License](https://img.shields.io/npm/l/llm-strings.svg)](https://github.com/justsml/llm-strings/blob/main/LICENSE)

```ini
llm://api.openai.com/gpt-5.2?temp=0.7&max=2000
llm://my-app:sk-key-123@api.anthropic.com/claude-sonnet-4-5?cache=5m
llm://bedrock-runtime.us-east-1.amazonaws.com/anthropic.claude-sonnet-4-5-20250929-v1:0?temp=0.5
```

Every LLM provider invented their own parameter names. `max_tokens` vs `maxOutputTokens` vs `maxTokens`. `top_p` vs `topP` vs `p`. `stop` vs `stop_sequences` vs `stopSequences`. You write the config once, then rewrite it for every provider.

**llm-strings** gives you a single, portable format. Parse it, normalize it to any provider's API, and validate it — all in one library with zero dependencies.

Based on the [LLM Connection Strings](https://danlevy.net/llm-connection-strings/) specification.

## Install

```bash
npm install llm-strings
```

## Quick Start

```ts
import { parse, normalize, validate, build } from "llm-strings";

// Parse a connection string into structured config
const config = parse("llm://api.openai.com/gpt-5.2?temp=0.7&max=2000");
// → { host: "api.openai.com", model: "gpt-5.2", params: { temp: "0.7", max: "2000" } }

// Normalize aliases and map to the provider's actual API param names
const { config: normalized, provider } = normalize(config);
// → params: { temperature: "0.7", max_tokens: "2000" }, provider: "openai"

// Validate against provider specs (returns [] if valid)
const issues = validate("llm://api.openai.com/gpt-5.2?temp=3.0");
// → [{ param: "temperature", message: '"temperature" must be <= 2, got 3', severity: "error" }]

// Build a connection string from a config object
const str = build({ host: "api.openai.com", model: "gpt-5.2", params: { temperature: "0.7" } });
// → "llm://api.openai.com/gpt-5.2?temperature=0.7"
```

## Why Connection Strings?

You already use them for databases: `postgres://user:pass@host/db`. They're compact, portable, and easy to pass through environment variables. LLM configs deserve the same treatment.

**Store your entire model config in one env var:**

```bash
LLM_URL="llm://my-app:sk-proj-abc123@api.openai.com/gpt-5.2?temp=0.7&max=2000"
```

**Switch providers by changing a string, not refactoring code:**

```bash
# Monday: OpenAI
LLM_URL="llm://api.openai.com/gpt-5.2?temp=0.7&max=2000"

# Tuesday: Anthropic
LLM_URL="llm://api.anthropic.com/claude-sonnet-4-5?temp=0.7&max=2000"

# Wednesday: Bedrock in production
LLM_URL="llm://bedrock-runtime.us-east-1.amazonaws.com/anthropic.claude-sonnet-4-5-20250929-v1:0?temp=0.7&max=2000"
```

Your code stays the same. `normalize()` handles the parameter translation.

## Benefits

- **One format, every provider** — Write `temp=0.7&max=2000` once. Normalization maps it to `temperature`, `max_tokens`, `maxOutputTokens`, `maxTokens`, or whatever your provider calls it.
- **Catch mistakes early** — `validate()` checks types, ranges, and provider-specific rules before you burn tokens on a bad request.
- **Zero dependencies** — Pure TypeScript. No runtime baggage.
- **Portable config** — Fits in an env var, a CLI flag, a config file, or a database column.
- **Shorthand aliases** — Use `temp`, `max`, `topp`, `freq`, `pres` — they all expand to the right thing.

## Format

```ini
llm://[label[:apiKey]@]host/model[?params]
```

| Part       | Required | Description                               | Example                        |
| ---------- | -------- | ----------------------------------------- | ------------------------------ |
| `label`    | No       | App name or identifier                    | `my-app`                       |
| `apiKey`   | No       | API key (in the password position)        | `sk-proj-abc123`               |
| `host`     | Yes      | Provider's API hostname                   | `api.openai.com`               |
| `model`    | Yes      | Model name or ID                          | `gpt-5.2`                      |
| `params`   | No       | Key-value config (query string)           | `temp=0.7&max=2000`            |

## Examples

### Switching between providers

Write portable params, let `normalize()` translate them:

```ts
import { parse, normalize } from "llm-strings";

// Same logical config, different providers
const strings = [
  "llm://api.openai.com/gpt-5.2?temp=0.7&max=2000&top_p=0.9",
  "llm://api.anthropic.com/claude-sonnet-4-5?temp=0.7&max=2000&top_p=0.9",
  "llm://generativelanguage.googleapis.com/gemini-3-flash-preview?temp=0.7&max=2000&top_p=0.9",
];

for (const str of strings) {
  const { config, provider } = normalize(parse(str));
  console.log(`${provider}:`, config.params);
}
// openai:    { temperature: "0.7", max_tokens: "2000", top_p: "0.9" }
// anthropic: { temperature: "0.7", max_tokens: "2000", top_p: "0.9" }
// google:    { temperature: "0.7", maxOutputTokens: "2000", topP: "0.9" }
```

### Validating before calling the API

Catch bad config before it hits the network:

```ts
import { validate } from "llm-strings";

// Anthropic doesn't allow temperature + top_p together
const issues = validate(
  "llm://api.anthropic.com/claude-sonnet-4-5?temp=0.7&top_p=0.9"
);

for (const issue of issues) {
  console.error(`[${issue.severity}] ${issue.param}: ${issue.message}`);
}
// [error] temperature: Cannot specify both "temperature" and "top_p" for Anthropic models.
```

```ts
// OpenAI reasoning models have different rules
const issues = validate("llm://api.openai.com/o3?temp=0.7&max=2000");
// [error] temperature: "temperature" is not supported by OpenAI reasoning model "o3".
//         Use "reasoning_effort" instead of temperature for controlling output.
```

### Environment-driven config

```ts
import { parse, normalize } from "llm-strings";

// One env var holds the entire config
const { config, provider } = normalize(parse(process.env.LLM_URL!));

// Use the normalized params directly in your API call
const response = await fetch(`https://${config.host}/v1/chat/completions`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: config.model,
    messages: [{ role: "user", content: "Hello!" }],
    ...Object.fromEntries(
      Object.entries(config.params).map(([k, v]) => [k, isNaN(+v) ? v : +v])
    ),
  }),
});
```

### Prompt caching (Anthropic & Bedrock)

```ts
import { parse, normalize } from "llm-strings";

// cache=true → cache_control=ephemeral
const { config } = normalize(
  parse("llm://api.anthropic.com/claude-sonnet-4-5?max=4096&cache=true")
);
// → params: { max_tokens: "4096", cache_control: "ephemeral" }

// cache=5m → cache_control=ephemeral + cache_ttl=5m
const { config: withTtl } = normalize(
  parse("llm://api.anthropic.com/claude-sonnet-4-5?max=4096&cache=5m")
);
// → params: { max_tokens: "4096", cache_control: "ephemeral", cache_ttl: "5m" }

// Works on Bedrock too (Claude and Nova models)
const { config: bedrock } = normalize(
  parse(
    "llm://bedrock-runtime.us-east-1.amazonaws.com/anthropic.claude-sonnet-4-5-20250929-v1:0?cache=1h"
  )
);
// → params: { cache_control: "ephemeral", cache_ttl: "1h" }
```

### Debugging normalization

Use verbose mode to see exactly what was transformed:

```ts
import { parse, normalize } from "llm-strings";

const { changes } = normalize(
  parse(
    "llm://generativelanguage.googleapis.com/gemini-3-flash-preview?temp=0.7&max=2000&topp=0.9"
  ),
  { verbose: true }
);

for (const c of changes) {
  console.log(`${c.from} → ${c.to} (${c.reason})`);
}
// temp → temperature            (alias: "temp" → "temperature")
// max → max_tokens              (alias: "max" → "max_tokens")
// max_tokens → maxOutputTokens  (google uses "maxOutputTokens" instead of "max_tokens")
// topp → top_p                  (alias: "topp" → "top_p")
// top_p → topP                  (google uses "topP" instead of "top_p")
```

### Building connection strings programmatically

```ts
import { build } from "llm-strings";

const url = build({
  host: "api.openai.com",
  model: "gpt-5.2",
  label: "my-app",
  apiKey: "sk-proj-abc123",
  params: { temperature: "0.7", max_tokens: "2000", stream: "true" },
});
// → "llm://my-app:sk-proj-abc123@api.openai.com/gpt-5.2?temperature=0.7&max_tokens=2000&stream=true"
```

### AWS Bedrock with cross-region inference

```ts
import { parse, normalize, detectBedrockModelFamily } from "llm-strings";

const config = parse(
  "llm://bedrock-runtime.us-east-1.amazonaws.com/us.anthropic.claude-sonnet-4-5-20250929-v1:0?temp=0.5&max=4096"
);

detectBedrockModelFamily(config.model);
// → "anthropic"

const { config: normalized } = normalize(config);
// → params: { temperature: "0.5", maxTokens: "4096" }
//   (Bedrock Converse API uses camelCase)
```

### Gateway providers (OpenRouter, Vercel)

```ts
import { parse, normalize, validate } from "llm-strings";

// OpenRouter proxies to any provider
const { config } = normalize(
  parse("llm://openrouter.ai/anthropic/claude-sonnet-4-5?temp=0.7&max=2000")
);
// → params: { temperature: "0.7", max_tokens: "2000" }

// Reasoning model restrictions apply even through gateways
const issues = validate("llm://openrouter.ai/openai/o3?temp=0.7");
// → [{ param: "temperature", severity: "error",
//      message: "...not supported by OpenAI reasoning model..." }]
```

## Supported Providers

| Provider    | Host Pattern                             | Param Style |
| ----------- | ---------------------------------------- | ----------- |
| OpenAI      | `api.openai.com`                         | snake_case  |
| Anthropic   | `api.anthropic.com`                      | snake_case  |
| Google      | `generativelanguage.googleapis.com`      | camelCase   |
| Mistral     | `api.mistral.ai`                         | snake_case  |
| Cohere      | `api.cohere.com`                         | snake_case  |
| AWS Bedrock | `bedrock-runtime.{region}.amazonaws.com` | camelCase   |
| OpenRouter  | `openrouter.ai`                          | snake_case  |
| Vercel AI   | `gateway.ai.vercel.sh`                   | snake_case  |

Gateways like OpenRouter and Vercel route to any upstream provider. Bedrock hosts models from multiple families (Anthropic, Meta, Amazon, Mistral, Cohere, AI21) with cross-region inference support. Each provider's parameter names differ — normalization handles the translation automatically.

## Shorthand Aliases

Use these shortcuts in your connection strings — they expand automatically during normalization:

| Shorthand                                  | Canonical            |
| ------------------------------------------ | -------------------- |
| `temp`                                     | `temperature`        |
| `max`, `max_out`, `maxTokens`              | `max_tokens`         |
| `topp`, `topP`, `nucleus`                  | `top_p`              |
| `topk`, `topK`                             | `top_k`              |
| `freq`, `freq_penalty`                     | `frequency_penalty`  |
| `pres`, `pres_penalty`                     | `presence_penalty`   |
| `stop_sequences`, `stopSequences`          | `stop`               |
| `reasoning`, `reasoning_effort`            | `effort`             |
| `cache_control`, `cacheControl`            | `cache`              |

## API Reference

### `parse(connectionString): LlmConnectionConfig`

Parses an `llm://` connection string into its component parts. Throws if the scheme is not `llm://`.

### `build(config): string`

Reconstructs a connection string from a config object. Inverse of `parse()`.

### `normalize(config, options?): NormalizeResult`

Normalizes parameters for the target provider:

1. Expands shorthand aliases (`temp` → `temperature`)
2. Maps to provider-specific param names (`max_tokens` → `maxOutputTokens` for Google)
3. Normalizes cache values (`cache=true` → `cache_control=ephemeral`)
4. Adjusts for reasoning models (`max_tokens` → `max_completion_tokens` for o1/o3/o4)

Pass `{ verbose: true }` to get a detailed `changes` array documenting each transformation.

### `validate(connectionString): ValidationIssue[]`

Parses, normalizes, and validates a connection string against provider-specific rules. Returns `[]` if everything is valid. Checks:

- Type correctness (number, boolean, string enums)
- Value ranges (e.g., temperature 0–2 for OpenAI, 0–1 for Anthropic)
- Mutual exclusions (`temperature` + `top_p` on Anthropic)
- Reasoning model restrictions (no `temperature` on o1/o3/o4)
- Bedrock model family constraints (`topK` only for Claude/Cohere/Mistral)

### `detectProvider(host): Provider | undefined`

Identifies the provider from a hostname string.

### `detectBedrockModelFamily(model): BedrockModelFamily | undefined`

Identifies the model family (anthropic, meta, amazon, mistral, cohere, ai21) from a Bedrock model ID. Handles cross-region (`us.`, `eu.`, `apac.`) and global inference profiles.

## TypeScript

Full type definitions ship with the package:

```ts
import type {
  LlmConnectionConfig,
  NormalizeResult,
  NormalizeChange,
  NormalizeOptions,
  ValidationIssue,
  Provider,
  BedrockModelFamily,
} from "llm-strings";
```

## License

MIT
