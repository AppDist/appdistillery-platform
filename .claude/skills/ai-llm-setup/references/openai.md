# OpenAI API Reference

> **AppDistillery Note**: For normal AI operations, use `brainHandle()` from Core.
> These patterns are for reference when extending brainHandle() with OpenAI support,
> implementing streaming UI, or using GPT-5 specific features.

## Contents
- Models and Pricing
- SDK Setup
- Core Patterns
- Advanced Features
- Error Handling
- Best Practices

## Models and Pricing (November 2025)

### GPT-5 Family

| Model | Context | Input $/1M | Output $/1M | Best For |
|-------|---------|------------|-------------|----------|
| `gpt-5.1` | 272K | $1.25 | $10.00 | Frontier reasoning, complex tasks |
| `gpt-5-mini` | 272K | $0.25 | $2.00 | General tasks, balanced |
| `gpt-5-nano` | 272K | $0.05 | $0.40 | Simple extraction, high-volume |

### GPT-4.1 Family (Previous)

| Model | Context | Input $/1M | Output $/1M |
|-------|---------|------------|-------------|
| `gpt-4.1` | 1M | $3.00 | $10.00 |
| `gpt-4.1-mini` | 128K | $0.60 | $2.40 |

### Reasoning Models (o-series)

| Model | Best For | Pricing |
|-------|----------|---------|
| `o3` | Mathematical reasoning | Higher (reasoning tokens) |
| `o3-mini` | Lightweight reasoning | Lower |

## SDK Setup

```bash
npm install openai
```

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // sk-...
});
```

## Core Patterns

### Basic Completion

```typescript
async function generate(prompt: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [{ role: 'user', content: prompt }],
  });
  return completion.choices[0].message.content || '';
}
```

### With System Prompt

```typescript
async function generateWithSystem(
  system: string,
  user: string
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });
  return completion.choices[0].message.content || '';
}
```

### Streaming

```typescript
async function stream(
  prompt: string,
  onChunk: (text: string) => void
): Promise<void> {
  const stream = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) onChunk(content);
  }
}
```

### Advanced Streaming with Events

```typescript
const runner = openai.chat.completions
  .stream({
    model: 'gpt-5-mini',
    messages: [{ role: 'user', content: prompt }],
  })
  .on('connect', () => console.log('Connected'))
  .on('content', (delta) => process.stdout.write(delta))
  .on('error', (error) => console.error('Error:', error))
  .on('end', () => console.log('Done'));

const result = await runner.finalChatCompletion();
```

## Advanced Features

### Function/Tool Calling

```typescript
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'get_weather',
      description: 'Get weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City, State' },
          unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
        },
        required: ['location'],
      },
    },
  },
];

async function chatWithTools(message: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [{ role: 'user', content: message }],
    tools,
    tool_choice: 'auto',
  });

  const toolCall = response.choices[0].message.tool_calls?.[0];
  
  if (toolCall) {
    const args = JSON.parse(toolCall.function.arguments);
    const result = await executeFunction(toolCall.function.name, args);
    
    // Return result to model
    const finalResponse = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        { role: 'user', content: message },
        response.choices[0].message,
        { role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(result) },
      ],
    });
    
    return finalResponse.choices[0].message.content;
  }
  
  return response.choices[0].message.content;
}
```

### JSON Mode

```typescript
async function generateJSON<T>(prompt: string): Promise<T> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [
      { role: 'system', content: 'Respond with valid JSON only.' },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0].message.content || '{}');
}
```

### Structured Output with Zod

```typescript
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const ResponseSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  summary: z.string(),
});

async function extractStructured(text: string) {
  const completion = await openai.chat.completions.parse({
    model: 'gpt-5-mini',
    messages: [
      { role: 'system', content: 'Extract contact info.' },
      { role: 'user', content: text },
    ],
    response_format: zodResponseFormat(ResponseSchema, 'contact'),
  });

  return completion.choices[0].message.parsed;
}
```

### Vision/Image Analysis

```typescript
async function analyzeImage(imageUrl: string, question: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: question },
          { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
        ],
      },
    ],
  });

  return completion.choices[0].message.content || '';
}

