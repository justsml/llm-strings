# Anthropic Messages API Parameters - Comprehensive Reference

**Date**: 2026-02-09
**Status**: Complete
**API Version**: 2023-06-01

## Executive Summary

This document provides a complete reference for all Anthropic Messages API parameters, including valid ranges, types, model-specific differences, and feature requirements. Key findings:

- **Breaking change in Claude 4+**: `temperature` and `top_p` are mutually exclusive (cannot both be specified)
- **Extended thinking evolution**: `budget_tokens` is deprecated on Claude Opus 4.6+ in favor of adaptive thinking with the `effort` parameter
- **Prompt caching**: Fully supported with `cache_control` field; beta header only needed for 1-hour TTL
- **Model naming**: Use snake_case with version dates (e.g., `claude-opus-4-6-20260205`)
- **Context windows**: Up to 1M tokens with `context-1m-2025-08-07` beta header

---

## 1. Required Parameters

### `model` (string)
**Required**: Yes
**Description**: The model identifier to use for completion
**Type**: string

**Available Models (2026)**:

#### Claude 4 Family (Latest)
- `claude-opus-4-6-20260205` - Latest Opus, highest intelligence, 1M context, 128K output
- `claude-opus-4-5-20251101` - Previous Opus generation
- `claude-opus-4-1-20250805` - Industry leader for coding
- `claude-sonnet-4-5-20250929` - Best for complex agents and coding
- `claude-sonnet-4-20250514` - Balanced performance
- `claude-haiku-4-5-20251001` - Fastest with near-frontier performance

#### Claude 3.5 Family (Still Available)
- `claude-3-7-sonnet-20250219` - Latest 3.x Sonnet
- `claude-3-5-sonnet-20240620` - Original 3.5 Sonnet
- `claude-3-5-haiku-20241022` - Fast and cost-effective

#### Claude 3 Family (Legacy - Some Deprecated)
- `claude-3-haiku-20240307` - Basic Haiku (still available)
- Claude 3 Opus (deprecated June 30, 2025, retiring Jan 5, 2026)
- Claude 3 Sonnet (retired July 21, 2025)

**Recommendations**:
- Complex tasks: `claude-opus-4-6-20260205`
- Balanced performance: `claude-sonnet-4-5-20250929`
- Speed/cost optimization: `claude-haiku-4-5-20251001`

---

### `max_tokens` (integer)
**Required**: Yes
**Description**: Maximum number of tokens to generate before stopping
**Type**: integer
**Valid Range**: 1 to model maximum

**Model-Specific Limits**:
- Claude Opus 4.6: Up to 128,000 output tokens
- Claude Opus 4.5 and earlier: Up to 64,000 output tokens
- Varies by model - check model documentation for specific limits

**Important Notes**:
- Models may stop before reaching this limit
- `stop_reason` will indicate why generation stopped
- When using extended thinking, `budget_tokens` must be less than `max_tokens`

---

### `messages` (array)
**Required**: Yes
**Description**: Array of conversational messages
**Type**: array of message objects
**Limit**: 100,000 messages per request

**Message Structure**:
```json
{
  "role": "user" | "assistant",
  "content": "string" | [content_blocks]
}
```

**Roles**:
- `"user"` - User input messages
- `"assistant"` - Assistant responses (for multi-turn conversations)
- Note: "system" role is NOT used in messages; use the `system` parameter instead

**Content Types**:
1. **Simple string**: `"content": "Hello, Claude"`
2. **Content blocks array**: Multiple text, image, document, or tool blocks

**Constraints**:
- First message must have role "user"
- Roles must alternate between user and assistant (consecutive same-role messages are combined)
- Cannot have two consecutive messages with the same role explicitly specified

---

## 2. Optional Core Parameters

### `system` (string or array)
**Required**: No
**Description**: System prompt providing context and instructions
**Type**: string or array of content blocks

