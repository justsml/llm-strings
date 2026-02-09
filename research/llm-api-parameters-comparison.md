# LLM API Parameters Comparison: Google Gemini, Mistral AI, and Cohere

**Date**: 2026-02-09
**Status**: Complete
**Related Research**: N/A

## Executive Summary

This comprehensive research document compares the API parameters across three major LLM providers: Google Gemini, Mistral AI, and Cohere. Key findings:

1. **Naming Conventions**: Gemini uses camelCase (e.g., `maxOutputTokens`), while Mistral and Cohere use snake_case (e.g., `max_tokens`)
2. **Temperature Ranges**: Gemini supports 0.0-2.0, Mistral recommends 0.0-0.7, Cohere defaults to 0.3
3. **Max Tokens**: Different naming across providers - `maxOutputTokens` (Gemini), `max_tokens` (Mistral/Cohere)
4. **Caching**: Gemini offers sophisticated implicit and explicit caching with 75-90% cost savings; Mistral and Cohere have more limited caching features
5. **Safety Features**: All providers offer safety modes, with implementation varying significantly

---

## Research Objectives

- Document all parameters for generateContent (Gemini), chat completions (Mistral), and chat (Cohere) endpoints
- Identify valid ranges for numeric parameters
- Compare parameter naming conventions across providers
- Understand caching implementations and differences
- Create structured comparison tables for quick reference

---

## Detailed Findings

### 1. Google Gemini API (generateContent endpoint)

#### Core Parameters

| Parameter | Type | Description | Valid Range | Default |
|-----------|------|-------------|-------------|---------|
| `temperature` | float | Controls randomness in token selection. Lower = more deterministic, higher = more creative | 0.0 - 2.0 | 1.0 (recommended) |
| `topP` | float | Nucleus sampling - considers tokens with top P probability mass | 0.0 - 1.0 | 0.95 |
| `topK` | int | Top-k sampling - considers K most probable tokens | >= 1 | 20 |
| `maxOutputTokens` | int | Maximum tokens to generate (1 token ≈ 4 chars, 100 tokens ≈ 60-80 words) | Model-dependent | Model's max |
| `candidateCount` | int | Number of response candidates to generate | >= 1 | 1 |
| `stopSequences` | array[string] | Sequences where generation stops | N/A | [] |
| `responseMimeType` | string | MIME type of response (e.g., "application/json" for structured output) | Valid MIME types | "text/plain" |
| `responseSchema` | object | JSON schema for structured output (used with responseMimeType) | Valid JSON schema | null |
| `presencePenalty` | float | Penalizes tokens based on presence in text | Typically 0.0 - 2.0 | 0.0 |
| `frequencyPenalty` | float | Penalizes tokens based on frequency in text | Typically 0.0 - 2.0 | 0.0 |
| `seed` | int | For deterministic sampling | Any integer | null |

#### Naming Convention
**camelCase** - All parameters use camelCase (e.g., `maxOutputTokens`, `topP`, `stopSequences`)

#### Context Caching Features

Gemini offers two types of caching:

**Implicit Caching** (Enabled by default as of May 8, 2025):
- Automatic caching with no configuration needed
- Minimum request size: 1024 tokens (Gemini 2.5 Flash), 2048 tokens (Gemini 2.5 Pro)
- Cost savings automatically passed on when cache hits occur
- 75% discount on Gemini 2.0 models, 90% discount on Gemini 2.5+ models

**Explicit Caching**:
- Developer-controlled caching with guaranteed discounts
- Cache content once, reuse across multiple requests
- Configurable Time to Live (TTL), default 60 minutes
- Supports all modalities: text, PDF, image, audio, video
- 10% of standard input token cost for cached tokens (90% savings on Gemini 2.5+)
- Best for high-volume repeated content scenarios

#### Cost Benefits
- Gemini 2.5 models: 90% discount on cached tokens
- Gemini 2.0 models: 75% discount on cached tokens
- Reduces both cost and latency for repeated content

---

### 2. Mistral AI API (chat completions endpoint)

#### Core Parameters