// Base64 image
async function analyzeBase64(base64: string, question: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: question },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
        ],
      },
    ],
  });

  return completion.choices[0].message.content || '';
}
```

### Semantic Caching (90% Discount)

OpenAI automatically caches prompt prefixes for 1 hour:

```typescript
// First request - full price
await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [
    { role: 'system', content: longSystemPrompt }, // Will be cached
    { role: 'user', content: 'Question 1' },
  ],
});

// Subsequent requests within 1 hour - 90% discount on cached portion
await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [
    { role: 'system', content: longSystemPrompt }, // Cached!
    { role: 'user', content: 'Question 2' },
  ],
});
```

### Deterministic Output with Seed

```typescript
// For reproducible outputs
const response = await openai.chat.completions.create({
  model: 'gpt-5-mini',
  messages: [{ role: 'user', content: prompt }],
  temperature: 0.7,
  seed: 12345, // Same seed = same output
});
```

## Error Handling

### Error Types

```typescript
import { APIError, RateLimitError, APIConnectionError } from 'openai/error';

async function robustGenerate(prompt: string): Promise<string> {
  try {
    return await generate(prompt);
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.error('Rate limit hit');
      await new Promise(r => setTimeout(r, 60000));
      return robustGenerate(prompt);
    }
    
    if (error instanceof APIConnectionError) {
      console.error('Connection error:', error.message);
      throw new Error('Failed to connect to OpenAI');
    }
    
    if (error instanceof APIError) {
      console.error('API Error:', error.status, error.message);
      throw error;
    }
    
    throw error;
  }
}
```

### Rate Limit Headers

```typescript
const response = await openai.chat.completions.create({...});

// Access rate limit info
console.log('Remaining:', response.headers?.['x-ratelimit-remaining-requests']);
console.log('Reset:', response.headers?.['x-ratelimit-reset-requests']);
```

## Rate Limits by Tier

| Tier | Spend | RPM | TPM |
|------|-------|-----|-----|
| 1 | $0 | 500 | 200K |
| 2 | $50+ | 5K | 2M |
| 3 | $100+ | 10K | 10M |
| 4 | $250+ | 30K | 40M |
| 5 | $1K+ | 100K | 400M |

Tiers auto-upgrade based on spending history.

## Best Practices

### Model Selection

```typescript
function selectModel(task: string): string {
  const mapping: Record<string, string> = {
    'simple': 'gpt-5-nano',      // Cheapest
    'general': 'gpt-5-mini',     // Balanced
    'complex': 'gpt-5',          // Best quality
    'reasoning': 'o3-mini',      // Step-by-step
  };
  return mapping[task] || 'gpt-5-mini';
}
```

### Cost Tracking

```typescript
class OpenAITracker {
  private metrics = { requests: 0, inputTokens: 0, outputTokens: 0, cost: 0 };

  async generate(prompt: string): Promise<string> {
    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    // Track usage
    this.metrics.requests++;
    this.metrics.inputTokens += response.usage?.prompt_tokens || 0;
    this.metrics.outputTokens += response.usage?.completion_tokens || 0;
    
    // Cost: $0.25/$2.00 per 1M for gpt-5-mini
    this.metrics.cost =
      (this.metrics.inputTokens * 0.25 + this.metrics.outputTokens * 2.00) / 1000000;

    return response.choices[0].message.content || '';
  }

  getMetrics() { return { ...this.metrics }; }
}
```

## Resources

- [API Docs](https://platform.openai.com/docs/)
- [Pricing](https://openai.com/api/pricing/)
- [Cookbook](https://cookbook.openai.com/)
- [Best Practices](https://platform.openai.com/docs/guides/best-practices)