**Examples**:
```json
// Simple string
"system": "You are a helpful AI assistant specialized in Python programming."

// Array of blocks (for caching)
"system": [
  {
    "type": "text",
    "text": "You are a helpful assistant...",
    "cache_control": {"type": "ephemeral"}
  }
]
```

**Use Cases**:
- Set behavior and personality
- Provide context and background information
- Define response formatting requirements
- Establish rules and constraints

---

### `temperature` (number)
**Required**: No
**Default**: 1.0
**Valid Range**: 0.0 to 1.0
**Type**: float

**Description**: Controls randomness in the response. Lower values make output more deterministic and focused; higher values make it more creative and varied.

**Guidelines**:
- **~0.0**: Analytical tasks, multiple choice, data extraction
- **~0.5**: Balanced responses
- **~1.0**: Creative and generative tasks

**Important Notes**:
- Results won't be fully deterministic even at 0.0
- **BREAKING CHANGE (Claude 4+)**: Cannot be specified alongside `top_p`
- Error if both specified: `"temperature and top_p cannot both be specified"`
- Claude 3.x models allowed both (though not recommended); Claude 4+ enforces mutual exclusivity

**Model-Specific Differences**:
- Claude 3.x: Both `temperature` and `top_p` could be specified (not recommended)
- Claude 4+: **Mutually exclusive** - specify only one

---

### `top_p` (number)
**Required**: No
**Default**: Model default
**Valid Range**: 0.0 to 1.0
**Type**: float

**Description**: Nucleus sampling - the model considers tokens with `top_p` probability mass. Alternative to sampling with temperature.

**Usage**:
- Advanced parameter for fine-grained control
- Most users should use `temperature` instead

**Important Notes**:
- **BREAKING CHANGE (Claude 4+)**: Cannot be specified alongside `temperature`
- Mutually exclusive with `top_k` (in practice)
- Recommended for advanced use cases only

---

### `top_k` (integer)
**Required**: No
**Description**: Only sample from top K options per token
**Type**: integer

**Usage**:
- **Advanced use cases only**
- Most users should use `temperature` instead
- Provides deterministic sampling by limiting token choices

**Recommendations**:
- Only use if you have specific sampling requirements
- Generally unnecessary for most applications

---

### `stop_sequences` (array of strings)
**Required**: No
**Description**: Custom text sequences that cause the model to stop generating
**Type**: array of strings
**Default**: `["\n\nHuman:"]` (built-in)

**Examples**:
```json
"stop_sequences": ["---END---", "\n\nUser:", "###"]
```

**Behavior**:
- When matched, response `stop_reason` becomes `"stop_sequence"`
- Response includes `stop_sequence` field with the matched sequence
- Claude models automatically stop on `"\n\nHuman:"` and may include additional built-in sequences

**Use Cases**:
- Structured output generation
- Template-based responses
- Multi-part content generation

---

### `stream` (boolean)
**Required**: No
**Default**: false
**Type**: boolean

**Description**: Enable incremental streaming via server-sent events (SSE)

**Values**:
- `false`: Wait for complete response (default)
- `true`: Stream response incrementally as server-sent events

**Benefits**:
- Reduced perceived latency
- Better user experience for long responses
- Prevents HTTP timeouts on large `max_tokens` values

**Stream Events**:
- `message_start` - Initial message metadata
- `content_block_start` - Start of content block
- `content_block_delta` - Incremental content
- `content_block_stop` - End of content block
- `message_delta` - Usage statistics updates
- `message_stop` - Final message completion

---

## 3. Tool Parameters

### `tools` (array)
**Required**: No
**Description**: Array of tool definitions available to the model
**Type**: array of tool objects

**Tool Structure**:
```json
{
  "name": "tool_name",
  "description": "Detailed description of what this tool does",
  "input_schema": {
    "type": "object",
    "properties": {
      "param_name": {
        "type": "string",
        "description": "Parameter description"
      }
    },
    "required": ["param_name"]
  }
}
```

**Notes**:
- Tool names must be unique
- Use JSON Schema for `input_schema`
- Provide detailed descriptions for best results

