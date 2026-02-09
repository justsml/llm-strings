# OpenAI Chat Completions API Parameters - Comprehensive Reference

**Date**: 2026-02-09
**Status**: Complete
**API Version**: 2026 (Latest)

## Executive Summary

This document provides a comprehensive reference for all parameters supported by the OpenAI Chat Completions API as of February 2026. Key findings:

- **Naming Convention**: OpenAI uses `snake_case` for all parameter names
- **Model-Specific Differences**: Reasoning models (o1, o3, o3-mini, o4-mini) have significantly different parameter support compared to GPT models
- **Deprecated Parameters**: `max_tokens` is deprecated in favor of `max_completion_tokens` for o-series models; `functions` and `function_call` are deprecated in favor of `tools` and `tool_choice`
- **Prompt Caching**: Automatic for prompts ≥1024 tokens on supported models (no code changes required)
- **Streaming**: Supported via `stream: true` with optional usage stats via `stream_options`

## Parameter Categories

### Core Required Parameters

| Parameter | Type | Description | All Models |
|-----------|------|-------------|------------|
| `messages` | array | List of messages comprising the conversation | ✓ |
| `model` | string | Model ID (e.g., "gpt-4o", "o3-mini") | ✓ |

---

## Complete Parameter Reference

### 1. Sampling Parameters

#### `temperature`
- **Type**: number
- **Range**: 0.0 to 2.0
- **Default**: 1.0
- **Description**: Controls randomness in output. Higher values (e.g., 1.8) make output more random; lower values (e.g., 0.2) make it more focused and deterministic.
- **Model Support**:
  - ✓ GPT-4o, GPT-4o-mini, GPT-4.1, GPT-4.1-mini
  - ✗ o1, o3, o3-mini, o4-mini (fixed at 1.0, parameter not accepted)
- **Notes**: OpenAI recommends altering either `temperature` OR `top_p`, but not both. When using `top_p`, set `temperature` to 1.

#### `top_p`
- **Type**: number
- **Range**: 0.0 to 1.0
- **Default**: 1.0
- **Description**: Nucleus sampling - considers tokens with top_p probability mass. E.g., 0.1 means only tokens comprising the top 10% probability mass are considered.
- **Model Support**:
  - ✓ GPT-4o, GPT-4o-mini, GPT-4.1, GPT-4.1-mini
  - ✗ o1, o3, o3-mini, o4-mini (fixed at 1.0, parameter not accepted)
- **Notes**: Alternative to `temperature` for controlling randomness.

#### `frequency_penalty`
- **Type**: number
- **Range**: -2.0 to 2.0
- **Default**: 0.0
- **Description**: Positive values penalize new tokens based on their existing frequency in the text, decreasing likelihood of repeating the same line verbatim.
- **Model Support**:
  - ✓ GPT-4o, GPT-4o-mini, GPT-4.1, GPT-4.1-mini
  - ✗ o1, o3, o3-mini, o4-mini (fixed at 0.0, not supported)
- **Notes**: OpenAI recommends altering either `frequency_penalty` OR `presence_penalty`, but not both.

#### `presence_penalty`
- **Type**: number
- **Range**: -2.0 to 2.0
- **Default**: 0.0
- **Description**: Positive values penalize new tokens based on whether they appear in the text so far, increasing likelihood of talking about new topics.
- **Model Support**:
  - ✓ GPT-4o, GPT-4o-mini, GPT-4.1, GPT-4.1-mini
  - ✗ o1, o3, o3-mini, o4-mini (fixed at 0.0, not supported)

---

### 2. Output Control Parameters

#### `max_tokens` (DEPRECATED)
- **Type**: integer
- **Description**: Maximum number of tokens to generate in the completion.
- **Model Support**: Legacy GPT models only
- **Status**: **DEPRECATED** - Use `max_completion_tokens` instead
- **Notes**: Not compatible with o-series models.

#### `max_completion_tokens`
- **Type**: integer
- **Default**: Model-dependent (varies)
- **Description**: Upper bound for the number of tokens that can be generated for a completion. For reasoning models, includes both visible output tokens and reasoning tokens.
- **Model Support**:
  - ✓ All models (GPT-4o, GPT-4o-mini, GPT-4.1, o1, o3, o3-mini, o4-mini)
- **Notes**: This is the preferred parameter for controlling output length. For reasoning models, this is the ONLY way to limit output tokens.

#### `n`
- **Type**: integer
- **Default**: 1
- **Description**: Number of completions to generate for a given prompt.
- **Model Support**:
  - ✓ GPT-4o, GPT-4o-mini, GPT-4.1, GPT-4.1-mini
  - ✗ o1, o3, o3-mini, o4-mini (fixed at 1, not supported)

