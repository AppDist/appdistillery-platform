# Brain Adapter API Reference

## Overview

The Brain Adapter module provides AI model integrations using the Vercel AI SDK. Implements multiple adapters (Anthropic Claude, OpenAI GPT) with support for structured output generation, automatic retry logic, and token counting.

## Location

`packages/core/src/brain/adapters/`

## Available Adapters

- **Anthropic** - Claude models (3.5, 4, 4.5)
- **OpenAI** - GPT models (GPT-4, GPT-4o, o1)

---

## Modules

### Anthropic Adapter

Structured output generation using Anthropic Claude models.

#### `generateStructured<T>(options: GenerateOptions<T>): Promise<GenerateResult<T>>`

Generate structured output using Claude with automatic retry logic and token counting.

**Input Schema: `GenerateOptions<T>`**

```typescript
interface GenerateOptions<T extends z.ZodType> {
  schema: T;                    // Zod schema for output validation
  prompt: string;               // Main prompt text
  system?: string;              // System message (optional)
  model?: string;               // Model ID (default: claude-sonnet-4-5-20250929)
  maxTokens?: number;           // Max output tokens (default: 4000)
  temperature?: number;         // Sampling temperature (default: 0.7)
}
```

**Output Type: `GenerateResult<T>`**

```typescript
type GenerateResult<T> =
  | {
      success: true;
      object: T;
      usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
      };
    }
  | {
      success: false;
      error: string; // Sanitized error message
    };
```

**Example:**

```typescript
import { generateStructured, ANTHROPIC_MODELS } from '@appdistillery/core/brain/adapters';
import { z } from 'zod';

const OutputSchema = z.object({
  summary: z.string().describe('Brief summary'),
  keyPoints: z.array(z.string()).describe('Main points'),
  confidence: z.number().min(0).max(1).describe('Confidence score'),
});

const result = await generateStructured({
  schema: OutputSchema,
  prompt: 'Analyze this proposal for quality and completeness...',
  system: 'You are an expert business analyst.',
  model: ANTHROPIC_MODELS.SONNET_4_5,
  maxTokens: 2000,
  temperature: 0.3, // Low temperature for consistency
});

if (result.success) {
  console.log(result.object.summary);
  console.log(`Used ${result.usage.totalTokens} tokens`);
} else {
  console.error(`Error: ${result.error}`);
}
```

**Error Handling:**

Client-safe error messages are returned automatically:

| Error Type | Client Message |
|------------|---|
| Rate limit (429) | "Rate limit exceeded. Please try again later." |
| Timeout | "Request timed out. Please try again." |
| API error | "API error occurred." |
| Other | "Generation failed. Please try again." |

Server-side: Full error details are logged with `[generateStructured]` prefix.

**Retry Behavior:**

- **Max retries:** 3 attempts
- **Backoff:** Exponential (1s → 2s → 4s, max 10s)
- **Retryable errors:** HTTP 429, 502, 503, 504, rate limit, timeout
- **Non-retryable:** Schema validation, other API errors (fail immediately)

**Usage Cost:** Depends on tokens used. Tracked via `recordUsage()` from `@appdistillery/core/ledger`.

---

### OpenAI Adapter

Structured output generation using OpenAI GPT models.

#### `generateStructuredWithOpenAI<T>(options: GenerateOptionsWithOpenAI<T>): Promise<GenerateResult<T>>`

Generate structured output using OpenAI GPT with automatic retry logic and token counting.

**Input Schema: `GenerateOptionsWithOpenAI<T>`**

```typescript
interface GenerateOptionsWithOpenAI<T extends z.ZodType> {
  schema: T;                    // Zod schema for output validation
  prompt: string;               // Main prompt text
  system?: string;              // System message (optional)
  model?: string;               // Model ID (default: gpt-5-mini)
  maxTokens?: number;           // Max output tokens (default: 4000)
  temperature?: number;         // Sampling temperature (default: 0.7)
}
```

**Output Type: `GenerateResult<T>`**

```typescript
type GenerateResult<T> =
  | {
      success: true;
      object: T;
      usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
      };
    }
  | {
      success: false;
      error: string; // Sanitized error message
    };
```

**Example:**