---

### `tool_choice` (object)
**Required**: No
**Description**: Controls how the model uses provided tools
**Type**: object

**Valid Values**:
```json
// Model decides whether to use tools
{"type": "auto"}

// Model must use at least one tool
{"type": "any"}

// Model must use specific tool
{"type": "tool", "name": "tool_name"}

// Model cannot use tools
{"type": "none"}
```

**Additional Options**:
- `disable_parallel_tool_use` (boolean): Limit model to one tool use at a time

---

## 4. Extended Thinking / Reasoning Parameters

### `thinking` (object)
**Required**: No
**Description**: Configure extended thinking (visible reasoning)
**Type**: object

**Structure**:
```json
{
  "type": "enabled" | "disabled" | "adaptive",
  "budget_tokens": 1024  // Optional, minimum 1024
}
```

**Types**:
- `"enabled"` - Always use extended thinking with specified budget
- `"disabled"` - No extended thinking
- `"adaptive"` - **Recommended** - Claude decides when to think based on problem complexity

**Important Notes**:
- `budget_tokens` **deprecated on Claude Opus 4.6+** - use `effort` parameter instead
- Minimum budget: 1,024 tokens
- Budget must be less than `max_tokens`
- Extended thinking tokens billed as output tokens at standard rates
- Default thinking budget: 31,999 tokens (MAX: 63,999 for 64K+ output models)

**Model Support**:
- All Claude 4 models: Adaptive thinking supported
- Claude Opus 4.6+: Use `effort` parameter instead of `budget_tokens`

**Adaptive Thinking Benefits**:
- Claude evaluates complexity and decides whether to think
- Automatically enables interleaved thinking (thinking between tool calls)
- More efficient token usage
- Better for agentic workflows

---

### `output_config` (object)
**Required**: No
**Description**: Configure output format and generation effort
**Type**: object

**Structure**:
```json
{
  "format": {
    "type": "json_schema",
    "schema": {...}  // JSON Schema definition
  },
  "effort": "low" | "medium" | "high" | "max"
}
```

**Effort Parameter** (Claude 4+):
- **`"low"`** - Minimal thinking, faster responses, lower token usage
- **`"medium"`** - Moderate thinking for balanced performance
- **`"high"`** - Default, thorough thinking for most problems
- **`"max"`** - Maximum thinking depth for complex problems

**How Effort Works**:
- At default (`"high"`), Claude will almost always think
- Lower effort levels may skip thinking for simpler problems
- Effort is a behavioral signal, not a strict token budget
- Use with adaptive thinking: `thinking: {"type": "adaptive"}`

**Structured Outputs**:
- Use `format` field to enforce JSON schema compliance
- Available on Claude Sonnet 4.5, Opus 4.5, Haiku 4.5+
- Requires beta header: `structured-outputs-2025-11-13`
- Previously used `output_format` parameter (now `output_config.format`)

**Recommendations**:
- Use `effort` instead of `budget_tokens` on Claude Opus 4.6+
- Combine with adaptive thinking for best results
- Start with default (`"high"`) and adjust based on needs

---

## 5. Prompt Caching Parameters

### `cache_control` (object in content blocks)
**Required**: No
**Description**: Mark content for reuse across API requests
**Type**: object within content blocks

**Structure**:
```json
{
  "type": "ephemeral",
  "ttl": "5m" | "1h"  // Optional
}
```

**Cache Types**:
- `"ephemeral"` - Only supported type
  - Default TTL: 5 minutes
  - Extended TTL: 1 hour (requires beta header)

**TTL Options**:
- `"5m"` - 5-minute cache (default, no beta header needed)
- `"1h"` - 1-hour cache (requires beta header: `extended-cache-ttl-2025-04-11`)

**Where to Use**:
- System prompts
- Tool definitions
- Text content blocks
- Image blocks
- Document blocks

