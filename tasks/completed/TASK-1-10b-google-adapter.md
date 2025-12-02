---
id: TASK-1-10b
title: Google Gemini adapter
priority: P1-High
complexity: 2
module: core
status: COMPLETED
created: 2024-11-30
started: 2025-12-02
completed: 2025-12-02
---

# TASK-1-10b: Google Gemini adapter

## Description

Create Google Gemini AI adapter using Vercel AI SDK for structured output generation.

## Acceptance Criteria

- [x] @ai-sdk/google installed
- [x] Gemini model configuration (Gemini 2.5 Flash default, 2.5 Pro, 2.5 Flash Lite, 3 Pro Preview)
- [x] generateObject helper for structured output
- [x] Token counting from response
- [x] Error handling with retries
- [x] Environment variable: GOOGLE_GENERATIVE_AI_API_KEY

## Technical Notes

Using Vercel AI SDK with Google Gemini (same pattern as Anthropic/OpenAI):

```typescript
// packages/core/src/brain/adapters/google.ts
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

// Available models
export const googleModels = {
  'gemini-2.0-flash': google('gemini-2.0-flash'),
  'gemini-1.5-pro': google('gemini-1.5-pro'),
  'gemini-1.5-flash': google('gemini-1.5-flash'),
} as const

export const defaultGoogleModel = googleModels['gemini-2.0-flash']

export interface GoogleGenerateOptions<T extends z.ZodType> {
  model?: keyof typeof googleModels
  schema: T
  prompt: string
  system?: string
  maxTokens?: number
}

export async function generateWithGoogle<T extends z.ZodType>(
  options: GoogleGenerateOptions<T>
): Promise<{
  object: z.infer<T>
  usage: { promptTokens: number; completionTokens: number }
}> {
  const model = options.model
    ? googleModels[options.model]
    : defaultGoogleModel

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

- `packages/core/src/brain/adapters/google.ts` - Adapter
- `packages/core/src/brain/adapters/index.ts` - Export
- `packages/core/package.json` - Add @ai-sdk/google
- `.env.example` - Document GOOGLE_GENERATIVE_AI_API_KEY

### Patterns to Follow

- Same interface as Anthropic/OpenAI adapters
- Use Vercel AI SDK (not direct Google SDK)
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
| 2025-12-02 | Completed: Implemented Google Gemini adapter with gemini-2.5-flash default |
