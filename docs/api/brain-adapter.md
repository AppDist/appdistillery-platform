# Brain Adapter API Reference

## Overview

The Brain Adapter module provides AI model integrations using the Vercel AI SDK. Currently implements Anthropic Claude adapter with support for structured output generation, automatic retry logic, and token counting.

## Location

`packages/core/src/brain/adapters/`

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

---

## Environment Variables

### `ANTHROPIC_API_KEY`

Required for all adapter operations.

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

**Error if missing:**

```
ANTHROPIC_API_KEY environment variable is required. Add it to your .env.local file.
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

Anthropic client is cached after first creation for performance:

```typescript
// First call: creates client
const result1 = await generateStructured({...});

// Subsequent calls: reuse cached client
const result2 = await generateStructured({...});
```

### Discriminated Union Result

Type-safe error handling without exceptions:

```typescript
const result = await generateStructured({...});

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
```

---

## Related Documentation

- **Integration Registry:** See integration setup details
- **Brain Module:** Parent service `brainHandle()`
- **Ledger Module:** `recordUsage()` for token tracking
- **Zod Schemas:** Pattern for structured output

---

## Version History

### v1.0 (2025-12-02)

- Initial release
- Anthropic Claude adapter with structured output
- Retry logic with exponential backoff
- Token counting and usage tracking
- Error sanitization
- Support for all Claude model versions (3-4.5)