**Example**:
```json
{
  "system": [
    {
      "type": "text",
      "text": "Long system prompt...",
      "cache_control": {"type": "ephemeral", "ttl": "1h"}
    }
  ]
}
```

**Pricing** (as of 2026):
- **5-minute cache write**: 1.25x base input token price
- **1-hour cache write**: 2.0x base input token price
- **Cache read**: 0.1x base input token price (90% savings)

**Model Support**:
- All models: 5-minute TTL
- Claude Opus 4.5+, Haiku 4.5+, Sonnet 4.5+: 1-hour TTL

**Cache Isolation** (Updated Feb 5, 2026):
- **Claude API & Azure**: Workspace-level isolation
- **Amazon Bedrock & Google Vertex AI**: Organization-level isolation

**Important Notes**:
- No beta header needed for basic 5-minute caching
- Beta header only for 1-hour TTL: `extended-cache-ttl-2025-04-11`
- Cache breakpoints must be strategic - end of system prompts, tools, or large context
- Thinking blocks cannot be explicitly cached but are cached as part of request content

---

## 6. Advanced Parameters

### `metadata` (object)
**Required**: No
**Description**: Attach metadata to the request for tracking and abuse detection
**Type**: object

**Structure**:
```json
{
  "user_id": "uuid-or-hash-identifier"
}
```

**Guidelines**:
- Use opaque identifiers (UUIDs or hashes)
- **Never** include PII: names, emails, phone numbers
- Helps with abuse detection and usage tracking

---

### `service_tier` (string)
**Required**: No
**Default**: `"auto"`
**Description**: Choose service tier for capacity and reliability

**Valid Values**:
- `"auto"` - Use priority capacity if available, fall back to standard (default)
- `"standard_only"` - Use only standard capacity

**Priority Tier Features**:
- Target 99.5% uptime
- Prioritized computational resources
- Predictable spend with volume discounts
- Automatic fallback to standard tier when capacity exceeded
- Requires commitment purchase

---

### `inference_geo` (string)
**Required**: No
**Description**: Geographic region for inference processing (data residency)
**Type**: string

**Valid Values**:
- `"us"` - US-only inference (1.1x pricing)
- Default: Global routing (standard pricing)

**Pricing**:
- US-only inference: **1.1x multiplier** on all token types (input, output, cache)
- Applies to models released after February 1, 2026
- Priority tier capacity: 1.1 tokens consumed per token with `inference_geo: "us"`

**Use Cases**:
- Compliance requirements
- Data residency regulations
- Latency optimization

---

## 7. Content Block Types

### Text Block
```json
{
  "type": "text",
  "text": "Content string",
  "cache_control": {"type": "ephemeral", "ttl": "5m"},
  "citations": {
    "enabled": true  // Optional
  }
}
```

---

### Image Block
```json
{
  "type": "image",
  "source": {
    "type": "base64" | "url",
    "data": "base64_encoded_data",  // If type is base64
    "url": "https://...",  // If type is url
    "media_type": "image/jpeg" | "image/png" | "image/gif" | "image/webp"
  },
  "cache_control": {"type": "ephemeral"}  // Optional
}
```

**Supported Media Types**:
- `image/jpeg`
- `image/png`
- `image/gif`
- `image/webp`

---

### Document Block
```json
{
  "type": "document",
  "source": {
    "type": "base64" | "url" | "file",
    "data": "base64_pdf_data",  // If type is base64
    "url": "https://...",  // If type is url
    "file_id": "file_id",  // If type is file
    "media_type": "application/pdf" | "text/plain"
  },
  "title": "Optional document title",
  "context": "Optional context about the document",
  "cache_control": {"type": "ephemeral"}  // Optional
}
```

**Supported Media Types**:
- `application/pdf` - PDF documents (text and visual content)
- `text/plain` - Plain text documents

**PDF Processing**:
- Claude extracts contents and converts each page to an image
- Supports both text and visual content in PDFs
- Available on Claude Opus 4.6+ and other recent models
- Files API requires beta header: `files-api-2025-04-14`