#### `stop`
- **Type**: string or array
- **Max Items**: Up to 4 sequences
- **Description**: Sequences where the API will stop generating further tokens. The returned text will not contain the stop sequence.
- **Model Support**:
  - ✓ GPT-4o, GPT-4o-mini, GPT-4.1, GPT-4.1-mini
  - ✗ o3, o4-mini (not supported with latest reasoning models)
  - ⚠ o1, o3-mini (support unclear/limited)

---

### 3. Reasoning Model Parameters

#### `reasoning_effort`
- **Type**: string
- **Values**: `"none"`, `"minimal"`, `"low"`, `"medium"`, `"high"`, `"xhigh"`
- **Default**: `"medium"` (for most models)
- **Description**: Guides the model on how many reasoning tokens to generate before creating a response. Higher effort = longer processing time = more reasoning tokens.
- **Model Support**:
  - ✗ GPT-4o, GPT-4o-mini (not applicable)
  - ✓ o1, o3, o3-mini, o4-mini
  - ✓ GPT-4.1 (gpt-5.1 series models support `none`, `low`, `medium`, `high`)
- **Model-Specific Values**:
  - **o1-mini**: Does NOT support `reasoning_effort`
  - **o1, o3, o3-mini**: Support `low`, `medium`, `high`
  - **GPT-5 series** (gpt-5.1+): Support `minimal` (new), `none`, `low`, `medium`, `high`
  - **GPT-5.1-codex-max and later**: Support `xhigh`
- **Notes**:
  - `low` favors speed and economical token usage
  - `high` favors more complete reasoning
  - Free tier o3-mini uses `medium`; paid subscribers access `o3-mini-high`
  - All models before gpt-5.1 default to `medium` and do not support `none`

---

### 4. Response Format Parameters

#### `response_format`
- **Type**: object
- **Description**: Specifies the format of the model's output (e.g., JSON mode, structured outputs).
- **Model Support**:
  - ✓ GPT-4o, GPT-4o-mini, GPT-4.1, GPT-4.1-mini (including Structured Outputs)
  - ⚠ o1, o3, o3-mini, o4-mini (support varies)
- **Notes**: Both GPT-4o and GPT-4o-mini support Structured Outputs.

---

### 5. Probability & Token Control Parameters

#### `logprobs`
- **Type**: boolean
- **Default**: false
- **Description**: Whether to return log probabilities of the output tokens.
- **Model Support**:
  - ✓ GPT-4o, GPT-4o-mini, GPT-4.1, GPT-4.1-mini
  - ✗ o1, o3, o3-mini, o4-mini (not supported)
- **Notes**: Must be set to `true` if using `top_logprobs`.

#### `top_logprobs`
- **Type**: integer
- **Range**: 0 to 20 (some sources indicate 0-5; recent API may support up to 20)
- **Description**: Number of most likely tokens to return at each token position, each with an associated log probability.
- **Model Support**:
  - ✓ GPT-4o, GPT-4o-mini, GPT-4.1, GPT-4.1-mini
  - ✗ o1, o3, o3-mini, o4-mini (not supported)
- **Notes**: Requires `logprobs: true`.

#### `logit_bias`
- **Type**: object (JSON map)
- **Range**: -100 to 100 per token
- **Description**: Modify the likelihood of specified tokens appearing in the completion. Maps token IDs to bias values. Values between -1 and 1 decrease/increase likelihood; values like -100 or 100 result in ban or exclusive selection.
- **Model Support**:
  - ✓ GPT-4o, GPT-4o-mini, GPT-4.1, GPT-4.1-mini
  - ✗ o1, o3, o3-mini, o4-mini (not supported)

---

### 6. Streaming Parameters

#### `stream`
- **Type**: boolean
- **Default**: false
- **Description**: If true, model response data will be streamed to the client as it is generated using server-sent events (SSE).
- **Model Support**:
  - ✓ All models (GPT-4o, GPT-4o-mini, GPT-4.1, o1, o3, o3-mini, o4-mini)
- **Response Type**: Returns `chat.completion.chunk` objects when streaming.

#### `stream_options`
- **Type**: object
- **Structure**: `{"include_usage": true/false}`
- **Description**: Additional options for streaming. Set `include_usage: true` to receive an additional final response chunk containing usage data for the entire request/response.
- **Model Support**:
  - ✓ All models supporting `stream`
- **Notes**: Added to enable usage stats during streaming.

---

### 7. Function Calling / Tools Parameters