| Parameter | Type | Description | Valid Range | Default |
|-----------|------|-------------|-------------|---------|
| `temperature` | float | Controls randomness (0.2 = focused, 0.7 = random). Alter temperature OR top_p, not both | 0.0 - 2.0 (recommend 0.0-0.7) | ~0.7 |
| `top_p` | float | Nucleus sampling - considers tokens with top P probability mass. Alter this OR temperature, not both | 0.0 - 1.0 | varies |
| `max_tokens` | int | Maximum tokens to generate. Prompt + max_tokens cannot exceed context length | Model-dependent | Model's max |
| `random_seed` | int | For deterministic sampling. Use for tests/evals, remove for live chats | Any integer | null |
| `safe_prompt` | boolean | Injects safety prompt before conversations (content filtering) | true/false | false |
| `response_format` | object | Format specification. `{"type": "text"}` or `{"type": "json_object"}` for JSON mode | See description | `{"type": "text"}` |
| `stop` | string or array[string] | Stop generation when token(s) detected | N/A | null |
| `stream` | boolean | Stream partial progress as server-sent events | true/false | false |
| `messages` | array[object] | Prompt(s) encoded as list with role and content | N/A | required |
| `model` | string | Model ID to use | Valid model ID | required |
| `frequency_penalty` | float | Penalizes token repetition based on frequency | -2.0 - 2.0 | 0.0 |
| `presence_penalty` | float | Penalizes tokens based on presence (flat penalty regardless of frequency) | -2.0 - 2.0 | 0.0 |
| `min_tokens` | int | Minimum tokens to generate before EOS can be generated | >= 0 | 0 |
| `n` | int | Number of completions to return per request | >= 1 | 1 |

**Note**: `mistral-large-2512` does not support N completions parameter.

#### Naming Convention
**snake_case** - All parameters use snake_case (e.g., `max_tokens`, `top_p`, `random_seed`, `safe_prompt`)

#### JSON Mode
When using `response_format: {"type": "json_object"}`:
- Guarantees JSON output
- Must also instruct the model to produce JSON in system or user message
- Can specify json_schema for structured output

#### Safety Features
- `safe_prompt`: Boolean flag to inject safety instructions
- Content filtering available but less granular than Cohere's safety modes

---

### 3. Cohere API (chat endpoint)

#### Core Parameters

| Parameter | Type | Description | Valid Range | Default |
|-----------|------|-------------|-------------|---------|
| `temperature` | float | Controls randomness in generation | >= 0.0 | 0.3 |
| `max_tokens` | int | Maximum output tokens. Low values may cause incomplete generations | Model-dependent | Model's max |
| `p` (or `top_p`) | float | Nucleus sampling - only most likely tokens with total probability mass P are considered | 0.01 - 0.99 | 0.75 |
| `k` (or `top_k`) | int | Top-k sampling - only top K most likely tokens considered. If both k and p enabled, p acts after k | 0 - 500 | 0 |
| `frequency_penalty` | float | Reduces repetition by penalizing tokens proportional to their frequency in generated text | 0.0 - 1.0 | 0.0 |
| `presence_penalty` | float | Reduces repetition by penalizing all previously present tokens equally (flat penalty) | 0.0 - 1.0 | 0.0 |
| `seed` | int | For deterministic sampling (best effort, not fully guaranteed) | Any integer | null |
| `stop_sequences` | array[string] | Up to 5 strings to stop generation. Sets finish_reason to "stop_sequence" | Max 4-5 sequences | [] |
| `messages` | array[object] | Chat history in chronological order | N/A | required |
| `model` | string | Compatible Cohere model name | Valid model name | required |
| `response_format` | object | Forces model output to adhere to specified format (Command R, R+ and newer) | Format specification | null |
| `conversation_id` | string | Creates/resumes persisted conversation with specified ID (any non-empty string) | Any string | null |
| `safety_mode` | string | Safety instruction mode: "CONTEXTUAL", "STRICT", or "OFF" | See detailed section | "CONTEXTUAL" |
| `tools` | array[object] | Functions available to the model | Function definitions | [] |
| `documents` | array[object] | Relevant documents for RAG (Retrieval-Augmented Generation) | Document objects | [] |

#### Naming Convention
**snake_case** - All parameters use snake_case (e.g., `max_tokens`, `top_p`, `frequency_penalty`)

**Note**: Parameters also accept short forms: `p` for `top_p`, `k` for `top_k`

#### Safety Mode Details