---

### Tool Use Block (in responses)
```json
{
  "type": "tool_use",
  "id": "unique_identifier",
  "name": "tool_name",
  "input": {
    // Tool parameters
  }
}
```

---

### Tool Result Block (in follow-up requests)
```json
{
  "type": "tool_result",
  "tool_use_id": "matches_tool_use_id",
  "content": "Result data or error"
}
```

---

## 8. Citations Parameter

### `citations` (object in document blocks)
**Required**: No
**Description**: Enable automatic source attribution
**Type**: object

**Structure**:
```json
{
  "enabled": true
}
```

**How It Works**:
1. Add source documents to context with citations enabled
2. Claude automatically cites claims inferred from sources
3. Citations appear inline in the response

**Benefits**:
- **Cost savings**: Cited text doesn't count toward output tokens
- **Accuracy**: 15% increase in recall accuracy vs. custom implementations
- **Transparency**: Users can verify information sources

**Example Usage**:
```json
{
  "messages": [{
    "role": "user",
    "content": [
      {
        "type": "document",
        "source": {...},
        "title": "Research Paper",
        "citations": {"enabled": true}
      },
      {
        "type": "text",
        "text": "Summarize the key findings"
      }
    ]
  }]
}
```

---

## 9. Beta Headers

### Using Beta Features
**Header Name**: `anthropic-beta`
**Format**: Comma-separated list of feature identifiers

**Available Beta Features (2026)**:

#### Extended Cache TTL (1 hour)
- **Header Value**: `extended-cache-ttl-2025-04-11`
- **Purpose**: Enable 1-hour cache duration
- **Models**: Claude Opus 4.5+, Sonnet 4.5+, Haiku 4.5+

#### Extended Context Window (1M tokens)
- **Header Value**: `context-1m-2025-08-07`
- **Purpose**: Access 1M token context window
- **Models**: Claude Opus 4.6, Sonnet 4.5
- **Platforms**: Claude API, Microsoft Foundry, Amazon Bedrock, Google Vertex AI

#### Structured Outputs
- **Header Value**: `structured-outputs-2025-11-13`
- **Purpose**: Enforce JSON schema compliance
- **Models**: Claude Sonnet 4.5, Opus 4.5, Haiku 4.5+
- **Status**: Generally available (beta header still required)

#### Files API
- **Header Value**: `files-api-2025-04-14`
- **Purpose**: Use file references in document blocks
- **Models**: Claude Opus 4.6+

#### Multiple Features Example
```http
anthropic-beta: extended-cache-ttl-2025-04-11,context-1m-2025-08-07,structured-outputs-2025-11-13
```

**SDK Usage (Python)**:
```python
from anthropic import Anthropic

client = Anthropic()
response = client.beta.messages.create(
    model="claude-opus-4-6-20260205",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello"}],
    betas=[
        "extended-cache-ttl-2025-04-11",
        "context-1m-2025-08-07",
        "structured-outputs-2025-11-13"
    ]
)
```

**Important Notes**:
- Beta features are subject to change
- Always use exact beta header names as documented
- Feature names follow pattern: `feature-name-YYYY-MM-DD`
- Not all beta features work on all platforms (e.g., Bedrock, Vertex AI)

---

## 10. Response Object Structure

### Response Fields

```json
{
  "id": "msg_01ABC...",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Response content"
    }
  ],
  "model": "claude-opus-4-6-20260205",
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 100,
    "output_tokens": 50,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 0,
    "server_tool_use": {
      "web_search_requests": 0
    },
    "service_tier": "standard"
  }
}
```

### `stop_reason` Values

- **`"end_turn"`** - Conversational turn ended naturally
- **`"max_tokens"`** - Reached `max_tokens` limit
- **`"stop_sequence"`** - Matched a stop sequence
- **`"tool_use"`** - Model wants to use a tool
- **`"pause_turn"`** - Model paused (streaming)
- **`"refusal"`** - Model refused to respond (safety)

