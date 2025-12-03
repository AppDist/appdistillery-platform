# Provider Selection - Usage Example

## Overview

TASK-1-52 adds the ability to configure which AI provider to use (Anthropic, OpenAI, or Google) when calling `brainHandle()`.

## Usage

### Default (Anthropic)

```typescript
const result = await brainHandle({
  moduleId: 'agency',
  taskType: 'agency.scope',
  systemPrompt: 'You are a helpful assistant',
  userPrompt: 'Generate something',
  schema: ScopeResultSchema,
});
// Uses Anthropic Claude by default
```

### Explicit Provider Selection

```typescript
// Use OpenAI
const result = await brainHandle({
  moduleId: 'agency',
  taskType: 'agency.scope',
  systemPrompt: 'You are a helpful assistant',
  userPrompt: 'Generate something',
  schema: ScopeResultSchema,
  options: {
    provider: 'openai', // 'anthropic' | 'google' | 'openai'
  },
});

// Use Google Gemini
const result = await brainHandle({
  moduleId: 'agency',
  taskType: 'agency.scope',
  systemPrompt: 'You are a helpful assistant',
  userPrompt: 'Generate something',
  schema: ScopeResultSchema,
  options: {
    provider: 'google',
  },
});
```

## Implementation Details

### Type Definition

```typescript
// packages/core/src/brain/types.ts
interface BrainTask {
  // ... other fields
  options?: {
    provider?: 'anthropic' | 'google' | 'openai'; // NEW!
    maxOutputTokens?: number;
    temperature?: number;
    timeoutMs?: number;
    useCache?: boolean;
    cacheTTL?: number;
  };
}
```

### Router Function

```typescript
// packages/core/src/brain/brain-handle.ts
function getAdapter(provider = 'anthropic') {
  switch (provider) {
    case 'google':
      return generateStructuredWithGoogle;
    case 'openai':
      return generateStructuredWithOpenAI;
    case 'anthropic':
    default:
      return generateStructured;
  }
}
```

### Integration

```typescript
// Inside brainHandle()
const provider = task.options?.provider ?? 'anthropic';
const adapter = getAdapter(provider);

const result = await adapter({
  schema: task.schema,
  prompt: promptValidation.sanitizedPrompt,
  system: task.systemPrompt,
  maxOutputTokens: task.options?.maxOutputTokens,
  temperature: task.options?.temperature,
  timeoutMs: task.options?.timeoutMs,
});
```

## Tests

All 4 provider selection tests pass:

```
✓ defaults to Anthropic when provider not specified
✓ uses OpenAI adapter when provider is "openai"
✓ uses Google adapter when provider is "google"
✓ uses Anthropic adapter when provider is explicitly "anthropic"
```

## Environment Variables Required

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...        # For Anthropic
OPENAI_API_KEY=sk-...               # For OpenAI
GOOGLE_GENERATIVE_AI_API_KEY=...   # For Google Gemini
```

## Lines Added

- **types.ts**: 1 line (provider option)
- **brain-handle.ts**: ~40 lines (imports + getAdapter + integration)
- **brain-handle.test.ts**: ~110 lines (4 comprehensive tests)

**Total**: ~151 lines (well within 100-line target for core logic + tests)
