# AppDistillery AI Configuration

Project-specific AI/LLM settings for AppDistillery Platform.

## Project Overview

- **Project Name**: AppDistillery Platform
- **Primary Use Case**: AI-powered consultancy tools (scoping, proposals)
- **Expected Volume**: Low initially (dogfooding), scaling with users

## Integration Approach

**Selected**: Vercel AI SDK with `brainHandle()` abstraction

```typescript
// All AI calls go through brainHandle()
import { brainHandle } from '@appdistillery/core/brain';

const result = await brainHandle({
  orgId: org.id,
  moduleId: 'agency',
  taskType: 'agency.scope',
  schema: ScopeResultSchema,
  systemPrompt: SYSTEM_PROMPT,
  userPrompt: userPrompt,
});
```

**Why this approach:**
- Single entry point for all AI operations
- Automatic usage metering via `recordUsage()`
- Zod schemas guarantee valid JSON output
- Easy to add providers without changing module code

## Provider Strategy

### Current (v0.1)

| Priority | Provider | Model | Purpose |
|----------|----------|-------|---------|
| Primary | Anthropic | `claude-sonnet-4-20250514` | All tasks |

### Future (v0.2+)

| Priority | Provider | Model | Purpose |
|----------|----------|-------|---------|
| Primary | Anthropic | `claude-sonnet-4-5` | Quality tasks (scope, proposals) |
| Cost-opt | OpenAI | `gpt-5-mini` | General tasks |
| Cheap | OpenAI | `gpt-5-nano` | Classification, extraction |
| Fallback | Google | `gemini-2.5-flash` | When others fail |

## Model Configuration

### Task-to-Model Mapping

```typescript
// Future: packages/core/brain/config.ts
export const MODEL_CONFIG = {
  tasks: {
    // Agency module
    'agency.scope': {
      model: 'claude-sonnet-4-5',
      maxTokens: 2000,
      temperature: 0.7,
    },
    'agency.proposal': {
      model: 'claude-sonnet-4-5',
      maxTokens: 4000,
      temperature: 0.5,
    },

    // Core utilities (future)
    'core.classify': {
      model: 'gpt-5-nano',
      maxTokens: 100,
      temperature: 0.2,
    },
    'core.summarize': {
      model: 'gpt-5-mini',
      maxTokens: 500,
      temperature: 0.5,
    },
  },

  fallback: {
    primary: 'claude-sonnet-4-5',
    secondary: 'gpt-5-mini',
    ultimate: 'gemini-2.5-flash',
  },
} as const;
```

### Model Reference

| Model ID | Provider | Cost (Input/Output per 1M) | Context | Best For |
|----------|----------|---------------------------|---------|----------|
| `gpt-5-nano` | OpenAI | $0.05 / $0.40 | 272K | Simple extraction |
| `gpt-5-mini` | OpenAI | $0.25 / $2.00 | 272K | General tasks |
| `gpt-5.1` | OpenAI | $1.25 / $10.00 | 272K | Frontier reasoning |
| `claude-haiku-4-5` | Anthropic | $1.00 / $5.00 | 200K | Quality-critical |
| `claude-sonnet-4-5` | Anthropic | $3.00 / $15.00 | 200K | Complex reasoning |
| `gemini-2.5-flash` | Google | $0.30 / $2.50 | 1M | Lightweight tasks |
| `gemini-3-pro-preview` | Google | $2.00 / $12.00 | 200K+ | High-level tasks |
| `gemini-3-pro-image-preview` | Google | Varies | - | Image generation |

## Environment Variables

### Required (v0.1)

```bash
# .env.local

# AI Provider
ANTHROPIC_API_KEY=sk-ant-...
```

### Future (Multi-provider)

```bash
# .env.local

# === AI Providers ===
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...

# === Configuration ===
PRIMARY_MODEL=claude-sonnet-4-5
FALLBACK_MODEL=gpt-5-mini
```

## Brain Units (BU) Costs

### Agency Module

| Action | BU Cost | Description |
|--------|---------|-------------|
| `agency:scope:generate` | 50 | AI brief analysis |
| `agency:proposal:draft` | 100 | AI proposal generation |

### Cost Calculation

```typescript
// packages/core/brain/index.ts
function calculateUnits(taskType: string, tokens?: number): number {
  const costMap: Record<string, number> = {
    'agency.scope': 50,
    'agency.proposal': 100,
  };
  return costMap[taskType] ?? Math.ceil((tokens ?? 1000) / 100);
}
```

## Zod Schemas

### Agency Module Schemas

```typescript
// Import from modules/agency/schemas/
import { LeadIntakeSchema } from '@/modules/agency/schemas/intake';
import { ScopeResultSchema } from '@/modules/agency/schemas/brief';
import { ProposalResultSchema } from '@/modules/agency/schemas/proposal';
```

### Schema Locations

| Schema | Location | Used For |
|--------|----------|----------|
| `LeadIntakeSchema` | `modules/agency/schemas/intake.ts` | Lead capture form |
| `ScopeResultSchema` | `modules/agency/schemas/brief.ts` | AI scope output |
| `ProposalResultSchema` | `modules/agency/schemas/proposal.ts` | AI proposal output |

## Prompts

### Location

All prompts are in `modules/agency/prompts.ts`:

```typescript
export const SCOPING_SYSTEM_PROMPT = `...`;
export const SCOPING_USER_TEMPLATE = (input) => `...`;
export const PROPOSAL_SYSTEM_PROMPT = `...`;
export const PROPOSAL_USER_TEMPLATE = (input) => `...`;
```

### Guidelines

1. System prompts define the AI's role and expertise
2. User templates structure the input data
3. Use `${variable}` interpolation, not string concatenation
4. Always end with "Provide your analysis following the required schema."

## Testing Configuration

### Test Environment

```bash
# .env.test
ANTHROPIC_API_KEY=sk-ant-test-key
```

### Mocking brainHandle

```typescript
// In test files
vi.mock('@appdistillery/core/brain', () => ({
  brainHandle: vi.fn(),
}));

// Mock response
vi.mocked(brainHandle).mockResolvedValue({
  success: true,
  data: {
    summary: 'Test summary',
    risks: ['Risk 1'],
    complexity: 'medium',
    estimatedWeeks: 4,
  },
  usage: { tokens: 500, durationMs: 1000 },
});
```

## Rate Limits

### Anthropic (Current Provider)

| Tier | RPM | TPM |
|------|-----|-----|
| Free | 5 | 20,000 |
| Build | 50 | 40,000 |
| Scale | 1,000 | 400,000 |

### Configuration

```typescript
// Future: packages/core/brain/rate-limit.ts
export const RATE_LIMITS = {
  requestsPerMinute: 50,
  tokensPerMinute: 40000,
  concurrentRequests: 5,
  retryAttempts: 3,
  baseRetryDelay: 1000,
};
```

## Cost Management

### Budget (v0.1 - Dogfooding)

- **Daily Budget**: $10
- **Monthly Budget**: $100
- **Alert Threshold**: 80%

### Monitoring

Usage is tracked in `usage_events` table:

```sql
SELECT
  DATE(created_at) as date,
  SUM(units) as total_units,
  SUM(tokens) as total_tokens
FROM usage_events
WHERE org_id = 'your-org-id'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Quick Checklist

Before adding AI functionality:

- [ ] Create Zod schema in `modules/*/schemas/`
- [ ] Create prompts in `modules/*/prompts.ts`
- [ ] Use `brainHandle()` in Server Action
- [ ] Define BU cost in module manifest
- [ ] Add test with mocked brainHandle
- [ ] Update this config if new task type