### Usage Token Fields

- **`input_tokens`** - Regular input tokens consumed
- **`output_tokens`** - Output tokens generated
- **`cache_creation_input_tokens`** - Tokens written to cache
- **`cache_read_input_tokens`** - Tokens read from cache (90% savings)
- **`server_tool_use`** - Server-side tool usage statistics
- **`service_tier`** - Which tier processed the request (`"standard"`, `"priority"`, `"batch"`)

---

## 11. Complete API Request Example

```http
POST https://api.anthropic.com/v1/messages
Content-Type: application/json
anthropic-version: 2023-06-01
anthropic-beta: extended-cache-ttl-2025-04-11,context-1m-2025-08-07
X-Api-Key: $ANTHROPIC_API_KEY

{
  "model": "claude-opus-4-6-20260205",
  "max_tokens": 16000,
  "system": [
    {
      "type": "text",
      "text": "You are an expert Python developer...",
      "cache_control": {"type": "ephemeral", "ttl": "1h"}
    }
  ],
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "document",
          "source": {
            "type": "base64",
            "data": "JVBERi0...",
            "media_type": "application/pdf"
          },
          "title": "API Documentation",
          "citations": {"enabled": true},
          "cache_control": {"type": "ephemeral"}
        },
        {
          "type": "text",
          "text": "Explain the authentication flow"
        }
      ]
    }
  ],
  "thinking": {"type": "adaptive"},
  "output_config": {"effort": "high"},
  "temperature": 0.7,
  "stop_sequences": ["---END---"],
  "tools": [
    {
      "name": "search_docs",
      "description": "Search documentation database",
      "input_schema": {
        "type": "object",
        "properties": {
          "query": {"type": "string", "description": "Search query"}
        },
        "required": ["query"]
      }
    }
  ],
  "tool_choice": {"type": "auto"},
  "metadata": {
    "user_id": "user-abc123"
  },
  "service_tier": "auto",
  "inference_geo": "us"
}
```

---

## 12. Model-Specific Differences Summary

### Claude 4+ vs Claude 3.x Breaking Changes

| Feature | Claude 3.x | Claude 4+ |
|---------|------------|-----------|
| **temperature + top_p** | Both allowed (not recommended) | **Mutually exclusive** - Error if both specified |
| **Extended Thinking** | `budget_tokens` parameter | `budget_tokens` deprecated on Opus 4.6+; use `effort` |
| **Adaptive Thinking** | Not available | `thinking: {"type": "adaptive"}` recommended |
| **Effort Parameter** | Not available | `output_config.effort`: low/medium/high/max |
| **Output Tokens** | Up to 64K | Opus 4.6: Up to 128K |
| **Context Window** | 200K standard | 1M with beta header |
| **Structured Outputs** | Limited support | Full support with beta header |

### Context Window Support

| Model | Standard | With Beta Header |
|-------|----------|------------------|
| Claude Opus 4.6 | 200K | 1M |
| Claude Sonnet 4.5 | 200K | 1M |
| Claude Haiku 4.5 | 200K | 200K |
| Claude 3.x models | 200K | 200K |

### Cache TTL Support

| Model | 5-Minute Cache | 1-Hour Cache |
|-------|----------------|--------------|
| Claude Opus 4.6, 4.5 | ✓ | ✓ |
| Claude Sonnet 4.5 | ✓ | ✓ |
| Claude Haiku 4.5 | ✓ | ✓ |
| Claude 3.x models | ✓ | ✗ |

### Extended Thinking / Reasoning

| Model | budget_tokens | Adaptive Thinking | Effort Parameter |
|-------|---------------|-------------------|------------------|
| Claude Opus 4.6 | Deprecated | ✓ Recommended | ✓ Recommended |
| Claude Opus 4.5 | ✓ | ✓ | ✓ |
| Claude Sonnet 4.5 | ✓ | ✓ | ✓ |
| Claude Haiku 4.5 | ✓ | ✓ | ✓ |
| Claude 3.x models | Limited | ✗ | ✗ |