**CONTEXTUAL (Default)**:
- Fewer constraints on output
- Rejects harmful/illegal suggestions
- Allows profanity, some toxic content, sexually explicit/violent content
- Allows medical, financial, legal information
- Best for: Entertainment, creative, academic use

**STRICT**:
- Avoids sensitive topics (violence, sexual content, profanity)
- Provides safer experience by prohibiting inappropriate responses
- Best for: Corporate communications, customer service

**OFF**:
- No safety mode applied

**Limitations**:
- Not configurable with `tools` and `documents` parameters
- Only compatible with Command R 08-2024+ and Command R+ 08-2024+
- command-r7b-12-2024 and newer only support "CONTEXTUAL" and "STRICT"

#### Penalty Mechanism Differences

**Frequency Penalty**: Scales based on token frequency
- Token appearing 10 times gets higher penalty than token appearing once
- Proportional to appearance count

**Presence Penalty**: Flat penalty
- Same penalty regardless of how many times token appeared
- Binary: appeared or not

#### OpenAI Compatibility
Cohere's Compatibility API supports: `seed`, `top_p`, `frequency_penalty`, `presence_penalty` for OpenAI SDK integration.

---

## Comparative Analysis

### Parameter Naming Conventions

| Provider | Convention | Example Parameters |
|----------|-----------|-------------------|
| **Gemini** | camelCase | `maxOutputTokens`, `topP`, `topK`, `stopSequences`, `responseMimeType` |
| **Mistral** | snake_case | `max_tokens`, `top_p`, `random_seed`, `safe_prompt`, `response_format` |
| **Cohere** | snake_case | `max_tokens`, `top_p`, `top_k`, `stop_sequences`, `frequency_penalty` |

**Key Insight**: Gemini is the outlier with camelCase. Mistral and Cohere follow OpenAI's snake_case convention.

---

### Temperature Parameter Comparison

| Provider | Valid Range | Recommended Range | Default | Notes |
|----------|-------------|-------------------|---------|-------|
| **Gemini** | 0.0 - 2.0 | Start at 1.0 | 1.0 | Wider range for more creative outputs |
| **Mistral** | 0.0 - 2.0 | 0.0 - 0.7 | ~0.7 | Explicitly recommends lower range despite supporting up to 2.0 |
| **Cohere** | >= 0.0 | N/A | 0.3 | Conservative default, no documented upper limit |

**Key Insight**: While all support similar ranges, Mistral recommends much lower values (0.0-0.7), and Cohere defaults to the most conservative value (0.3).

---

### Max Tokens Parameter Comparison

| Provider | Parameter Name | Description | Constraints |
|----------|---------------|-------------|-------------|
| **Gemini** | `maxOutputTokens` | Limits generated tokens (100 tokens ≈ 60-80 words) | Must not exceed model's max |
| **Mistral** | `max_tokens` | Maximum tokens to generate | Prompt + max_tokens ≤ context length |
| **Cohere** | `max_tokens` | Maximum output tokens | Low values may cause incomplete generations |

**Key Insight**: Different naming (camelCase vs snake_case) but similar functionality. Gemini provides helpful guidance (100 tokens ≈ 60-80 words).

---

### Top-P (Nucleus Sampling) Comparison

| Provider | Parameter Name | Valid Range | Default | Notes |
|----------|---------------|-------------|---------|-------|
| **Gemini** | `topP` | 0.0 - 1.0 | 0.95 | Works with temperature |
| **Mistral** | `top_p` | 0.0 - 1.0 | varies | Alter top_p OR temperature, not both |
| **Cohere** | `p` or `top_p` | 0.01 - 0.99 | 0.75 | If both k and p enabled, p acts after k |

**Key Insight**: Mistral explicitly warns against using both temperature and top_p simultaneously. Cohere accepts short form `p`. Gemini has highest default (0.95).

---

### Top-K Sampling Comparison

| Provider | Parameter Name | Valid Range | Default | Support |
|----------|---------------|-------------|---------|---------|
| **Gemini** | `topK` | >= 1 | 20 | ✅ Full support |
| **Mistral** | N/A | N/A | N/A | ❌ Not documented |
| **Cohere** | `k` or `top_k` | 0 - 500 | 0 | ✅ Full support |