#### `tools`
- **Type**: array
- **Description**: A list of tools (functions) the model may call. Use this to provide function definitions the model can invoke.
- **Model Support**:
  - ✓ GPT-4o, GPT-4o-mini, GPT-4.1, GPT-4.1-mini
  - ✓ o3-mini, o1 (as of 2026, tool_choice now supported)
- **Notes**: Replaces deprecated `functions` parameter.

#### `tool_choice`
- **Type**: string or object
- **Values**: `"none"`, `"auto"`, `"required"`, or `{"type": "function", "function": {"name": "my_function"}}`
- **Description**: Controls which (if any) tool is called by the model.
  - `"none"`: Model will not call any function
  - `"auto"`: Model can decide whether to call a function
  - `"required"`: Model must call one of the provided functions
  - Object: Force model to call a specific function
- **Model Support**:
  - ✓ GPT-4o, GPT-4o-mini, GPT-4.1, GPT-4.1-mini
  - ✓ o3-mini, o1 (supported as of 2026)
- **Notes**: Replaces deprecated `function_call` parameter.

#### `parallel_tool_calls`
- **Type**: boolean
- **Default**: true
- **Description**: Whether to enable parallel function calling. When true, the model may choose to call multiple functions in a single turn. Set to false to ensure exactly zero or one tool is called.
- **Model Support**:
  - ✓ GPT-4o, GPT-4o-mini, GPT-4.1, GPT-4.1-mini
  - ✗ o1, o3, o3-mini, o4-mini (not supported)
- **Notes**: Parallel tool calling reduces API round trips and improves performance.

#### `functions` (DEPRECATED)
- **Status**: **DEPRECATED** as of 2023-12-01 API version
- **Replacement**: Use `tools` parameter instead

#### `function_call` (DEPRECATED)
- **Status**: **DEPRECATED** as of 2023-12-01 API version
- **Replacement**: Use `tool_choice` parameter instead

---

### 8. Storage & Metadata Parameters

#### `store`
- **Type**: boolean
- **Default**: false
- **Description**: Whether to store the output of this chat completion request for use in model distillation or evals products.
- **Model Support**:
  - ✓ All models
- **Notes**: Only completions created with `store: true` can be modified later.

#### `metadata`
- **Type**: object
- **Max Items**: 16 key-value pairs
- **Description**: Set of key-value pairs for storing additional information in a structured format. Can be queried via API or dashboard.
- **Model Support**:
  - ✓ All models
- **Notes**: Currently, the only supported modification is updating the metadata field.

---

### 9. Additional Parameters

#### `seed`
- **Type**: integer
- **Status**: Beta
- **Description**: If specified, the system makes a best effort to sample deterministically. Repeated requests with the same seed and parameters should return the same result.
- **Model Support**:
  - ✓ GPT-4o, GPT-4o-mini, GPT-4.1, GPT-4.1-mini
  - ⚠ o1, o3, o3-mini, o4-mini (support unclear)
- **Notes**:
  - Determinism is NOT guaranteed
  - Check `system_fingerprint` in response to monitor backend changes
  - Match all other parameters (temperature, max_tokens, etc.) for reproducibility

#### `user`
- **Type**: string
- **Description**: A unique identifier representing your end-user, which can help OpenAI monitor and detect abuse.
- **Model Support**:
  - ✓ All models

#### `service_tier`
- **Type**: string
- **Values**: `"auto"`, specific tier values
- **Description**: Specifies the processing type used for serving the request. If set to 'auto', request will be processed with the service tier configured in Project settings.
- **Model Support**:
  - ✓ All models

---

## Model-Specific Parameter Support Matrix

### GPT Models (GPT-4o, GPT-4o-mini, GPT-4.1, GPT-4.1-mini)

| Parameter | Supported | Notes |
|-----------|-----------|-------|
| `temperature` | ✓ | 0-2 range |
| `top_p` | ✓ | 0-1 range |
| `frequency_penalty` | ✓ | -2 to 2 |
| `presence_penalty` | ✓ | -2 to 2 |
| `max_completion_tokens` | ✓ | Preferred over max_tokens |
| `n` | ✓ | Generate multiple completions |
| `stop` | ✓ | Up to 4 sequences |
| `logprobs` | ✓ | Include log probabilities |
| `top_logprobs` | ✓ | 0-20 tokens |
| `logit_bias` | ✓ | Token probability modification |
| `stream` | ✓ | Server-sent events |
| `stream_options` | ✓ | Include usage stats |
| `tools` | ✓ | Function calling |
| `tool_choice` | ✓ | Control function invocation |
| `parallel_tool_calls` | ✓ | Multiple simultaneous calls |
| `response_format` | ✓ | JSON mode, Structured Outputs |
| `seed` | ✓ | Deterministic outputs (beta) |
| `reasoning_effort` | ✗ | Not applicable (GPT-4o/4o-mini) |
| | ✓ | GPT-4.1 only (gpt-5.1 series) |

