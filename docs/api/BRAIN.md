# Brain Service API

Public API reference for the Brain service - AI orchestration for AppDistillery.

## Overview

The Brain service provides AI capabilities through a provider-agnostic interface. All AI operations MUST use `brainHandle()` or `brainHandleStream()` - never call provider APIs directly.

**Package:** `@appdistillery/core/brain`

## brainHandle()

Generate structured AI outputs with automatic usage recording.

### Function Signature

```typescript
function brainHandle<T extends z.ZodType>(
  options: BrainTask<T>
): Promise<BrainResult<z.infer<T>>>
```

### Parameters

```typescript
interface BrainTask<T extends z.ZodType> {
  tenantId?: string;           // Optional: tenant ID for multi-tenancy
  moduleId: string;            // Module identifier (e.g., 'agency')
  taskType: string;            // Task identifier (e.g., 'agency.scope')
  systemPrompt: string;        // System instructions
  userPrompt: string;          // User input/request
  schema: T;                   // Zod schema for output validation
  model?: string;              // Optional: override default model
  provider?: 'anthropic' | 'openai' | 'google'; // Optional: override provider
}
```

### Return Type

```typescript
type BrainResult<T> =
  | {
      success: true;
      data: T;                 // Parsed, validated output
      usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
      };
    }
  | {
      success: false;
      error: string;
    };
```

### Example

```typescript
import { brainHandle } from '@appdistillery/core/brain';
import { ScopeResultSchema } from '@/modules/agency/schemas';

const result = await brainHandle({
  tenantId: session.orgId,
  moduleId: 'agency',
  taskType: 'agency.scope',
  systemPrompt: 'You are a project scoping expert...',
  userPrompt: `Scope this project: ${problemStatement}`,
  schema: ScopeResultSchema,
});

if (!result.success) {
  throw new Error(result.error);
}

// result.data is typed as z.infer<typeof ScopeResultSchema>
console.log(result.data.deliverables);
```

### Error Handling

```typescript
const result = await brainHandle({ /* ... */ });

if (result.success) {
  // Type-safe access to result.data
  console.log(result.data);
} else {
  // Handle error
  console.error(result.error);
}
```

## brainHandleStream()

Stream AI outputs progressively (useful for long-running tasks).

### Function Signature

```typescript
function brainHandleStream<T extends z.ZodType>(
  options: BrainTask<T>
): Promise<StreamResult<z.infer<T>>>
```

### Return Type

```typescript
type StreamResult<T> =
  | {
      success: true;
      stream: AsyncIterable<StreamChunk<T>>;
    }
  | {
      success: false;
      error: string;
    };

type StreamChunk<T> = {
  partial: Partial<T>;         // Partial object updated as stream progresses
  done: boolean;               // True when stream is complete
};
```

### Example

```typescript
import { brainHandleStream } from '@appdistillery/core/brain';

const result = await brainHandleStream({
  tenantId: session.orgId,
  moduleId: 'agency',
  taskType: 'agency.proposal',
  systemPrompt: 'Draft a proposal...',
  userPrompt: briefData,
  schema: ProposalSchema,
});

if (!result.success) {
  throw new Error(result.error);
}

for await (const chunk of result.stream) {
  console.log('Partial:', chunk.partial);

  if (chunk.done) {
    console.log('Final:', chunk.partial);
    // chunk.partial is now complete
  }
}
```

## Utility Functions

### validatePrompt()

Validate prompts for length, injection patterns.

```typescript
import { validatePrompt } from '@appdistillery/core/brain';

const validation = validatePrompt(userInput, {
  maxLength: 10000,
  allowMarkdown: true,
});

if (!validation.isValid) {
  throw new Error(validation.error);
}
```

### Rate Limiting

```typescript
import { checkRateLimit } from '@appdistillery/core/brain';

const limit = await checkRateLimit(tenantId, {
  maxRequests: 100,
  windowMs: 60000, // 1 minute
});

if (!limit.allowed) {
  throw new Error(`Rate limit exceeded. Retry in ${limit.retryAfter}ms`);
}
```

### Response Caching

```typescript
import { getCachedResponse, setCachedResponse } from '@appdistillery/core/brain';

// Check cache before calling AI
const cached = await getCachedResponse(cacheKey);
if (cached) {
  return cached;
}

// Call AI and cache result
const result = await brainHandle({ /* ... */ });
await setCachedResponse(cacheKey, result, { ttl: 3600 });
```

## Advanced: Direct Adapter Access

For advanced use cases, adapters can be called directly:

```typescript
import { generateStructured, ANTHROPIC_MODELS } from '@appdistillery/core/brain';

const result = await generateStructured({
  model: ANTHROPIC_MODELS['claude-3-5-sonnet-20241022'],
  schema: MySchema,
  prompt: 'User prompt',
  system: 'System prompt',
});
```

**Warning:** Direct adapter usage bypasses automatic usage recording. Only use when you handle recording manually.

## Critical Rules

| Never | Always |
|-------|--------|
| Call Anthropic/OpenAI directly | Use `brainHandle()` |
| Skip usage recording | Let brainHandle record usage |
| Return raw AI output | Validate with Zod schema |
| Hardcode provider | Use provider parameter or env var |

## Configuration

Set environment variables:

```bash
# Default provider (anthropic, openai, google)
BRAIN_DEFAULT_PROVIDER=anthropic

# Provider API keys
ANTHROPIC_API_KEY=sk-...
OPENAI_API_KEY=sk-...
GOOGLE_GENERATIVE_AI_API_KEY=...

# Default model
BRAIN_DEFAULT_MODEL=claude-3-5-sonnet-20241022
```

## References

- **Source code:** `packages/core/src/brain/index.ts`
- **JSDoc:** See inline documentation in source files
- **ADR:** `docs/decisions/0002-ai-adapter-pattern.md`
- **Examples:** `modules/agency/src/actions/` for real-world usage
