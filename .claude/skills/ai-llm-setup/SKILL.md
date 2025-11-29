---
name: ai-llm-setup
description: Template skill for integrating AI/LLM providers (OpenAI, Anthropic, Google Gemini, Grok, OpenRouter) into applications. Use when implementing LLM functionality, setting up API integrations, choosing between providers, implementing fallback strategies, optimizing costs, or working with multiple AI models. Covers provider-agnostic patterns, error handling, streaming, tool use, and production best practices. Read PROJECT_CONFIG.md first to understand project-specific settings. (project)
---

# AI/LLM Integration for AppDistillery

AI integration patterns for AppDistillery Platform, built on Vercel AI SDK with `brainHandle()` abstraction.

## Quick Reference

**Stack:**
- Vercel AI SDK (`ai` package) + `generateObject`
- Primary Provider: Anthropic (`@ai-sdk/anthropic`)
- Structured Output: Zod schemas (guaranteed valid JSON)
- Usage Tracking: `recordUsage()` from Core Ledger

**Critical Rule:**
```typescript
// ❌ NEVER call providers directly
import Anthropic from '@anthropic-ai/sdk';
const response = await anthropic.messages.create(...)

// ✅ ALWAYS use brainHandle()
import { brainHandle } from '@appdistillery/core/brain';
const result = await brainHandle({ task, schema, ... });
```

## AppDistillery AI Architecture

```
Server Action → brainHandle() → Vercel AI SDK → Provider API
                     ↓
              recordUsage() → usage_events table
```

### Why brainHandle()?

1. **Centralized routing** - Single point for all AI calls
2. **Automatic metering** - Every call records usage to ledger
3. **Structured output** - Zod schemas guarantee valid JSON
4. **Provider abstraction** - Switch providers without code changes
5. **Error handling** - Consistent error patterns

## Core Pattern: brainHandle()

```typescript
// packages/core/brain/index.ts
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { recordUsage } from '../ledger';
import type { BrainTask, BrainResult } from './types';
import { z } from 'zod';

export async function brainHandle<T extends z.ZodType>(
  task: BrainTask<T>
): Promise<BrainResult<z.infer<T>>> {
  const startTime = Date.now();

  try {
    const result = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: task.schema,
      system: task.systemPrompt,
      prompt: task.userPrompt,
      maxTokens: task.options?.maxTokens ?? 2000,
      temperature: task.options?.temperature ?? 0.7,
    });

    const durationMs = Date.now() - startTime;
    const tokens = result.usage?.totalTokens;

    // Automatic usage recording
    await recordUsage({
      orgId: task.orgId,
      moduleId: task.moduleId,
      action: `brain:${task.taskType}`,
      units: calculateUnits(task.taskType, tokens),
      tokens,
      durationMs,
    });

    return {
      success: true,
      data: result.object,  // Typed to your Zod schema
      usage: { tokens, durationMs },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      usage: { durationMs: Date.now() - startTime },
    };
  }
}
```

### Using brainHandle() in Server Actions

```typescript
// modules/agency/actions/briefs.ts
'use server';

import { brainHandle } from '@appdistillery/core/brain';
import { getSessionContext } from '@appdistillery/core/auth';
import { ScopeResultSchema } from '../schemas/brief';
import { SCOPING_SYSTEM_PROMPT, SCOPING_USER_TEMPLATE } from '../prompts';

export async function generateScope(briefId: string) {
  const { org } = await getSessionContext();

  // Call Brain with Zod schema - output is guaranteed valid
  const result = await brainHandle({
    orgId: org.id,
    moduleId: 'agency',
    taskType: 'agency.scope',
    systemPrompt: SCOPING_SYSTEM_PROMPT,
    userPrompt: SCOPING_USER_TEMPLATE({ problemStatement, goals }),
    schema: ScopeResultSchema,  // ← Guarantees typed output
  });

  if (!result.success) throw new Error(result.error);

  return result.data;  // Typed as ScopeResult
}
```

## Model Selection

### Current Models (November 2025)