### Reasoning Models (o1, o3, o3-mini, o4-mini)

| Parameter | Supported | Notes |
|-----------|-----------|-------|
| `temperature` | ✗ | Fixed at 1.0, not accepted |
| `top_p` | ✗ | Fixed at 1.0, not accepted |
| `frequency_penalty` | ✗ | Fixed at 0.0, not accepted |
| `presence_penalty` | ✗ | Fixed at 0.0, not accepted |
| `max_completion_tokens` | ✓ | ONLY way to limit output |
| `n` | ✗ | Fixed at 1 |
| `stop` | ✗ | Not supported (o3, o4-mini) |
| `logprobs` | ✗ | Not supported |
| `top_logprobs` | ✗ | Not supported |
| `logit_bias` | ✗ | Not supported |
| `stream` | ✓ | Supported |
| `stream_options` | ✓ | Include usage stats |
| `tools` | ✓ | Supported (o3-mini, o1) as of 2026 |
| `tool_choice` | ✓ | Supported (o3-mini, o1) as of 2026 |
| `parallel_tool_calls` | ✗ | Not supported |
| `response_format` | ⚠ | Limited support |
| `seed` | ⚠ | Support unclear |
| `reasoning_effort` | ✓ | PRIMARY control parameter |

**Why Reasoning Models Restrict Parameters:**
- Internal generation involves multiple rounds of reasoning, verification, and selection
- Exposing temperature/top_p would break calibrations and destabilize quality/safety
- Setting temperature=0 would collapse multi-path reasoning to single greedy path
- Alternative control via `reasoning_effort` and `verbosity` parameters

---

## Prompt Caching

### How It Works
- **Automatic**: Enabled on all API requests with no code changes required
- **No Additional Fees**: Caching is free
- **Minimum Length**: Automatically applies to prompts ≥1024 tokens
- **Cache Granularity**: Caches the longest prefix computed, starting at 1024 tokens and increasing in 128-token increments
- **Cost Savings**: 50% discount on cached input tokens, up to 90% cost reduction
- **Latency Reduction**: Up to 80% latency improvement
- **Cache Duration**: Typically 5-10 minutes of inactivity, maximum ~1 hour during off-peak

### Supported Models
- ✓ gpt-4o (latest versions)
- ✓ gpt-4o-mini (latest versions)
- ✓ o1-preview
- ✓ o1-mini
- ✓ Fine-tuned versions of supported models
- ✓ All recent models (gpt-4o and newer)

### Best Practices
1. **Place static content first**: Instructions, examples, context at the beginning
2. **Place dynamic content last**: User-specific information, queries at the end
3. **Maintain consistent prefixes**: Maximize cache hit rate
4. **Monitor cache hits**: Check usage data for `cached_tokens` field

### Cache Behavior
- Cache key based on: model, messages, tools, temperature, top_p, etc.
- Any parameter change invalidates cache
- Automatic eviction after inactivity period

---

## Model Context Windows and Specifications

| Model | Context Window | Output Tokens | Knowledge Cutoff | Status (2026) |
|-------|----------------|---------------|------------------|---------------|
| gpt-4o | Varies | Varies | Oct 2023 | Retiring Feb 13, 2026 (ChatGPT only)* |
| gpt-4o-mini | 128K | 16K | Oct 2023 | Active |
| gpt-4.1 | 1M | Varies | June 2024 | Retiring Feb 13, 2026 (ChatGPT only)* |
| gpt-4.1-mini | 1M | Varies | June 2024 | Retiring Feb 13, 2026 (ChatGPT only)* |
| o1 | Varies | Varies | Varies | Active |
| o3 | Varies | Varies | Varies | Active (released Apr 16, 2025) |
| o3-mini | Varies | Varies | Varies | Active (released Jan 31, 2025) |
| o4-mini | Varies | Varies | Varies | Retiring Feb 13, 2026 (ChatGPT only)* |

*Note: API access remains unchanged; only ChatGPT interface affected

---

## Common Error Messages

### Reasoning Models
```
"Unsupported parameter: 'temperature' is not supported with this model."
"Unsupported value: 'temperature' parameter only supports the default value of 1 with this model."
"A specified parameter is not supported with the current model."
```

### Solutions
- Remove `temperature`, `top_p`, `frequency_penalty`, `presence_penalty` from o1/o3 requests
- Use `reasoning_effort` instead for controlling output
- Use `max_completion_tokens` instead of `max_tokens`

