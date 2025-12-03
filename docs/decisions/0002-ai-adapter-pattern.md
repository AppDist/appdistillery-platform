# ADR 0002: AI Adapter Pattern with Vercel AI SDK

## Status
Accepted

## Date
2025-12-01

## Context
AppDistillery needs to integrate AI capabilities from multiple providers (Anthropic Claude, OpenAI, Google Gemini) with the flexibility to switch providers or add new ones without major refactoring. Direct API calls to each provider would create tight coupling and inconsistent interfaces across the codebase.

We considered:
1. **Direct API calls** - Tight coupling to each provider's SDK, inconsistent interfaces
2. **LangChain** - Heavy framework with too many abstractions for our needs
3. **Vercel AI SDK with provider adapters** - Lightweight abstraction, consistent interface

## Decision
We will use **Vercel AI SDK** as the abstraction layer with provider-specific adapters:

- **Core abstraction**: Vercel AI SDK's `generateObject()` for structured outputs
- **Provider adapters**: Thin wrappers in `packages/core/src/brain/adapters/`
  - `anthropic.ts` - Anthropic Claude adapter (default)
  - `openai.ts` - OpenAI GPT adapter
  - `google.ts` - Google Gemini adapter
- **Shared utilities**: Common retry logic, error handling, usage extraction in `shared.ts`
- **Zod validation**: All AI outputs validated against Zod schemas

### Adapter Pattern Structure

```typescript
// packages/core/src/brain/adapters/anthropic.ts
export async function generateStructured<T extends z.ZodType>(
  options: GenerateOptions<T>
): Promise<GenerateResult<z.infer<T>>> {
  const anthropic = getAnthropicClient();

  const result = await generateObject({
    model: anthropic(options.model),
    schema: options.schema,
    prompt: options.prompt,
    system: options.system,
  });

  return {
    success: true,
    object: result.object,
    usage: extractUsage(result.usage),
  };
}
```

### Unified Interface
All adapters return the same `GenerateResult<T>` type:

```typescript
type GenerateResult<T> =
  | { success: true; object: T; usage: TokenUsage }
  | { success: false; error: string }
```

## Consequences

### Positive
- **Provider flexibility** - Can switch providers via environment variables or task config
- **Consistent interface** - All adapters expose the same `GenerateResult` type
- **Type safety** - Zod schemas ensure structured outputs are validated at runtime
- **Shared utilities** - Retry logic, error handling, token counting reused across providers
- **Lightweight** - Minimal abstraction overhead compared to LangChain
- **Future-proof** - Easy to add new providers (e.g., Mistral, Llama) with same interface

### Negative
- **Vercel AI SDK dependency** - If SDK changes significantly, all adapters need updates
- **Manual adapter maintenance** - Each provider needs its own adapter implementation
- **Limited to structured outputs** - Current design focused on `generateObject`, streaming or chat not yet supported

### Risks
- **SDK breaking changes** → Mitigated by using LTS versions and integration tests
- **Provider-specific features** → Some provider features may not map cleanly to unified interface

## References
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- `packages/core/src/brain/adapters/index.ts` - Adapter exports
- `packages/core/src/brain/adapters/anthropic.ts` - Default Anthropic adapter
- `packages/core/src/brain/adapters/openai.ts` - OpenAI adapter
- `packages/core/src/brain/adapters/google.ts` - Google Gemini adapter
- `packages/core/src/brain/adapters/shared.ts` - Shared utilities
