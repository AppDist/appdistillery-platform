# ADR 0004: Usage Tracking and Ledger Architecture

## Status
Accepted

## Date
2025-12-02

## Context
AppDistillery needs to track AI usage for billing, rate limiting, and analytics. AI providers charge in provider-specific units (tokens, characters, requests), but we need a unified billing model that abstracts provider differences and enables predictable pricing for users.

We considered:
1. **Per-request billing** - Simple, predictable, but ignores cost differences between providers/models
2. **Direct provider costs** - Pass-through pricing, but unpredictable and provider-dependent
3. **Normalized Brain Units** - Internal currency that abstracts provider differences
4. **Subscription-only** - Fixed monthly fee, but no usage visibility or cost control

## Decision
We will use **Brain Units** as a normalized pricing model with event sourcing:

### Brain Units (Normalized Pricing)
- **1 Brain Unit** = Baseline AI operation cost (e.g., ~1000 tokens with Claude Haiku)
- **Conversion rates** per provider/model configured in module manifests
- **Users see consistent pricing** regardless of backend provider changes
- **Example**: Scope generation = 50 Brain Units (regardless of tokens used)

### Event Sourcing Architecture
- **Immutable usage events** - Record every AI operation in `usage_events` table
- **Server-side recording** - `recordUsage()` function with service role access
- **Aggregation on-demand** - Sum Brain Units per tenant/period for billing
- **Metadata storage** - JSONB column for provider-specific details (model, tokens, duration)

### Ledger Package Structure
```
packages/core/src/ledger/
├── record-usage.ts       # Write usage events (service role)
├── get-usage-summary.ts  # Aggregate Brain Units
├── get-usage-history.ts  # Fetch usage events
└── types.ts             # RecordUsageInput, UsageEvent
```

### Database Schema: usage_events
```sql
CREATE TABLE public.usage_events (
  id UUID PRIMARY KEY,
  tenant_id UUID,              -- NULL for Personal mode
  user_id UUID,
  action TEXT NOT NULL,         -- 'agency:scope:generate'
  module_id TEXT,               -- 'agency'
  tokens_input INT DEFAULT 0,
  tokens_output INT DEFAULT 0,
  tokens_total INT GENERATED,   -- Computed column
  units INT NOT NULL,           -- Brain Units for billing
  duration_ms INT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Usage Recording Pattern
```typescript
// Server Action pattern
const result = await brainHandle({
  task: 'agency.scope',
  input: validated,
  outputSchema: ScopeResultSchema,
});

// Always record usage after AI operations
await recordUsage({
  action: 'agency:scope:generate',
  tenantId: session.tenant?.id,
  userId: session.user.id,
  moduleId: 'agency',
  tokensInput: result.usage.inputTokens,
  tokensOutput: result.usage.outputTokens,
  units: 50,  // Brain Units
});
```

## Consequences

### Positive
- **Provider independence** - Brain Units abstract provider-specific pricing
- **Predictable billing** - Users see consistent costs regardless of backend changes
- **Audit trail** - Immutable event log for compliance and debugging
- **Flexible aggregation** - Can query usage by tenant, user, module, action, time period
- **Personal mode support** - `tenant_id` can be NULL for personal usage
- **Analytics-ready** - Raw events enable detailed usage analysis
- **Service role bypass** - `recordUsage()` uses service role to avoid RLS complexities

### Negative
- **Storage overhead** - Every AI operation creates a database row (mitigated by archival strategy)
- **Aggregation cost** - Calculating totals requires summing rows (mitigated by RPC functions and caching)
- **Brain Unit calibration** - Must regularly review conversion rates as provider pricing changes
- **No real-time rate limiting** - Aggregation queries are async, not suitable for hard limits

### Design Decisions

**Event sourcing over counter tables:**
- Immutable events provide audit trail
- Can recalculate totals if pricing changes
- Enables detailed analytics

**Server-side recording with service role:**
- Prevents client tampering with usage records
- Simplifies RLS policies (service role bypasses)
- Centralizes usage logic in Core package

**Brain Units over direct costs:**
- Users see stable prices even if we change providers
- Can adjust internal conversion rates without changing user-facing prices
- Simplifies billing logic (no currency conversions)

**Per-request vs. subscription:**
- Per-request billing via Brain Units
- Enables pay-as-you-go pricing
- Future: Add subscription tiers with included Brain Units

### Risks
- **Provider cost increases** → Mitigated by absorbing small changes, adjusting Brain Unit rates for major changes
- **Storage growth** → Mitigated by archival strategy (e.g., aggregate monthly, archive old events)
- **Aggregation performance** → Mitigated by database indexes and RPC functions

## References
- `packages/core/src/ledger/record-usage.ts` - Core usage recording function
- `packages/core/src/ledger/get-usage-summary.ts` - Aggregation logic
- `packages/core/src/ledger/types.ts` - TypeScript interfaces
- `supabase/migrations/20251202131205_create_usage_events.sql` - Database schema
- `supabase/migrations/20251203120000_add_get_usage_summary_rpc.sql` - Aggregation RPC function
