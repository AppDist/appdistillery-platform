# OpenRouter API Reference

> **AppDistillery Note**: For normal AI operations, use `brainHandle()` from Core.
> OpenRouter is useful when extending brainHandle() with multi-provider fallback,
> or when you need quick access to new models before adding direct SDK support.

## What is OpenRouter

OpenRouter is a **unified API gateway** for 500+ models from 60+ providers:

- **Single API** for all major providers (OpenAI, Anthropic, Google, xAI, Meta, etc.)
- **OpenAI-compatible** interface - use the OpenAI SDK
- **Automatic fallback** when providers are down
- **Unified billing** - one invoice for all providers
- **No subscription** - pay-as-you-go
- **BYOK support** - 1M free requests/month with your own keys

### Important: Models Change Frequently

**OpenRouter aggregates models from all providers.** Model availability, pricing, and naming can change as providers update their offerings. Always check the current model list:

**https://openrouter.ai/models**

The examples below use model names current as of November 2025, but **verify before implementing**.

## Setup

Uses OpenAI SDK (fully compatible):

```bash
npm install openai
```

```typescript
import OpenAI from 'openai';

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY, // sk-or-...
  defaultHeaders: {
    'HTTP-Referer': process.env.APP_URL,     // For rankings
    'X-Title': process.env.APP_NAME,         // For rankings
  },
});
```

## Model Naming Convention

Format: `provider/model-name`

```typescript
// Examples (verify current names at openrouter.ai/models)
'openai/gpt-5.1'
'openai/gpt-5-mini'
'openai/gpt-5-nano'
'anthropic/claude-sonnet-4-5'
'anthropic/claude-haiku-4-5'
'google/gemini-2.5-flash'
'google/gemini-3-pro-preview'
'x-ai/grok-4.1'
'x-ai/grok-4.1-fast'
'meta-llama/llama-4'
```

## Core Patterns

### Basic Generation

```typescript
async function generate(
  prompt: string,
  model = 'openai/gpt-5-mini'
): Promise<string> {
  const completion = await openrouter.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
  });

  return completion.choices[0].message.content || '';
}

// Switch models by changing a string
await generate('Hello', 'openai/gpt-5-mini');
await generate('Hello', 'anthropic/claude-haiku-4-5');
await generate('Hello', 'x-ai/grok-4.1');
```

### Streaming

```typescript
async function stream(
  prompt: string,
  onChunk: (text: string) => void,
  model = 'anthropic/claude-haiku-4-5'
): Promise<void> {
  const stream = await openrouter.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) onChunk(content);
  }
}
```

## Key Features

### Automatic Fallback

```typescript
// OpenRouter handles provider outages automatically
const completion = await openrouter.chat.completions.create({
  model: 'anthropic/claude-haiku-4-5',
  messages: [{ role: 'user', content: prompt }],
  // If Anthropic is down, OpenRouter routes to backup
});
```

### Explicit Fallback Chain

```typescript
const completion = await openrouter.chat.completions.create({
  model: 'anthropic/claude-haiku-4-5',
  route: 'fallback',
  models: [
    'anthropic/claude-haiku-4-5',     // Primary
    'openai/gpt-5-mini',               // Fallback 1
    'google/gemini-2.5-flash',         // Fallback 2
  ],
  messages: [{ role: 'user', content: prompt }],
});
```

### Provider Preferences

```typescript
const completion = await openrouter.chat.completions.create({
  model: 'anthropic/claude-haiku-4-5',
  provider: {
    allow_fallbacks: true,
    order: ['Anthropic', 'OpenAI'], // Prefer Anthropic
  },
  messages: [{ role: 'user', content: prompt }],
});
```

### BYOK (Bring Your Own Key)

Use your own API keys through OpenRouter (1M free requests/month):

```typescript
const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY,
    'X-Anthropic-Api-Key': process.env.ANTHROPIC_API_KEY,
    'X-Google-Api-Key': process.env.GOOGLE_API_KEY,
  },
});
```

## Cost Optimization

### Dynamic Model Selection