**Key Insight**: Mistral does not appear to support top-k sampling. Cohere offers the widest range (0-500) and accepts short form `k`.

---

### Stop Sequences Comparison

| Provider | Parameter Name | Format | Max Count | Notes |
|----------|---------------|--------|-----------|-------|
| **Gemini** | `stopSequences` | array[string] | Not specified | Stops generation when reached |
| **Mistral** | `stop` | string or array[string] | Not specified | Flexible: single string or array |
| **Cohere** | `stop_sequences` | array[string] | 4-5 sequences | Sets finish_reason to "stop_sequence" |

**Key Insight**: Mistral offers most flexibility (string or array). Cohere has documented limits and special finish_reason handling.

---

### Frequency and Presence Penalties

| Provider | Frequency Penalty | Presence Penalty | Range |
|----------|------------------|------------------|-------|
| **Gemini** | `frequencyPenalty` | `presencePenalty` | Typically 0.0 - 2.0 |
| **Mistral** | `frequency_penalty` | `presence_penalty` | -2.0 - 2.0 |
| **Cohere** | `frequency_penalty` | `presence_penalty` | 0.0 - 1.0 |

**Key Insights**:
- Mistral allows negative penalties (encourages repetition)
- Cohere has most restrictive range (0.0-1.0 only)
- All three now support both penalties (Gemini added recently)
- Cohere clearly documents the difference: frequency scales with count, presence is flat

---

### Deterministic Sampling (Seed)

| Provider | Parameter Name | Type | Guarantee | Notes |
|----------|---------------|------|-----------|-------|
| **Gemini** | `seed` | int | Not specified | For reproducible results |
| **Mistral** | `random_seed` | int | Deterministic | Use for tests/evals, remove for live chats |
| **Cohere** | `seed` | int | Best effort only | Determinism cannot be fully guaranteed |

**Key Insight**: Cohere is most transparent about limitations. Mistral provides clearest guidance on when to use (tests) vs avoid (production).

---

### Response Format / Structured Output

| Provider | Parameter Name | JSON Mode | Schema Support |
|----------|---------------|-----------|----------------|
| **Gemini** | `responseMimeType` + `responseSchema` | ✅ "application/json" | ✅ Full JSON schema |
| **Mistral** | `response_format` | ✅ `{"type": "json_object"}` | ✅ Can specify json_schema |
| **Cohere** | `response_format` | ✅ Yes | ✅ Supported (Command R+) |

**Key Insights**:
- Gemini uses MIME type approach (more flexible for other formats)
- Mistral and Cohere use similar `response_format` object approach
- Mistral requires explicit instruction in prompt to produce JSON
- All three support JSON schema validation

---

### Safety and Content Filtering

| Provider | Parameter | Options | Granularity |
|----------|-----------|---------|-------------|
| **Gemini** | Various safety settings | Model-dependent | Medium |
| **Mistral** | `safe_prompt` | true/false | Low (binary) |
| **Cohere** | `safety_mode` | "CONTEXTUAL", "STRICT", "OFF" | High (3 levels) |

**Key Insights**:
- Cohere offers most granular safety controls with clear use case guidance
- Mistral has simplest implementation (boolean flag)
- Cohere's safety mode not compatible with tools/documents parameters
- Cohere restricted to newer models (Command R 08-2024+)

---

### Caching Comparison

#### Google Gemini: Advanced Caching

**Implicit Caching** (Automatic):
- Enabled by default since May 8, 2025
- No configuration required
- Minimum sizes: 1024 tokens (Flash 2.5), 2048 tokens (Pro 2.5)
- Automatic cost savings on cache hits
- 75% discount (Gemini 2.0), 90% discount (Gemini 2.5+)

**Explicit Caching** (Controlled):
- Developer manages cache lifecycle
- Configurable TTL (default 60 minutes, can extend)
- Cache any modality: text, PDF, image, audio, video
- Guaranteed 90% cost reduction on cached tokens
- Best for high-volume repeated prompts

**Cost Model**:
- Cached tokens: 10% of standard input cost (Gemini 2.5+)
- 90% savings on Gemini 2.5+
- 75% savings on Gemini 2.0

#### Mistral AI: Limited Caching Information
- No prominent caching features documented in official API docs
- May have undocumented or infrastructure-level caching
- No explicit cache control parameters

