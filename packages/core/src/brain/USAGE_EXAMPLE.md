# brainHandle() Usage Examples

This document provides practical examples of using `brainHandle()`, the central AI router for AppDistillery Platform.

## Basic Usage

```typescript
import { brainHandle } from '@appdistillery/core/brain';
import { z } from 'zod';

// Define your output schema
const ScopeResultSchema = z.object({
  deliverables: z.array(z.object({
    title: z.string().describe('Short deliverable name'),
    description: z.string().describe('What will be delivered'),
    estimatedHours: z.number().describe('Estimated hours'),
  })).describe('List of project deliverables'),
  timeline: z.string().describe('Suggested project timeline'),
  assumptions: z.array(z.string()).describe('Key assumptions made'),
});

// Call brainHandle
const result = await brainHandle({
  tenantId: tenant?.id,
  userId: user.id,
  moduleId: 'agency',
  taskType: 'agency.scope',
  systemPrompt: 'You are a consultancy scope generator...',
  userPrompt: `Generate scope for: ${requirements}`,
  schema: ScopeResultSchema,
});

// Handle discriminated union result
if (!result.success) {
  throw new Error(result.error);
}

// result.data is typed as z.infer<typeof ScopeResultSchema>
console.log(result.data.deliverables);
console.log(`Used ${result.usage.totalTokens} tokens`);
console.log(`Cost: ${result.usage.units} Brain Units`);
```

## Server Action Pattern

```typescript
'use server';

import { brainHandle } from '@appdistillery/core/brain';
import { getSessionContext } from '@appdistillery/core/auth';
import { createClient } from '@/lib/supabase/server';
import { ScopeInputSchema, ScopeResultSchema } from '../schemas/brief';

export async function generateScope(input: unknown) {
  // 1. Get session context
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');

  // 2. Validate input
  const validated = ScopeInputSchema.parse(input);

  // 3. Fetch data with tenant isolation
  const supabase = await createClient();
  const { data: brief } = await supabase
    .from('agency_briefs')
    .select('*')
    .eq('id', validated.briefId)
    .eq('tenant_id', session.tenant?.id) // Always filter by tenant!
    .single();

  if (!brief) throw new Error('Brief not found');

  // 4. Call brainHandle (never call Anthropic directly!)
  const result = await brainHandle({
    tenantId: session.tenant?.id,
    userId: session.user.id,
    moduleId: 'agency',
    taskType: 'agency.scope',
    systemPrompt: SCOPING_SYSTEM_PROMPT,
    userPrompt: buildScopingPrompt(brief),
    schema: ScopeResultSchema,
  });

  // 5. Handle errors
  if (!result.success) {
    throw new Error(result.error);
  }

  // 6. Save to database (usage already recorded by brainHandle)
  await supabase
    .from('agency_briefs')
    .update({
      ai_analysis: result.data,
      status: 'analyzed'
    })
    .eq('id', validated.briefId);

  return result.data;
}
```

## With Custom Options

```typescript
const result = await brainHandle({
  tenantId: tenant?.id,
  moduleId: 'agency',
  taskType: 'agency.proposal',
  systemPrompt: PROPOSAL_SYSTEM_PROMPT,
  userPrompt: buildProposalPrompt(brief),
  schema: ProposalResultSchema,
  options: {
    maxTokens: 8000,    // Longer output
    temperature: 0.9,   // More creative
  },
});
```

## Error Handling Pattern

```typescript
async function performAIOperation() {
  const result = await brainHandle({
    tenantId: tenant?.id,
    moduleId: 'agency',
    taskType: 'agency.scope',
    systemPrompt: systemPrompt,
    userPrompt: userPrompt,
    schema: schema,
  });

  // Type-safe error handling with discriminated union
  if (!result.success) {
    console.error('AI operation failed:', result.error);
    console.log(`Duration: ${result.usage.durationMs}ms`);

    // Handle specific error types
    if (result.error.includes('rate limit')) {
      return { error: 'Rate limit exceeded. Please try again in a moment.' };
    }

    return { error: 'AI operation failed. Please try again.' };
  }

  // TypeScript knows result.data exists here
  return { data: result.data };
}
```

## Testing Pattern

```typescript
import { vi } from 'vitest';
import { brainHandle } from '@appdistillery/core/brain';

// Mock brainHandle in tests
vi.mock('@appdistillery/core/brain', () => ({
  brainHandle: vi.fn(),
}));

describe('generateScope', () => {
  it('calls brainHandle with correct parameters', async () => {
    const mockOutput = {
      deliverables: [{ title: 'MVP', description: 'Core features', estimatedHours: 40 }],
      timeline: '2 weeks',
      assumptions: ['Client provides content'],
    };

    vi.mocked(brainHandle).mockResolvedValue({
      success: true,
      data: mockOutput,
      usage: {
        promptTokens: 100,
        completionTokens: 400,
        totalTokens: 500,
        durationMs: 1200,
        units: 50,
      },
    });

    const result = await generateScope({ briefId: 'brief-123' });

    expect(brainHandle).toHaveBeenCalledWith(
      expect.objectContaining({
        taskType: 'agency.scope',
        moduleId: 'agency',
      })
    );
    expect(result).toEqual(mockOutput);
  });
});
```

## Key Architectural Points

1. **Never call Anthropic/OpenAI directly** - Always use `brainHandle()`
2. **Usage is automatically recorded** - Don't call `recordUsage()` manually
3. **Discriminated unions** - Use `if (!result.success)` for type-safe error handling
4. **Tenant isolation** - Always pass `tenantId` from session context
5. **Task type format** - Must be `module.task` (e.g., `agency.scope`)
6. **Action derivation** - Automatically converts to `module:task:generate` format

## Brain Units Calculation

Brain Units are calculated using:
1. **Fixed cost map** - Predefined costs for known tasks (e.g., `agency.scope` = 50 units)
2. **Token-based fallback** - 1 unit per 100 tokens for unknown tasks

```typescript
// In brain-handle.ts
const UNIT_COSTS: Record<string, number> = {
  'agency.scope': 50,
  'agency.proposal': 100,
};

function calculateUnits(taskType: string, tokens?: number): number {
  return UNIT_COSTS[taskType] ?? Math.ceil((tokens ?? 1000) / 100);
}
```

## What Gets Recorded

Every `brainHandle()` call automatically records:
- `action` - Derived from taskType (e.g., `agency:scope:generate`)
- `tenantId` - Tenant ID (nullable for personal users)
- `userId` - User ID (nullable)
- `moduleId` - Module identifier
- `tokensInput` - Prompt tokens consumed
- `tokensOutput` - Completion tokens consumed
- `units` - Brain Units cost
- `durationMs` - Operation duration
- `metadata` - Task type and failure info (if failed)

Failed operations are recorded with `units: 0` for analytics visibility.