| Task Type | Recommended Model | Cost (in/out per 1M) | Context |
|-----------|-------------------|----------------------|---------|
| Simple extraction | `gpt-5-nano` | $0.05 / $0.40 | 272K |
| Lightweight tasks | `gemini-2.5-flash` | $0.30 / $2.50 | 1M |
| General tasks | `gpt-5-mini` | $0.25 / $2.00 | 272K |
| Quality-critical | `claude-haiku-4-5` | $1.00 / $5.00 | 200K |
| Complex reasoning | `claude-sonnet-4-5` | $3.00 / $15.00 | 200K |
| High-level tasks | `gemini-3-pro-preview` | $2.00 / $12.00 | 200K+ |
| Image generation | `gemini-3-pro-image-preview` | Varies | - |
| Frontier reasoning | `gpt-5.1` | $1.25 / $10.00 | 272K |

### AppDistillery Default

For v0.1, AppDistillery uses **Claude Sonnet 4** as default:

```typescript
// Current default in brainHandle()
model: anthropic('claude-sonnet-4-20250514')
```

### Task-to-Model Routing (Future)

```typescript
// Future: brainHandle will route by task type
const MODEL_ROUTING = {
  'agency.scope': 'claude-sonnet-4-5',      // Quality matters
  'agency.proposal': 'claude-sonnet-4-5',   // Quality matters
  'core.classify': 'gpt-5-nano',            // Simple, cheap
  'core.summarize': 'gpt-5-mini',           // Balanced
};
```

## Zod Schema Patterns

### Why Zod + generateObject?

```typescript
// ❌ OLD WAY: Prompt hacking for JSON
const response = await llm.generate(`
  Return ONLY valid JSON. No markdown. No explanation.
  Format: {"summary": "...", "items": [...]}
`);
const data = JSON.parse(response);  // 💥 May fail!

// ✅ NEW WAY: Zod schema guarantees structure
const { object } = await generateObject({
  model: anthropic('claude-sonnet-4-20250514'),
  schema: z.object({
    summary: z.string().describe('2-3 sentence summary'),
    items: z.array(z.string()).describe('Key points'),
  }),
  prompt: userInput,
});
// object is typed and validated automatically
```

### Schema Best Practices

```typescript
// modules/agency/schemas/brief.ts
import { z } from 'zod';

// Use .describe() to guide the model
export const ScopeResultSchema = z.object({
  summary: z.string().describe('2-3 sentence executive summary'),
  problemAnalysis: z.string().describe('Deeper analysis of the core problem'),
  risks: z.array(z.string()).describe('Key risks or concerns'),
  approach: z.string().describe('Recommended high-level approach'),
  questions: z.array(z.string()).describe('Clarifying questions for client'),
  complexity: z.enum(['low', 'medium', 'high']),
  estimatedWeeks: z.number().int().positive(),
  recommendedStack: z.array(z.string()).optional(),
});

export type ScopeResult = z.infer<typeof ScopeResultSchema>;
```

### Shared Schemas Rule

```typescript
// ❌ NEVER duplicate schemas
// In UI component:
const formSchema = z.object({ name: z.string(), email: z.string().email() });
// In server action:
const actionSchema = z.object({ name: z.string(), email: z.string().email() });

// ✅ ALWAYS import from modules/*/schemas/
import { LeadIntakeSchema } from '@/modules/agency/schemas/intake';
// Use same schema in form validation AND server action
```

## Prompt Engineering

### System + User Prompt Pattern

```typescript
// modules/agency/prompts.ts

export const SCOPING_SYSTEM_PROMPT = `You are a Senior Solutions Architect analyzing a client's project requirements.
Your task is to provide a structured assessment that helps scope the engagement.
Be specific, actionable, and realistic about complexity and timeline.`;

export const SCOPING_USER_TEMPLATE = (input: {
  problemStatement: string;
  goals?: string[];
  budgetRange?: string;
}) => `Analyze this project brief:

**Problem Statement:**
${input.problemStatement}

**Client Goals:**
${input.goals?.join(', ') || 'Not specified'}

**Budget:** ${input.budgetRange || 'Not specified'}

Provide your analysis following the required schema.`;
```

### Structured Prompts for Agents

```typescript
const STRUCTURED_PROMPT = `<task>
${taskDescription}
</task>

<context>
${relevantContext}
</context>

<requirements>
${requirements.map(r => `- ${r}`).join('\n')}
</requirements>`;
```

## Usage Tracking

### Brain Units (BUs)

Every AI call costs Brain Units, tracked via `recordUsage()`:

```typescript
// Unit costs defined in module manifest
const UNIT_COSTS = {
  'agency:scope:generate': 50,    // Scope analysis
  'agency:proposal:draft': 100,   // Proposal generation
};

// brainHandle() automatically records usage
await recordUsage({
  orgId: task.orgId,
  moduleId: task.moduleId,
  action: `brain:${task.taskType}`,
  units: UNIT_COSTS[task.taskType] ?? calculateFromTokens(tokens),
  tokens,
  durationMs,
});
```

### Viewing Usage

```typescript
import { getUsageHistory } from '@appdistillery/core/ledger';

const history = await getUsageHistory(orgId, { limit: 100 });
// Returns: [{ action, units, tokens, createdAt }, ...]
```

## Error Handling

### brainHandle Error Pattern

```typescript
const result = await brainHandle({
  orgId: org.id,
  moduleId: 'agency',
  taskType: 'agency.scope',
  schema: ScopeResultSchema,
  systemPrompt: SYSTEM_PROMPT,
  userPrompt: userInput,
});

if (!result.success) {
  // Log for debugging
  console.error('[Brain Error]', {
    taskType: 'agency.scope',
    error: result.error,
    durationMs: result.usage.durationMs,
  });

  // User-friendly error
  throw new Error('Failed to generate scope analysis. Please try again.');
}

return result.data;  // Typed output
```

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Schema validation failed | Output didn't match Zod schema | Improve schema descriptions |
| Rate limit exceeded | Too many requests | Add retry with backoff |
| Context length exceeded | Input too long | Truncate or summarize input |
| Invalid API key | Missing/wrong env var | Check ANTHROPIC_API_KEY |

## Adding New Providers

### Step 1: Install SDK

```bash
pnpm add @ai-sdk/openai   # For OpenAI/GPT-5
pnpm add @ai-sdk/google   # For Gemini
```

### Step 2: Update brainHandle (Future)

```typescript
// packages/core/brain/index.ts
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

const PROVIDERS = {
  'claude-sonnet-4-5': anthropic('claude-sonnet-4-20250514'),
  'gpt-5-mini': openai('gpt-5-mini'),
  'gemini-2.5-flash': google('gemini-2.5-flash'),
};

export async function brainHandle<T extends z.ZodType>(
  task: BrainTask<T>
): Promise<BrainResult<z.infer<T>>> {
  const model = PROVIDERS[task.model] ?? PROVIDERS['claude-sonnet-4-5'];

  const result = await generateObject({
    model,
    schema: task.schema,
    // ...
  });
}
```

## Provider Reference Files

For detailed provider-specific patterns (direct SDK usage, streaming, tool use):

- **Anthropic**: [references/anthropic.md](references/anthropic.md) - Claude 4 family, prompt caching
- **OpenAI**: [references/openai.md](references/openai.md) - GPT-5 family, function calling
- **Google Gemini**: [references/google-gemini.md](references/google-gemini.md) - Gemini 2.5/3, multimodal
- **Grok (X.AI)**: [references/grok.md](references/grok.md) - Real-time data access
- **OpenRouter**: [references/openrouter.md](references/openrouter.md) - Unified API for all providers

## Testing

```typescript
import { describe, it, expect, vi } from 'vitest';
import { brainHandle } from '@appdistillery/core/brain';

// Mock brainHandle for testing
vi.mock('@appdistillery/core/brain', () => ({
  brainHandle: vi.fn(),
}));

describe('generateScope', () => {
  it('calls brainHandle with correct task type', async () => {
    vi.mocked(brainHandle).mockResolvedValue({
      success: true,
      data: { summary: 'Test', risks: [], complexity: 'low' },
      usage: { tokens: 500, durationMs: 1000 },
    });

    await generateScope('brief-123');

    expect(brainHandle).toHaveBeenCalledWith(
      expect.objectContaining({
        taskType: 'agency.scope',
        schema: expect.any(Object),
      })
    );
  });
});
```

## Environment Variables

```bash
# .env.local

# AI Provider (required)
ANTHROPIC_API_KEY=sk-ant-...

# Future: Multi-provider support
# OPENAI_API_KEY=sk-...
# GOOGLE_API_KEY=...
```

## Cross-Skill Integration

When working with AI in AppDistillery:

- **code-quality** - Server Action patterns, brainHandle usage
- **testing** - Mocking brainHandle in tests
- **debugging** - Debugging AI errors, schema mismatches
- **supabase** - Recording usage to database
