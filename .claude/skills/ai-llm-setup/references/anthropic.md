# Anthropic Claude API Reference

> **AppDistillery Note**: For normal AI operations, use `brainHandle()` from Core.
> These patterns are for reference when extending brainHandle(), implementing
> streaming UI, or using Claude-specific features like prompt caching.

## Contents
- Models and Pricing
- SDK Setup
- Core Patterns
- Advanced Features
- Prompt Caching
- Error Handling
- Best Practices

## Models and Pricing (November 2025)

### Claude 4 Family

| Model | Context | Input $/1M | Output $/1M | Best For |
|-------|---------|------------|-------------|----------|
| `claude-opus-4-1` | 200K | $15.00 | $75.00 | Complex reasoning, high-stakes |
| `claude-sonnet-4-5` | 200K (1M beta) | $3.00 | $15.00 | Best coding, agentic tasks |
| `claude-haiku-4-5` | 200K | $1.00 | $5.00 | Fast, cost-effective |

### Model Selection Guide

- **claude-haiku-4-5**: Default choice. 4-5x faster than Sonnet, excellent instruction-following
- **claude-sonnet-4-5**: Upgrade for complex tasks. #1 on SWE-bench Verified
- **claude-opus-4-1**: Reserve for highest stakes, complex reasoning

## SDK Setup

```bash
npm install @anthropic-ai/sdk
```

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // sk-ant-...
});
```

## Core Patterns

### Basic Message

```typescript
async function generate(prompt: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}
```

### With System Prompt

```typescript
async function generateWithSystem(
  system: string,
  user: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 2048,
    system: system,
    messages: [{ role: 'user', content: user }],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}
```

### Streaming

```typescript
async function stream(
  prompt: string,
  onChunk: (text: string) => void
): Promise<void> {
  const stream = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      onChunk(event.delta.text);
    }
  }
}
```

### Streaming with Helpers

```typescript
const stream = anthropic.messages
  .stream({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })
  .on('text', (text) => process.stdout.write(text))
  .on('error', (error) => console.error('Error:', error));

const message = await stream.finalMessage();
```

## Advanced Features

### Tool Use / Function Calling

```typescript
const tools = [
  {
    name: 'get_weather',
    description: 'Get weather for a location',
    input_schema: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City, State' },
        unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
      },
      required: ['location'],
    },
  },
];

async function chatWithTools(message: string): Promise<string> {
  let messages = [{ role: 'user' as const, content: message }];

  while (true) {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      tools,
      messages,
    });

    const toolUse = response.content.find(b => b.type === 'tool_use');
    
    if (!toolUse || toolUse.type !== 'tool_use') {
      const textBlock = response.content.find(b => b.type === 'text');
      return textBlock?.type === 'text' ? textBlock.text : '';
    }

    // Execute tool
    const result = await executeFunction(toolUse.name, toolUse.input);

    // Add to conversation
    messages.push({ role: 'assistant', content: response.content });
    messages.push({
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(result) }],
    });
  }
}
```

### Vision / Image Analysis

```typescript
async function analyzeImage(imageUrl: string, question: string): Promise<string> {
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64 = Buffer.from(imageBuffer).toString('base64');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
          { type: 'text', text: question },
        ],
      },
    ],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}
```

### Prompt Caching (90% Savings)

Mark content for caching to save on repeated system prompts:

```typescript
// First request - full price, writes to cache
const response1 = await anthropic.messages.create({
  model: 'claude-sonnet-4-5',
  max_tokens: 1024,
  system: [
    {
      type: 'text',
      text: longSystemPrompt,
      cache_control: { type: 'ephemeral' }, // Mark for caching
    },
  ],
  messages: [{ role: 'user', content: 'Question 1' }],
});

// Subsequent requests within 5 minutes - 90% discount
const response2 = await anthropic.messages.create({
  model: 'claude-sonnet-4-5',
  max_tokens: 1024,
  system: [
    {
      type: 'text',
      text: longSystemPrompt, // Same content - cached!
      cache_control: { type: 'ephemeral' },
    },
  ],
  messages: [{ role: 'user', content: 'Question 2' }],
});