---

## 13. Migration Guidelines

### Migrating from Claude 3.x to Claude 4+

#### Critical Changes

1. **Temperature + Top_p Conflict**
   ```json
   // ❌ This will error on Claude 4+
   {
     "temperature": 0.7,
     "top_p": 0.9
   }

   // ✓ Use only one
   {
     "temperature": 0.7
   }
   ```

2. **Extended Thinking (Opus 4.6+)**
   ```json
   // ❌ Deprecated on Opus 4.6
   {
     "thinking": {
       "type": "enabled",
       "budget_tokens": 10000
     }
   }

   // ✓ Use adaptive thinking + effort
   {
     "thinking": {"type": "adaptive"},
     "output_config": {"effort": "high"}
   }
   ```

3. **Structured Outputs**
   ```json
   // ❌ Old parameter
   {
     "output_format": {...}
   }

   // ✓ New parameter
   {
     "output_config": {
       "format": {
         "type": "json_schema",
         "schema": {...}
       }
     }
   }
   ```

4. **Default Temperature**
   - Console default changed from 0 to 1 for consistency with API
   - Explicitly set temperature if you need deterministic behavior

---

## 14. Best Practices

### Parameter Selection

1. **Use `temperature` instead of `top_p` or `top_k`** for most use cases
2. **Use adaptive thinking** (`thinking: {"type": "adaptive"}`) with `effort` parameter
3. **Don't specify both** `temperature` and `top_p` on Claude 4+
4. **Start with defaults** and adjust based on observed behavior
5. **Use prompt caching** for repeated context (system prompts, tools, documents)

### Performance Optimization

1. **Enable streaming** for better UX on long responses
2. **Use lower effort** for simple queries to save tokens
3. **Cache large system prompts** and tool definitions with 1-hour TTL
4. **Set appropriate `max_tokens`** to avoid unnecessary generation

### Cost Optimization

1. **Enable prompt caching** for repeated content (90% cost reduction)
2. **Use citations** to exclude cited text from output token billing
3. **Choose appropriate model tier** (Haiku for speed/cost, Opus for complex tasks)
4. **Use adaptive thinking** instead of fixed thinking budgets

### Security and Privacy

1. **Use opaque identifiers** in metadata (no PII)
2. **Consider `inference_geo`** for data residency requirements
3. **Use Priority Tier** for production workloads requiring high availability

---

## 15. References and Sources

