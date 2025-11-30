---
id: TASK-1-10a
title: OpenAI adapter
priority: P1-High
complexity: 2
module: core
status: BACKLOG
created: 2024-11-30
---

# TASK-1-10a: OpenAI adapter

## Description

Create OpenAI AI adapter using Vercel AI SDK for structured output generation with GPT-4 models.

## Acceptance Criteria

- [ ] @ai-sdk/openai installed
- [ ] OpenAI model configuration (GPT-4o, GPT-4o-mini)
- [ ] generateObject helper for structured output
- [ ] Token counting from response
- [ ] Error handling with retries
- [ ] Environment variable: OPENAI_API_KEY

## Technical Notes

Using Vercel AI SDK with OpenAI (same pattern as Anthropic):

```typescript
// packages/core/src/brain/adapters/openai.ts
import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Available models
export const openaiModels = {
  'gpt-4o': openai('gpt-4o'),
  'gpt-4o-mini': openai('gpt-4o-mini'),
  'gpt-4-turbo': openai('gpt-4-turbo'),
} as const

export const defaultOpenAIModel = openaiModels['gpt-4o']

export interface OpenAIGenerateOptions<T extends z.ZodType> {
  model?: keyof typeof openaiModels
  schema: T
  prompt: string
  system?: string
  maxTokens?: number
}

export async function generateWithOpenAI<T extends z.ZodType>(
  options: OpenAIGenerateOptions<T>
): Promise<{
  object: z.infer<T>
  usage: { promptTokens: number; completionTokens: number }
}> {
  const model = options.model
    ? openaiModels[options.model]
    : defaultOpenAIModel

  const result = await generateObject({
    model,
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

- `packages/core/src/brain/adapters/openai.ts` - Adapter
- `packages/core/src/brain/adapters/index.ts` - Export
- `packages/core/package.json` - Add @ai-sdk/openai
- `.env.example` - Document OPENAI_API_KEY

### Patterns to Follow

- Same interface as Anthropic adapter
- Use Vercel AI SDK (not direct OpenAI SDK)
- Always use generateObject for structured output
- Return token usage for tracking
- Support model selection

## Dependencies

- **Blocked by**: None
- **Blocks**: TASK-1-11 (brainHandle can use multiple adapters)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
