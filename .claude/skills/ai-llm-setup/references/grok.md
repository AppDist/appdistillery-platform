# Grok (X.AI) API Reference

> **AppDistillery Note**: For normal AI operations, use `brainHandle()` from Core.
> These patterns are for reference when extending brainHandle() with Grok support,
> or for edge cases requiring direct X/Twitter data integration.

## Models and Pricing (November 2025)

### Grok 4 Family

| Model | Context | Input $/1M | Output $/1M | Best For |
|-------|---------|------------|-------------|----------|
| `grok-4.1` | **2M** | $0.20 | $0.50 | Best value, low hallucination |
| `grok-4.1-fast` | **2M** | $0.20-0.40 | $0.50-1.00 | Agentic, tool calling |
| `grok-4` | 256K | $3.00 | $15.00 | Complex reasoning (legacy) |

### Grok 4.1 Highlights

- **2M context window** - 8x larger than GPT-5.1
- **3x lower hallucination** rate than previous versions
- **84% cheaper** than GPT-5.1 on input pricing
- **Best tool-calling model** from xAI (grok-4.1-fast)

### Cache Pricing

| Type | Cost per 1M |
|------|-------------|
| Cached input | $0.05 |
| Standard input | $0.20 |
| Output | $0.50 |

## SDK Setup

Grok uses OpenAI-compatible API:

```bash
npm install openai
```

```typescript
import OpenAI from 'openai';

const grok = new OpenAI({
  apiKey: process.env.GROK_API_KEY, // xai-...
  baseURL: 'https://api.x.ai/v1',
});
```

## Core Patterns

### Basic Generation

```typescript
async function generate(prompt: string): Promise<string> {
  const completion = await grok.chat.completions.create({
    model: 'grok-4.1',  // Best value model
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
  const completion = await grok.chat.completions.create({
    model: 'grok-4.1',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.7,
    max_tokens: 4000,
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
  const stream = await grok.chat.completions.create({
    model: 'grok-4.1',
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) onChunk(content);
  }
}
```

## Advanced Features

### Tool Calling (grok-4.1-fast)

grok-4.1-fast is xAI's best tool-calling model:

```typescript
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'search_x',
      description: 'Search X (Twitter) for recent posts',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          limit: { type: 'number', description: 'Max results' },
        },
        required: ['query'],
      },
    },
  },
];

async function agentWithTools(message: string): Promise<string> {
  const completion = await grok.chat.completions.create({
    model: 'grok-4.1-fast',  // Best for tool calling
    messages: [{ role: 'user', content: message }],
    tools,
    tool_choice: 'auto',
  });

  const toolCall = completion.choices[0].message.tool_calls?.[0];

  if (toolCall) {
    const args = JSON.parse(toolCall.function.arguments);
    const result = await executeFunction(toolCall.function.name, args);

    const finalResponse = await grok.chat.completions.create({
      model: 'grok-4.1-fast',
      messages: [
        { role: 'user', content: message },
        completion.choices[0].message,
        { role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(result) },
      ],
    });

    return finalResponse.choices[0].message.content || '';
  }

  return completion.choices[0].message.content || '';
}
```

**Tool Pricing**: $5 per 1,000 successful invocations (free through Dec 3, 2025)

### Real-Time X (Twitter) Data

Grok's unique feature - access to live X data:

```typescript
async function analyzeXTrends(topic: string): Promise<string> {
  const completion = await grok.chat.completions.create({
    model: 'grok-4.1',
    messages: [
      {
        role: 'system',
        content: 'You have access to real-time X (Twitter) data. Analyze current trends and sentiment.',
      },
      {
        role: 'user',
        content: `What are people saying about ${topic} on X right now?`,
      },
    ],
  });

  return completion.choices[0].message.content || '';
}
```

### Vision

```typescript
async function analyzeImage(
  imageUrl: string,
  question: string
): Promise<string> {
  const completion = await grok.chat.completions.create({
    model: 'grok-4.1',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: question },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
  });

  return completion.choices[0].message.content || '';
}
```

## Error Handling

```typescript
async function robustGenerate(prompt: string): Promise<string> {
  try {
    return await generate(prompt);
  } catch (error: any) {
    if (error.status === 429) {
      console.error('Rate limit exceeded');
      await new Promise(r => setTimeout(r, 60000));
      return robustGenerate(prompt);
    }

    if (error.status === 401) {
      throw new Error('Invalid Grok API key');
    }

    if (error.status >= 500) {
      console.error('Server error, retrying...');
      await new Promise(r => setTimeout(r, 5000));
      return robustGenerate(prompt);
    }

    throw error;
  }
}
```

## When to Use Grok

### Use Grok For:
- X/Twitter data integration and sentiment analysis
- Real-time social media context
- Trend analysis and current events
- Large context needs (2M tokens!)
- Cost-effective general tasks (grok-4.1)
- Agentic workflows with tool calling (grok-4.1-fast)

### Don't Use Grok For:
- Tasks requiring proven reliability (newer platform)
- When you need established SDK ecosystem
- Strict content moderation requirements

## Cost Comparison (November 2025)

| Model | Input $/1M | Output $/1M | Context |
|-------|------------|-------------|---------|
| `grok-4.1` | $0.20 | $0.50 | 2M |
| `gpt-5-mini` | $0.25 | $2.00 | 272K |
| `claude-haiku-4-5` | $1.00 | $5.00 | 200K |
| `gemini-2.5-flash` | $0.30 | $2.50 | 1M |

**Grok 4.1 is now price-competitive** while offering the largest context window.

## Model Selection

```typescript
function selectGrokModel(task: string): string {
  const mapping: Record<string, string> = {
    'simple': 'grok-4.1',
    'standard': 'grok-4.1',
    'agentic': 'grok-4.1-fast',
    'realtime': 'grok-4.1',
    'legacy-complex': 'grok-4',  // Only if needed
  };
  return mapping[task] || 'grok-4.1';
}
```

## Resources

- [API Console](https://console.x.ai/)
- [Documentation](https://docs.x.ai/docs/models)
- [X.AI Blog](https://x.ai/news/)
- [OpenRouter (alternative access)](https://openrouter.ai/x-ai/grok-4.1)

## Summary

**Grok 4.1 is now highly competitive**:
- 2M context (largest available)
- $0.20/$0.50 pricing (very competitive)
- 3x lower hallucination rate
- Best for X/Twitter integration
- Strong tool-calling with grok-4.1-fast