---

## API Migration Notes

### Deprecated → Current
1. `functions` → `tools`
2. `function_call` → `tool_choice`
3. `max_tokens` → `max_completion_tokens` (for o-series)

### New Recommendations
- Use `max_completion_tokens` for all new integrations
- Implement `stream_options: {"include_usage": true}` for streaming usage tracking
- Consider `store: true` for completions you want to reference later
- Use `metadata` for organizing and querying completions

---

## References & Sources

1. [OpenAI Chat Completions API Reference](https://platform.openai.com/docs/api-reference/chat)
2. [OpenAI Streaming API Reference](https://platform.openai.com/docs/api-reference/chat-streaming)
3. [OpenAI Reasoning Models Guide](https://platform.openai.com/docs/guides/reasoning)
4. [OpenAI Prompt Caching Documentation](https://platform.openai.com/docs/guides/prompt-caching)
5. [OpenAI Prompt Caching Announcement](https://openai.com/index/api-prompt-caching/)
6. [OpenAI Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)
7. [OpenAI GPT-4o Model Documentation](https://platform.openai.com/docs/models/gpt-4o)
8. [OpenAI GPT-4o-mini Model Documentation](https://platform.openai.com/docs/models/gpt-4o-mini)
9. [OpenAI GPT-4.1 Model Documentation](https://platform.openai.com/docs/models/gpt-4.1)
10. [Introducing GPT-4.1 in the API](https://openai.com/index/gpt-4-1/)
11. [Introducing OpenAI o3 and o4-mini](https://openai.com/index/introducing-o3-and-o4-mini/)
12. [Using logprobs - OpenAI Cookbook](https://cookbook.openai.com/examples/using_logprobs)
13. [OpenAI API Changelog](https://platform.openai.com/docs/changelog)
14. [Azure OpenAI Reasoning Models Documentation](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/reasoning?view=foundry-classic)
15. [OpenAI Model Release Notes](https://help.openai.com/en/articles/9624314-model-release-notes)

---

## Implementation Guidelines

### For GPT Models (gpt-4o, gpt-4o-mini, gpt-4.1)
```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}],
    temperature=0.7,                    # 0-2 range
    max_completion_tokens=1000,         # Preferred over max_tokens
    top_p=1.0,                          # Use this OR temperature
    frequency_penalty=0.0,              # -2 to 2
    presence_penalty=0.0,               # -2 to 2
    n=1,                                # Number of completions
    stop=["END"],                       # Up to 4 sequences
    stream=True,                        # Enable streaming
    stream_options={"include_usage": True},  # Get usage stats
    tools=[...],                        # Function definitions
    tool_choice="auto",                 # Function calling control
    parallel_tool_calls=True,           # Multiple simultaneous calls
    logprobs=True,                      # Include log probabilities
    top_logprobs=5,                     # Top 5 alternative tokens
    seed=12345,                         # For reproducibility (beta)
    store=True,                         # Store for later reference
    metadata={"user_id": "123"}         # Custom metadata
)
```

### For Reasoning Models (o1, o3, o3-mini, o4-mini)
```python
response = client.chat.completions.create(
    model="o3-mini",
    messages=[{"role": "user", "content": "Solve this problem..."}],
    max_completion_tokens=5000,         # Include reasoning tokens
    reasoning_effort="high",            # low, medium, high (minimal, xhigh for newer)
    stream=True,                        # Streaming supported
    stream_options={"include_usage": True},
    tools=[...],                        # Supported as of 2026
    tool_choice="auto",                 # Supported as of 2026
    store=True,
    metadata={"task_id": "456"}
)

# DO NOT include these parameters for reasoning models:
# temperature, top_p, frequency_penalty, presence_penalty,
# n, logprobs, top_logprobs, logit_bias, parallel_tool_calls
```

---

## Key Takeaways

1. **Snake_case naming**: All OpenAI API parameters use `snake_case`
2. **Model-specific support**: Reasoning models (o1/o3) have dramatically different parameter support
3. **Use max_completion_tokens**: This is the modern standard; `max_tokens` is deprecated
4. **Automatic caching**: Free performance boost for prompts ≥1024 tokens
5. **Streaming usage stats**: Enable with `stream_options: {"include_usage": true}`
6. **Tool calling updates**: `tools`/`tool_choice` replace deprecated `functions`/`function_call`
7. **Reasoning control**: Use `reasoning_effort` for o-series models instead of temperature
8. **Migration path**: GPT-4o retiring from ChatGPT Feb 13, 2026, but API unchanged

---

**Document Version**: 1.0
**Last Updated**: 2026-02-09
**Maintained by**: Research Team