#### Cohere: Basic Caching
- Conversation persistence via `conversation_id`
- Not a traditional prompt caching system
- More about maintaining conversation state
- No documented cost savings from caching

**Key Insight**: Gemini has by far the most sophisticated caching system with significant cost benefits. This is a major differentiator, especially for applications with repeated prompts or large context windows.

---

### Unique Features by Provider

#### Gemini Unique Features
- `candidateCount` - Generate multiple response candidates
- `responseMimeType` - MIME type control for flexible output formats
- Advanced two-tier caching system (implicit + explicit)
- Recent additions: `presencePenalty`, `frequencyPenalty`

#### Mistral Unique Features
- `min_tokens` - Ensure minimum generation length before stopping
- `n` - Multiple completions per request (not supported on all models)
- Explicit guidance: alter temperature OR top_p, not both
- Clear documentation on when to use random_seed (tests vs production)

#### Cohere Unique Features
- `conversation_id` - Persistent conversation management
- `safety_mode` - Three-level safety system (CONTEXTUAL, STRICT, OFF)
- `tools` - Native function calling integration
- `documents` - Built-in RAG support
- Short parameter names: `p` for `top_p`, `k` for `top_k`
- OpenAI compatibility API
- Clear documentation of penalty mechanism differences

---

## Implementation Considerations

### Choosing Temperature Values

**For Deterministic/Focused Output**:
- Gemini: 0.0 - 0.5
- Mistral: 0.0 - 0.3 (within recommended range)
- Cohere: Use default 0.3 or lower

**For Balanced Output**:
- Gemini: 0.7 - 1.0 (1.0 is recommended starting point)
- Mistral: 0.5 - 0.7
- Cohere: 0.5 - 0.8

**For Creative Output**:
- Gemini: 1.2 - 2.0
- Mistral: Avoid (not recommended beyond 0.7)
- Cohere: 1.0+ (no documented upper limit)

### Token Budget Planning

When implementing max_tokens:

```
Gemini:    maxOutputTokens (100 tokens ≈ 60-80 words)
Mistral:   max_tokens (must ensure prompt + max_tokens ≤ context)
Cohere:    max_tokens (low values may truncate)
```

### Caching Strategy

**Use Gemini when**:
- High-volume applications with repeated prompts
- Large context windows that don't change
- Multimodal content (images, PDFs, audio, video) that's reused
- Cost optimization is critical (90% savings on cached content)

**Gemini Caching Best Practices**:
1. Use implicit caching for automatic savings (enabled by default)
2. Use explicit caching for guaranteed discounts on predictable workloads
3. Set appropriate TTL values (default 60 minutes)
4. Cache large documents, system instructions, or examples

### Safety Implementation

**For Public-Facing Applications**:
- Cohere: Use "STRICT" mode
- Mistral: Set `safe_prompt: true`
- Gemini: Configure appropriate safety settings

**For Internal/Creative Tools**:
- Cohere: Use "CONTEXTUAL" mode
- Mistral: Set `safe_prompt: false`
- Gemini: Adjust safety thresholds as needed

**For Maximum Freedom**:
- Cohere: Use "OFF" mode (with caution)
- Mistral: Set `safe_prompt: false`

### Cross-Provider Compatibility

When building multi-provider systems:

**Parameter Mapping Required**:
```
maxOutputTokens (Gemini) ↔ max_tokens (Mistral/Cohere)
topP (Gemini) ↔ top_p (Mistral) ↔ p or top_p (Cohere)
topK (Gemini) ↔ N/A (Mistral) ↔ k or top_k (Cohere)
stopSequences (Gemini) ↔ stop (Mistral) ↔ stop_sequences (Cohere)
seed (Gemini) ↔ random_seed (Mistral) ↔ seed (Cohere)
```

**Naming Convention Conversion**:
- Gemini: camelCase → Convert to snake_case for Mistral/Cohere
- Store canonical names internally, convert at API boundary

**Temperature Normalization**:
- Be aware of different recommended ranges
- Consider provider-specific normalization (e.g., scale 0-1 input to 0-0.7 for Mistral)

---

## Recommendations

### For Multi-Provider LLM Applications

1. **Implement Parameter Abstraction Layer**:
   - Define canonical parameter names (suggest snake_case as majority pattern)
   - Transform to provider-specific naming at API boundary
   - Handle parameter availability differences (e.g., topK not in Mistral)