```typescript
// Check current pricing at openrouter.ai/models
function selectByComplexity(
  complexity: 'simple' | 'medium' | 'complex'
): string {
  const models = {
    simple: 'openai/gpt-5-nano',           // Cheapest
    medium: 'openai/gpt-5-mini',           // Balanced
    complex: 'anthropic/claude-sonnet-4-5', // Best quality
  };
  return models[complexity];
}
```

### Budget-Aware Selection

```typescript
class CostAwareClient {
  // NOTE: Pricing changes - verify at openrouter.ai/models
  private pricing: Record<string, { input: number; output: number }> = {
    'openai/gpt-5-nano': { input: 0.05, output: 0.40 },
    'openai/gpt-5-mini': { input: 0.25, output: 2.00 },
    'anthropic/claude-haiku-4-5': { input: 1.00, output: 5.00 },
    'x-ai/grok-4.1': { input: 0.20, output: 0.50 },
  };

  async generate(prompt: string, maxCost = 0.01): Promise<string> {
    const estimatedTokens = Math.ceil(prompt.length / 4);

    for (const [model, rates] of Object.entries(this.pricing)) {
      const cost = (estimatedTokens * rates.input + 1000 * rates.output) / 1000000;

      if (cost <= maxCost) {
        const completion = await openrouter.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
        });
        return completion.choices[0].message.content || '';
      }
    }

    throw new Error(`No model within budget of $${maxCost}`);
  }
}
```

## Monitoring

### Usage Dashboard

View detailed analytics at: **https://openrouter.ai/activity**

### Cost Tracking API

```typescript
async function checkCredits() {
  const response = await fetch('https://openrouter.ai/api/v1/credits', {
    headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` },
  });

  const data = await response.json();
  console.log('Remaining credits:', data.credits);
  console.log('Total usage:', data.usage);
}
```

## Error Handling

```typescript
async function robustGenerate(prompt: string, model: string): Promise<string> {
  const maxRetries = 3;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const completion = await openrouter.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
      });
      return completion.choices[0].message.content || '';
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;

      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw new Error('Should not reach');
}
```

## When to Use OpenRouter

### Use OpenRouter When:
- Want flexibility to switch providers quickly
- Building MVP, unsure which provider is best
- Need automatic fallback for reliability
- Want unified billing across providers
- Experimenting with many models
- Need quick access to new models

### Use Direct Integration When:
- Committed to single provider
- Need minimum latency (OpenRouter adds ~25ms)
- Need provider-specific features not exposed via OpenRouter
- Have custom enterprise contract with provider
- Building brainHandle() with specific provider SDKs

## Pricing

- **No markup**: Pass-through pricing from providers
- **No subscription**: Pay only for what you use
- **BYOK**: 1M free requests/month with your own keys
- **Credits**: Buy credits to use across all providers

## Keeping Models Updated

Since OpenRouter aggregates many providers, model availability changes:

1. **Bookmark**: https://openrouter.ai/models
2. **Check before implementing**: Verify model name and pricing
3. **Use fallback chains**: Protect against model deprecation
4. **Monitor announcements**: https://openrouter.ai/changelog

## Integration with brainHandle()

When extending brainHandle() for multi-provider support:

```typescript
// packages/core/brain/providers/openrouter.ts
import OpenAI from 'openai';

export function createOpenRouterProvider() {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': process.env.APP_URL,
      'X-Title': 'AppDistillery',
    },
  });
}

// Use as fallback in brainHandle()
const result = await generateObject({
  model: openrouter('openai/gpt-5-mini'),  // Via OpenRouter
  schema: task.schema,
  // ...
});
```

## Resources

- [Model List](https://openrouter.ai/models) - **Check this first!**
- [Documentation](https://openrouter.ai/docs)
- [API Keys](https://openrouter.ai/keys)
- [Activity Dashboard](https://openrouter.ai/activity)
- [Changelog](https://openrouter.ai/changelog)

## Summary

**OpenRouter = Unified API Gateway**

- Access 500+ models via single API
- OpenAI-compatible SDK
- Automatic fallback and unified billing
- **Models change** - always verify at openrouter.ai/models
- Best for flexibility and experimentation
- Add ~25ms latency vs direct integration