```typescript
import { generateStructuredWithOpenAI, OPENAI_MODELS } from '@appdistillery/core/brain/adapters';
import { z } from 'zod';

const OutputSchema = z.object({
  summary: z.string().describe('Brief summary'),
  keyPoints: z.array(z.string()).describe('Main points'),
  confidence: z.number().min(0).max(1).describe('Confidence score'),
});

const result = await generateStructuredWithOpenAI({
  schema: OutputSchema,
  prompt: 'Analyze this proposal for quality and completeness...',
  system: 'You are an expert business analyst.',
  model: OPENAI_MODELS.GPT_5_MINI,
  maxTokens: 2000,
  temperature: 0.3, // Low temperature for consistency
});

if (result.success) {
  console.log(result.object.summary);
  console.log(`Used ${result.usage.totalTokens} tokens`);
} else {
  console.error(`Error: ${result.error}`);
}
```

**Error Handling:**

Client-safe error messages are returned automatically:

| Error Type | Client Message |
|------------|---|
| Rate limit (429) | "Rate limit exceeded. Please try again later." |
| Timeout | "Request timed out. Please try again." |
| API error | "API error occurred." |
| Other | "Generation failed. Please try again." |

Server-side: Full error details are logged with `[generateStructuredWithOpenAI]` prefix.

**Retry Behavior:**

- **Max retries:** 3 attempts
- **Backoff:** Exponential (1s → 2s → 4s, max 10s)
- **Retryable errors:** HTTP 429, 502, 503, 504, rate limit, timeout
- **Non-retryable:** Schema validation, other API errors (fail immediately)

**Usage Cost:** Depends on tokens used. Tracked via `recordUsage()` from `@appdistillery/core/ledger`.

---

## Model Constants

### `ANTHROPIC_MODELS`

All available Claude model versions:

```typescript
export const ANTHROPIC_MODELS = {
  // Claude 4.5 (Latest - 2025-09-29)
  SONNET_4_5: 'claude-sonnet-4-5-20250929',
  HAIKU_4_5: 'claude-haiku-4-5-20250929',

  // Claude 4 (Current - 2025-05-14)
  SONNET_4: 'claude-sonnet-4-20250514',

  // Claude 3.5 (2024-10-22)
  SONNET_3_5: 'claude-3-5-sonnet-20241022',
  HAIKU_3_5: 'claude-3-5-haiku-20241022',

  // Claude 3 (2024-02/03)
  OPUS_3: 'claude-3-opus-20240229',
  SONNET_3: 'claude-3-sonnet-20240229',
  HAIKU_3: 'claude-3-haiku-20240307',
} as const;

type AnthropicModel = typeof ANTHROPIC_MODELS[keyof typeof ANTHROPIC_MODELS];
```

**Recommendations:**

- **General tasks:** `SONNET_4_5` (latest, balanced)
- **Complex reasoning:** `OPUS_3` (better at complex tasks)
- **Cost-sensitive:** `HAIKU_4_5` (fast, cheaper)
- **Consistency required:** Lower temperature (0.1-0.3)

### `OPENAI_MODELS`

All available OpenAI model versions:

```typescript
export const OPENAI_MODELS = {
  // GPT-5 Family (Current - 2025)
  GPT_5_1: 'gpt-5.1',           // Frontier reasoning, complex tasks
  GPT_5_MINI: 'gpt-5-mini',     // General tasks, balanced (DEFAULT)
  GPT_5_NANO: 'gpt-5-nano',     // Simple extraction, high-volume

  // GPT-4.1 Family (Previous)
  GPT_4_1: 'gpt-4.1',           // 1M context
  GPT_4_1_MINI: 'gpt-4.1-mini', // 128K context

  // Reasoning Models (o-series)
  O3: 'o3',                      // Mathematical reasoning
  O3_MINI: 'o3-mini',            // Lightweight reasoning
} as const;

type OpenAIModel = typeof OPENAI_MODELS[keyof typeof OPENAI_MODELS];
```

**Recommendations:**

- **General tasks:** `GPT_5_MINI` (default, balanced)
- **Complex reasoning:** `GPT_5_1` (frontier model)
- **Cost-sensitive:** `GPT_5_NANO` (simple extraction, high-volume)
- **Mathematical reasoning:** `O3` or `O3_MINI` (specialized reasoning)
- **Consistency required:** Lower temperature (0.1-0.3)