2. **Temperature Handling**:
   - Accept normalized 0-1 range from users
   - Apply provider-specific scaling:
     - Gemini: 0-1 → 0-2.0 (or keep at 0-1)
     - Mistral: 0-1 → 0-0.7
     - Cohere: 0-1 → 0-1 (direct mapping)

3. **Caching Strategy**:
   - Prefer Gemini for high-volume, repeated prompt scenarios
   - Use explicit caching when cost predictability matters
   - Track cache hit rates and cost savings

4. **Safety Configuration**:
   - Expose Cohere's granular safety_mode options as baseline
   - Map to binary safe_prompt for Mistral
   - Configure Gemini safety settings appropriately

5. **Response Format**:
   - Use JSON mode consistently across providers
   - Always instruct model to produce JSON in prompt (required by Mistral)
   - Leverage schema validation where available

### For Provider-Specific Optimization

**Gemini**:
- Leverage caching aggressively for cost savings
- Use candidateCount for A/B testing responses
- Explore responseMimeType for structured outputs

**Mistral**:
- Keep temperature ≤ 0.7 as recommended
- Use random_seed for evaluation, remove for production
- Don't combine temperature and top_p adjustments

**Cohere**:
- Utilize built-in RAG with documents parameter
- Leverage tools for function calling
- Use conversation_id for stateful conversations
- Take advantage of OpenAI compatibility for easy migration

---

## Open Questions

1. **Mistral Top-K Support**: Does Mistral support top-k sampling through undocumented parameters or via specific model configurations?

2. **Gemini Safety Settings**: What are the complete safety settings available in Gemini (not fully documented in search results)?

3. **Temperature Upper Limits**: Does Cohere have a practical or documented upper limit for temperature beyond "≥ 0.0"?

4. **Caching Costs**: What are the exact pricing models for Mistral and Cohere caching (if available)?

5. **N Parameter Availability**: Which Mistral models support the `n` parameter for multiple completions, and which don't?

6. **Cohere Safety Mode Compatibility**: Will tools/documents compatibility with safety_mode be added in future Cohere releases?

---

## References

