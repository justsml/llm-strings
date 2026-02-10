# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm test          # run all tests (vitest)
pnpm test -- src/validate.test.ts              # run a single test file
pnpm test -- -t "flags temperature"            # run tests matching a name
pnpm run build     # build with tsup (outputs dist/)
pnpm run lint      # eslint
pnpm run format    # prettier --write
pnpm run format:check
```

## Architecture

This is a TypeScript library (published as `llm-strings`) for parsing, normalizing, and validating LLM connection strings — URL-like strings of the form `llm://[label[:apiKey]@]host/model[?params]`.

### Data flow

Connection strings flow through three stages, each building on the previous:

1. **parse** (`parse.ts`) — URL parsing into `LlmConnectionConfig` (`{ host, model, params, label?, apiKey? }`)
2. **normalize** (`normalize.ts`) — expands aliases, maps to provider-specific param names, handles cache/reasoning-model rewrites. Uses `NormalizeOptions` for config.
3. **validate** (`validate.ts`) — runs normalize internally, then checks types, ranges, enums, mutual exclusions, and provider/model-family constraints. Uses `ValidateOptions` for config (e.g. `{ strict: true }`).

### Provider system (`providers.ts`)

Central registry for all provider knowledge. Key exports:

- `ALIASES` — shorthand → canonical param names (e.g. `temp` → `temperature`)
- `PROVIDER_PARAMS` — canonical → provider-specific param names per provider
- `PARAM_SPECS` — validation rules (type, min/max, enum values) per provider, keyed by provider-specific param name
- `detectProvider(host)` — hostname → Provider enum
- `detectBedrockModelFamily(model)` — model ID → vendor family (handles cross-region/global prefixes)
- Helper functions: `isReasoningModel`, `canHostOpenAIModels`, `bedrockSupportsCaching`

Providers: `openai`, `anthropic`, `google`, `mistral`, `cohere`, `bedrock`, `openrouter`, `vercel`. The last two are gateways with looser validation ranges.

### Conventions

- Canonical param names are snake_case (OpenAI convention). Provider-specific names vary (camelCase for Google/Bedrock).
- Validation issues use severity `"error"` (hard failure) or `"warning"` (advisory). Strict mode promotes warnings to errors.
- All source is in `src/`, tests are colocated as `*.test.ts`.
- ESM-first (`"type": "module"`), imports use `.js` extensions.
