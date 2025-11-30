---
id: TASK-1-10
title: Anthropic adapter
priority: P1-High
complexity: 3
module: core
status: BACKLOG
created: 2024-11-30
---

# TASK-1-10: Anthropic adapter

## Description

Create Anthropic AI adapter using Vercel AI SDK for structured output generation.

## Acceptance Criteria

- [ ] @ai-sdk/anthropic installed
- [ ] Anthropic model configuration
- [ ] generateObject helper for structured output
- [ ] Token counting from response
- [ ] Error handling with retries
- [ ] Environment variable: ANTHROPIC_API_KEY

## Technical Notes

Using Vercel AI SDK with Anthropic:

```typescript
// packages/core/src/brain/adapters/anthropic.ts
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const defaultModel = anthropic('claude-sonnet-4-20250514')

export interface GenerateOptions<T extends z.ZodType> {
  model?: ReturnType<typeof anthropic>
  schema: T
  prompt: string
  system?: string
  maxTokens?: number
}

export async function generateStructured<T extends z.ZodType>(
  options: GenerateOptions<T>
): Promise<{
  object: z.infer<T>
  usage: { promptTokens: number; completionTokens: number }
}> {
  const result = await generateObject({
    model: options.model ?? defaultModel,
    schema: options.schema,
    prompt: options.prompt,
    system: options.system,
    maxTokens: options.maxTokens ?? 4096,
  })

  return {
    object: result.object,
    usage: {
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
    },
  }
}
```

### Files to Create/Modify

- `packages/core/src/brain/adapters/anthropic.ts` - Adapter
- `packages/core/src/brain/adapters/index.ts` - Exports
- `packages/core/package.json` - Add @ai-sdk/anthropic
- `.env.example` - Document ANTHROPIC_API_KEY

### Patterns to Follow

- Use Vercel AI SDK (not direct Anthropic SDK)
- Always use generateObject for structured output
- Return token usage for tracking
- Default to Claude Sonnet

## Dependencies

- **Blocked by**: None
- **Blocks**: TASK-1-11 (brainHandle service)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