---

## Environment Variables

### `ANTHROPIC_API_KEY`

Required for Anthropic adapter operations.

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

**Error if missing:**

```
ANTHROPIC_API_KEY environment variable is required. Add it to your .env.local file.
```

### `OPENAI_API_KEY`

Required for OpenAI adapter operations.

```bash
# .env.local
OPENAI_API_KEY=sk-...
```

**Error if missing:**

```
OPENAI_API_KEY environment variable is required. Add it to your .env.local file.
```

---

## Integration with brainHandle()

The adapter is designed to work with the `brainHandle()` service from `@appdistillery/core/brain`:

```typescript
// Internal: brainHandle uses generateStructured
const result = await brainHandle({
  task: 'agency.scope',
  input: leadData,
  outputSchema: ScopeResultSchema,
});

// Client code doesn't call adapter directly - use brainHandle
```

---

## Error Scenarios

### Missing API Key

```typescript
// ANTHROPIC_API_KEY not set
const result = await generateStructured({...});

if (!result.success) {
  // result.error = "ANTHROPIC_API_KEY environment variable is required..."
}
```

### Rate Limit (with retry)

```typescript
// First two requests fail with 429, third succeeds
const result = await generateStructured({...});

// Automatically retried 3 times with backoff
// success: true (after 2nd retry)
// Total time: ~7 seconds
```

### Non-Retryable Error

```typescript
// Schema validation failure
const result = await generateStructured({...});

if (!result.success) {
  // result.error = "API error occurred." (sanitized)
  // Actual error only visible in server logs
}
```

---

## Test Coverage

16 tests verify:

- Successful structured output generation
- Default model selection
- Custom model selection
- All options passed to underlying SDK
- Missing API key detection
- Error sanitization (generic, rate limit, timeout)
- Retry on rate limit (429, 503)
- No retry on non-retryable errors
- Max retry attempts
- Missing/partial usage information handling
- Token calculation
- Model constants validation

Run tests:

```bash
pnpm test --filter @appdistillery/core adapters
```

---

## Design Patterns

### Singleton Client

Both adapters cache their clients after first creation for performance:

```typescript
// First call: creates client
const result1 = await generateStructured({...});

// Subsequent calls: reuse cached client
const result2 = await generateStructured({...});

// Same pattern with OpenAI adapter
const result3 = await generateStructuredWithOpenAI({...});
```

### Discriminated Union Result

Type-safe error handling without exceptions in both adapters:

```typescript
const result = await generateStructured({...});
// or
const result = await generateStructuredWithOpenAI({...});

if (result.success) {
  // result.object and result.usage are available
  console.log(result.object.summary);
} else {
  // result.error is available
  console.error(result.error);
}
```

### Error Sanitization

Full errors logged server-side, generic messages returned to clients:

```
Server log: [generateStructured] Error: Rate limit exceeded (429)
Client receives: "Rate limit exceeded. Please try again later."

Server log: [generateStructuredWithOpenAI] Error: Rate limit exceeded (429)
Client receives: "Rate limit exceeded. Please try again later."
```

---

## Related Documentation

- **Integration Registry:** See integration setup details
- **Brain Module:** Parent service `brainHandle()`
- **Ledger Module:** `recordUsage()` for token tracking
- **Zod Schemas:** Pattern for structured output

---

## Version History

### v1.2 (2025-12-02)

- Updated OpenAI adapter to GPT-5 and o3 models
- Changed default model to `gpt-5-mini` (general tasks, balanced)
- Added GPT-5 family: `gpt-5.1`, `gpt-5-mini`, `gpt-5-nano`
- Added GPT-4.1 family: `gpt-4.1`, `gpt-4.1-mini`
- Updated reasoning models: `o3`, `o3-mini`

### v1.1 (2025-12-02)

- Added OpenAI GPT adapter
- Support for GPT-4o, GPT-4o-mini, o1, o1-mini, and GPT-4-turbo models
- Matching feature parity with Anthropic adapter
- Both adapters follow same patterns and conventions

### v1.0 (2025-12-02)

- Initial release with Anthropic Claude adapter
- Structured output generation with Zod schemas
- Retry logic with exponential backoff (max 10s)
- Token counting and usage tracking
- Error sanitization for security
- Support for all Claude model versions (3-4.5)