### Google Gemini API
- [Content generation parameters | Generative AI on Vertex AI | Google Cloud Documentation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/content-generation-parameters)
- [Use model configuration to control responses | Firebase AI Logic](https://firebase.google.com/docs/ai-logic/model-parameters)
- [Generate content with the Gemini API in Vertex AI](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/inference)
- [Generating content | Gemini API | Google AI for Developers](https://ai.google.dev/api/generate-content)
- [Experiment with parameter values](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/adjust-parameter-values)
- [Context caching overview | Vertex AI](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/context-cache/context-cache-overview)
- [Context caching | Gemini API](https://ai.google.dev/gemini-api/docs/caching)
- [Caching | Gemini API](https://ai.google.dev/api/caching)
- [Gemini 2.5 Models now support implicit caching - Google Developers Blog](https://developers.googleblog.com/en/gemini-2-5-models-now-support-implicit-caching/)

### Mistral AI API
- [API Specs](https://docs.mistral.ai/api)
- [Chat](https://docs.mistral.ai/api/endpoint/chat)
- [Mistral AI chat completion - Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-mistral-chat-completion.html)
- [Tuning Chat Completion Parameters in Mistral API (2025) | Propel](https://www.propelcode.ai/blog/mistral-chat-completions-parameters-tuning-guide-2025)
- [Sampling | Mistral Docs](https://docs.mistral.ai/capabilities/completion/sampling)
- [Mistral AI Provider - Complete Guide | Promptfoo](https://www.promptfoo.dev/docs/providers/mistral/)

### Cohere API
- [Chat | Cohere](https://docs.cohere.com/reference/chat)
- [Chat (V1) | Cohere](https://docs.cohere.com/reference/chat-v1)
- [Using the Cohere Chat API for Text Generation](https://docs.cohere.com/docs/chat-api)
- [Advanced Generation Parameters | Cohere](https://docs.cohere.com/v2/docs/advanced-generation-hyperparameters)
- [Using Cohere models via the OpenAI SDK](https://docs.cohere.com/docs/compatibility-api)
- [Cohere Command R and Command R+ models - Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-cohere-command-r-plus.html)

---

## Quick Reference Tables

### Complete Parameter Matrix

| Parameter Category | Gemini | Mistral | Cohere |
|-------------------|--------|---------|--------|
| **Temperature** | `temperature` (0.0-2.0) | `temperature` (0.0-2.0, rec 0.0-0.7) | `temperature` (≥0.0, default 0.3) |
| **Max Tokens** | `maxOutputTokens` | `max_tokens` | `max_tokens` |
| **Top-P** | `topP` (0.0-1.0, default 0.95) | `top_p` (0.0-1.0) | `p` or `top_p` (0.01-0.99, default 0.75) |
| **Top-K** | `topK` (≥1, default 20) | ❌ Not available | `k` or `top_k` (0-500, default 0) |
| **Stop Sequences** | `stopSequences` (array) | `stop` (string/array) | `stop_sequences` (array, max 4-5) |
| **Seed** | `seed` | `random_seed` | `seed` |
| **Frequency Penalty** | `frequencyPenalty` (0.0-2.0) | `frequency_penalty` (-2.0-2.0) | `frequency_penalty` (0.0-1.0) |
| **Presence Penalty** | `presencePenalty` (0.0-2.0) | `presence_penalty` (-2.0-2.0) | `presence_penalty` (0.0-1.0) |
| **Response Format** | `responseMimeType` + `responseSchema` | `response_format` | `response_format` |
| **Safety** | Safety settings | `safe_prompt` (boolean) | `safety_mode` (3 levels) |
| **Candidates** | `candidateCount` | `n` (limited model support) | ❌ Not available |
| **Min Tokens** | ❌ Not available | `min_tokens` | ❌ Not available |
| **Conversation ID** | ❌ Not available | ❌ Not available | `conversation_id` |
| **Tools** | ✅ Supported | ✅ Supported | `tools` (native) |
| **RAG/Documents** | ✅ Supported | ✅ Supported | `documents` (native) |
| **Streaming** | ✅ Supported | `stream` | ✅ Supported |

### Cost Optimization Features

| Feature | Gemini | Mistral | Cohere |
|---------|--------|---------|--------|
| **Caching** | ✅ Implicit (automatic) + Explicit (controlled) | ⚠️ Not documented | ⚠️ Basic (conversation state) |
| **Cache Discount** | 75-90% (model-dependent) | N/A | N/A |
| **Cache Min Size** | 1024-2048 tokens (model-dependent) | N/A | N/A |
| **Cache TTL** | Configurable (default 60 min) | N/A | N/A |
| **Multimodal Caching** | ✅ Text, PDF, image, audio, video | N/A | N/A |

---

## Summary of Key Differences

### 1. Naming Conventions
- **Gemini**: camelCase (unique)
- **Mistral & Cohere**: snake_case (OpenAI-compatible)

### 2. Temperature Philosophy
- **Gemini**: Balanced (0.0-2.0, start at 1.0)
- **Mistral**: Conservative (recommend 0.0-0.7 despite supporting 0.0-2.0)
- **Cohere**: Most conservative (default 0.3)

### 3. Top-K Sampling
- **Gemini**: ✅ Supported (default 20)
- **Mistral**: ❌ Not available
- **Cohere**: ✅ Supported (0-500, default 0)

### 4. Safety Controls
- **Gemini**: Model-dependent settings
- **Mistral**: Simple boolean (`safe_prompt`)
- **Cohere**: Most granular (3 levels: CONTEXTUAL, STRICT, OFF)

### 5. Caching
- **Gemini**: 🏆 Winner - Sophisticated two-tier system with 75-90% cost savings
- **Mistral**: No documented caching
- **Cohere**: Basic conversation persistence

### 6. Special Features
- **Gemini**: Multiple candidates, advanced caching, MIME type responses
- **Mistral**: Minimum tokens, multiple completions (n), explicit guidance on parameter interactions
- **Cohere**: Conversation management, built-in RAG, native tools, OpenAI compatibility

### 7. Enterprise Readiness
- **Gemini**: Best for cost optimization at scale (caching)
- **Mistral**: Best for straightforward integration
- **Cohere**: Best for RAG applications and granular safety controls

---

**Last Updated**: 2026-02-09
