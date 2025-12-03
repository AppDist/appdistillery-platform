# ADR-001: AI Provider Abstraction via brainHandle

## Status

Accepted

## Date

2024-11-29

## Context

AppDistillery requires AI capabilities across modules (scoping, proposals, etc.). Direct provider API calls create:

1. **Tight coupling** - Each module implements its own AI logic
2. **Inconsistent patterns** - Different error handling, retry logic
3. **No usage tracking** - Brain Units require centralized token tracking
4. **Provider lock-in** - Changing providers breaks all modules
5. **Testing complexity** - Mocking APIs in every test suite

## Decision

Implement **Brain service** with `brainHandle()` as central abstraction:

```typescript
const result = await brainHandle({
  tenantId: session.orgId,
  moduleId: 'agency',
  taskType: 'agency.scope',
  systemPrompt: SCOPING_PROMPT,
  userPrompt: userInput,
  schema: ScopeResultSchema,
});
```

**Key features:**
- Single entry point (`brainHandle()` / `brainHandleStream()`)
- Zod schema validation for all outputs
- Provider adapters (Anthropic, OpenAI, Google)
- Automatic usage recording
- Type-safe discriminated unions

**Location:** `packages/core/src/brain/`

## Options Considered

### Option A: Direct Calls (Rejected)

**Pros:** No abstraction overhead, full features
**Cons:** Tight coupling, duplicated logic, no tracking, hard to test

### Option B: LangChain (Rejected)

**Pros:** Rich ecosystem, built-in features
**Cons:** Heavy framework, complex, less control, overkill

### Option C: brainHandle() (Selected)

**Pros:** Consistent interface, automatic tracking, type-safe, testable, lightweight
**Cons:** Requires adapter maintenance, may not expose all features

## Consequences

### Positive

- Centralized AI logic, easier to optimize
- Usage tracking built-in for Brain Units
- Provider switching via config
- Type safety with Zod
- Testability (mock brainHandle, not providers)

### Negative

- Adapter maintenance required
- Advanced provider features may not map cleanly
- Migration effort for existing code

### Enforcement

- Code reviews reject direct provider calls
- Future: ESLint rule to disallow direct imports
- Documentation emphasizes brainHandle() only

## References

- `packages/core/src/brain/brain-handle.ts` - Implementation
- `docs/api/BRAIN.md` - API documentation
- `docs/decisions/0002-ai-adapter-pattern.md` - Detailed adapter design