// Check cache usage
console.log('Cache write:', response1.usage.cache_creation_input_tokens);
console.log('Cache read:', response2.usage.cache_read_input_tokens);
```

**Cache Pricing:**
- Write: Normal input token cost
- Read: 10% of input token cost (90% savings)
- Duration: 5 minutes

### Extended Thinking

For complex reasoning tasks:

```typescript
async function reasoningTask(problem: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 16000,
    thinking: {
      type: 'enabled',
      budget_tokens: 10000, // Tokens for thinking
    },
    messages: [{ role: 'user', content: `Solve step by step: ${problem}` }],
  });

  // Get thinking and final answer
  const thinking = response.content.find(b => b.type === 'thinking');
  const text = response.content.find(b => b.type === 'text');

  return text?.type === 'text' ? text.text : '';
}
```

## Error Handling

### Error Types

```typescript
import { APIError, RateLimitError, APIConnectionError } from '@anthropic-ai/sdk';

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
      throw new Error('Failed to connect to Anthropic');
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
const message = await anthropic.messages.create({...});

// Check headers
console.log('Remaining:', message.response?.headers['anthropic-ratelimit-requests-remaining']);
console.log('Reset:', message.response?.headers['anthropic-ratelimit-requests-reset']);
```

## Rate Limits by Tier

| Tier | Spend | RPM | TPM |
|------|-------|-----|-----|
| 1 | $0 | 5 | 20K |
| 2 | $50 | 50 | 100K |
| 3 | $1K | 200 | 500K |
| 4 | $5K | 400 | 1M |

## Best Practices

### Prompt Engineering

Claude responds well to XML-structured prompts:

```typescript
const structuredPrompt = `
<task>
Extract contact information from the text below.
</task>

<requirements>
- Extract name, email, phone
- Validate email format
- Return as JSON
</requirements>

<text>
${inputText}
</text>

<output_format>
{
  "name": "...",
  "email": "...",
  "phone": "..."
}
</output_format>
`;
```

### Cost Tracking with Cache

```typescript
class ClaudeTracker {
  private metrics = {
    requests: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheWrites: 0,
    cacheReads: 0,
    cost: 0,
  };

  async generate(prompt: string, useCache = false): Promise<string> {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: useCache ? [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }] : undefined,
      messages: [{ role: 'user', content: prompt }],
    });

    this.metrics.requests++;
    this.metrics.inputTokens += message.usage.input_tokens;
    this.metrics.outputTokens += message.usage.output_tokens;
    this.metrics.cacheWrites += message.usage.cache_creation_input_tokens || 0;
    this.metrics.cacheReads += message.usage.cache_read_input_tokens || 0;

    // Haiku pricing: $1/$5 per 1M, cache: 125% write, 10% read
    this.metrics.cost = 
      (this.metrics.inputTokens * 1.00 + this.metrics.outputTokens * 5.00 +
       this.metrics.cacheWrites * 1.25 + this.metrics.cacheReads * 0.10) / 1000000;

    return message.content[0].type === 'text' ? message.content[0].text : '';
  }

  getMetrics() { return { ...this.metrics }; }
}
```

### Model Selection

```typescript
function selectClaudeModel(task: string): string {
  const mapping: Record<string, string> = {
    'extraction': 'claude-haiku-4-5',
    'generation': 'claude-haiku-4-5',
    'coding': 'claude-sonnet-4-5',
    'analysis': 'claude-sonnet-4-5',
    'high-stakes': 'claude-opus-4-1',
  };
  return mapping[task] || 'claude-haiku-4-5';
}
```

## Claude vs OpenAI

### Claude Strengths
- Better instruction following
- Superior coding (Sonnet 4.5)
- Better with long documents
- Manual prompt caching (90% savings)
- More thoughtful responses

### When to Use Claude
- Proposal generation (instruction following)
- Code generation (Sonnet excels)
- Email composition (professional tone)
- Structured output tasks

### When to Use OpenAI
- Simple extraction (GPT-5-nano is cheaper)
- High-volume operations (better rate limits)
- Real-time applications (lower latency)

## Resources

- [API Docs](https://docs.anthropic.com/)
- [Pricing](https://docs.anthropic.com/en/docs/about-claude/models/overview)
- [Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering)
- [Tool Use Guide](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
- [Cookbook](https://github.com/anthropics/anthropic-cookbook)