### Official Documentation
- [Messages API Reference - Claude API Docs](https://docs.anthropic.com/en/api/messages)
- [Messages API Reference - Platform Claude](https://platform.claude.com/docs/en/api/messages)
- [Using the Messages API - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/working-with-messages)
- [Models Overview - Claude API Docs](https://platform.claude.com/docs/en/about-claude/models/overview)

### Prompt Caching
- [Prompt Caching - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Prompt Caching - Anthropic Documentation](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching?s=09)
- [Prompt Caching with Claude - Anthropic News](https://www.anthropic.com/news/prompt-caching)

### Extended Thinking
- [Building with Extended Thinking - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
- [Adaptive Thinking - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Effort Parameter - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/effort)
- [Claude's Extended Thinking - Anthropic News](https://www.anthropic.com/news/visible-extended-thinking)

### Model Updates
- [Migrating to Claude 4.5 - Claude API Docs](https://platform.claude.com/docs/en/about-claude/models/migrating-to-claude-4)
- [Introducing Claude Opus 4.6 - Anthropic News](https://www.anthropic.com/news/claude-opus-4-6)
- [Model Deprecations - Claude API Docs](https://platform.claude.com/docs/en/about-claude/model-deprecations)

### Advanced Features
- [Citations - Claude API Docs](https://docs.anthropic.com/en/docs/build-with-claude/citations)
- [Introducing Citations API - Anthropic News](https://www.anthropic.com/news/introducing-citations-api)
- [PDF Support - Claude API Docs](https://docs.anthropic.com/en/docs/build-with-claude/pdf-support)
- [Beta Headers - Claude API Docs](https://docs.anthropic.com/en/api/beta-headers)
- [Service Tiers - Claude API Docs](https://docs.anthropic.com/en/api/service-tiers)

### Third-Party References
- [Anthropic Claude Messages API - Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages.html)
- [Request and Response - Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages-request-response.html)
- [Extended Thinking - Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/claude-messages-extended-thinking.html)
- [Anthropic's Claude Models - Google Vertex AI](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/partner-models/claude)

### Community and Implementation
- [anthropic-sdk-python - GitHub](https://github.com/anthropics/anthropic-sdk-python)
- [Anthropic | liteLLM](https://docs.litellm.ai/docs/providers/anthropic)
- [AI SDK Providers: Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)

---

## 16. Quick Reference Table

| Parameter | Type | Required | Default | Valid Range | Claude 4+ Notes |
|-----------|------|----------|---------|-------------|-----------------|
| `model` | string | ✓ | - | See model list | Use versioned IDs |
| `max_tokens` | integer | ✓ | - | 1 to 128000 | Opus 4.6: 128K max |
| `messages` | array | ✓ | - | 1-100000 messages | Must start with user |
| `system` | string/array | ✗ | - | Any | Can include cache_control |
| `temperature` | float | ✗ | 1.0 | 0.0 - 1.0 | **Cannot use with top_p** |
| `top_p` | float | ✗ | - | 0.0 - 1.0 | **Cannot use with temperature** |
| `top_k` | integer | ✗ | - | Any positive int | Advanced use only |
| `stop_sequences` | array | ✗ | `["\n\nHuman:"]` | Array of strings | Multiple supported |
| `stream` | boolean | ✗ | false | true/false | Use for long responses |
| `tools` | array | ✗ | - | Tool objects | Supports parallel use |
| `tool_choice` | object | ✗ | `{"type": "auto"}` | See tool_choice | Can force specific tool |
| `thinking` | object | ✗ | - | enabled/disabled/adaptive | **adaptive recommended** |
| `output_config` | object | ✗ | - | format, effort | **effort replaces budget_tokens** |
| `metadata` | object | ✗ | - | `{"user_id": "..."}` | Use opaque identifiers |
| `service_tier` | string | ✗ | `"auto"` | auto/standard_only | Priority tier available |
| `inference_geo` | string | ✗ | global | us/global | US-only is 1.1x pricing |

---

## 17. Common Error Scenarios

### Temperature + Top_p Error (Claude 4+)
```json
// Error: "temperature and top_p cannot both be specified"
{
  "temperature": 0.7,
  "top_p": 0.9  // ❌ Remove this
}
```

### Invalid Thinking Budget
```json
// Error: budget_tokens must be less than max_tokens
{
  "max_tokens": 1000,
  "thinking": {
    "type": "enabled",
    "budget_tokens": 2000  // ❌ Must be < max_tokens
  }
}
```

### Missing Required Parameters
```json
// Error: Missing required fields
{
  "model": "claude-opus-4-6-20260205"
  // ❌ Missing max_tokens and messages
}
```

### Invalid Message Structure
```json
// Error: First message must be user role
{
  "messages": [
    {"role": "assistant", "content": "Hi"}  // ❌ Must start with user
  ]
}
```

---

## Document History

- **2026-02-09**: Initial comprehensive research document created
- Based on official Anthropic documentation as of February 2026
- Includes latest Claude 4.6 (Opus) features and parameters
- Documents breaking changes from Claude 3.x to Claude 4+ family

---

## Next Steps

1. **Test parameter combinations** with your specific use cases
2. **Monitor token usage** with different cache configurations
3. **Experiment with effort levels** to find optimal quality/cost balance
4. **Implement adaptive thinking** for complex agentic workflows
5. **Benchmark performance** across different model tiers for your workload
