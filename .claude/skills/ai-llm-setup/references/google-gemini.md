# Google Gemini API Reference

> **AppDistillery Note**: For normal AI operations, use `brainHandle()` from Core.
> These patterns are for reference when extending brainHandle() with Gemini support,
> implementing multimodal features, or using Google Search grounding.

## Contents
- Models and Pricing
- SDK Setup
- Core Patterns
- Advanced Features
- Error Handling
- Best Practices

## Models and Pricing (November 2025)

### Gemini 3 Family (Latest)

| Model | Context | Input $/1M | Output $/1M | Best For |
|-------|---------|------------|-------------|----------|
| `gemini-3-pro-preview` | 200K+ | $2.00 | $12.00 | High-level reasoning |
| `gemini-3-pro-image-preview` | - | Varies | - | **Image generation** ("nano banana") |

### Gemini 2.5 Family

| Model | Context | Input $/1M | Output $/1M | Best For |
|-------|---------|------------|-------------|----------|
| `gemini-2.5-pro` | 1M (2M exp) | $1.25-2.50 | $10-15 | Complex reasoning |
| `gemini-2.5-flash` | 1M | $0.30 | $2.50 | Balanced, agentic |
| `gemini-2.5-flash-lite` | 1M | $0.10 | $0.40 | Cheapest text model |

### Key Advantages

**Gemini 2.5 Flash** is excellent for general tasks:
- 1M token context window
- Good balance of speed and quality
- Strong agentic capabilities

**Gemini 3 Pro Image Preview** ("nano banana") is the preferred image generation model

## SDK Setup

```bash
npm install @google/generative-ai
```

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
```

## Core Patterns

### Basic Generation

```typescript
async function generate(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

### With Configuration

```typescript
async function generateWithConfig(
  system: string,
  prompt: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: system,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 2048,
    },
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

### Streaming

```typescript
async function stream(
  prompt: string,
  onChunk: (text: string) => void
): Promise<void> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  const result = await model.generateContentStream(prompt);

  for await (const chunk of result.stream) {
    onChunk(chunk.text());
  }
}
```

### Multi-turn Chat

```typescript
async function chat(messages: Array<{role: string; content: string}>) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  const chat = model.startChat({
    history: messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    })),
  });

  const last = messages[messages.length - 1];
  const result = await chat.sendMessage(last.content);
  return result.response.text();
}
```

## Advanced Features

### Vision / Multimodal

```typescript
import { readFileSync } from 'fs';

async function analyzeImage(imagePath: string, prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const imageData = readFileSync(imagePath);
  const base64 = imageData.toString('base64');

  const result = await model.generateContent([
    { text: prompt },
    { inlineData: { mimeType: 'image/jpeg', data: base64 } },
  ]);

  return result.response.text();
}

// From URL
async function analyzeImageUrl(url: string, prompt: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent([
    { text: prompt },
    { inlineData: { mimeType: response.headers.get('content-type') || 'image/jpeg', data: base64 } },
  ]);

  return result.response.text();
}
```

### Function Calling

```typescript
const weatherFunction = {
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
};

async function chatWithFunctions(message: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    tools: [{ functionDeclarations: [weatherFunction] }],
  });

  const chat = model.startChat();
  let result = await chat.sendMessage(message);

  const functionCall = result.response.functionCalls()?.[0];
  
  if (functionCall) {
    const data = await executeFunction(functionCall.name, functionCall.args);
    result = await chat.sendMessage([
      { functionResponse: { name: functionCall.name, response: data } },
    ]);
  }

  return result.response.text();
}
```

### JSON Mode (Structured Output)

```typescript
interface Contact {
  name: string;
  email: string;
  phone?: string;
}

async function extractJSON(text: string): Promise<Contact> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
        },
        required: ['name', 'email'],
      },
    },
  });

  const result = await model.generateContent(`Extract contact info from: ${text}`);
  return JSON.parse(result.response.text());
}
```

### Grounding with Google Search

```typescript
async function searchGrounded(query: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    tools: [{ googleSearchRetrieval: {} }],
  });

  const result = await model.generateContent(query);
  
  // Access grounding metadata
  const metadata = result.response.candidates?.[0]?.groundingMetadata;
  
  return result.response.text();
}

// Pricing: First 1,500 prompts/day free, then $35/1000 grounded prompts
```

### Thinking Mode

```typescript
async function reasoning(problem: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      thinkingConfig: {
        thinkingBudget: 10000, // Tokens for reasoning
      },
    },
  });

  const result = await model.generateContent(`Solve step by step: ${problem}`);
  return result.response.text();
}
```

## Error Handling

```typescript
import { GoogleGenerativeAIError } from '@google/generative-ai';

async function robustGenerate(prompt: string): Promise<string> {
  try {
    return await generate(prompt);
  } catch (error) {
    if (error instanceof GoogleGenerativeAIError) {
      console.error('Google AI Error:', error.message);
      
      if (error.message.includes('quota')) {
        throw new Error('Rate limit exceeded');
      }
      if (error.message.includes('invalid')) {
        throw new Error('Invalid API key or request');
      }
    }
    throw error;
  }
}
```

## Rate Limits

### Free Tier
- 15 RPM (requests per minute)
- 1M TPM (tokens per minute)
- 1,500 RPD (requests per day)

### Paid Tier
- 360 RPM
- 4M TPM

### Check Usage

```typescript
const result = await model.generateContent(prompt);

console.log('Prompt tokens:', result.response.usageMetadata?.promptTokenCount);
console.log('Output tokens:', result.response.usageMetadata?.candidatesTokenCount);
console.log('Total:', result.response.usageMetadata?.totalTokenCount);
```

## Safety Settings

```typescript
import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ],
});
```

## Best Practices

### Model Selection

```typescript
function selectGeminiModel(task: string): string {
  const mapping: Record<string, string> = {
    'extraction': 'gemini-2.5-flash-lite',      // Cheapest
    'generation': 'gemini-2.5-flash',           // Balanced
    'quality': 'gemini-2.5-flash',              // Good quality
    'reasoning': 'gemini-3-pro-preview',        // High-level tasks
    'image': 'gemini-3-pro-image-preview',      // Image generation
  };
  return mapping[task] || 'gemini-2.5-flash';
}
```

### Cost Tracking

```typescript
class GeminiTracker {
  private metrics = { requests: 0, inputTokens: 0, outputTokens: 0, cost: 0 };

  async generate(prompt: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const result = await model.generateContent(prompt);
    const usage = result.response.usageMetadata;

    if (usage) {
      this.metrics.requests++;
      this.metrics.inputTokens += usage.promptTokenCount || 0;
      this.metrics.outputTokens += usage.candidatesTokenCount || 0;

      // Flash-Lite: $0.10/$0.40 per 1M
      this.metrics.cost = 
        (this.metrics.inputTokens * 0.10 + this.metrics.outputTokens * 0.40) / 1000000;
    }

    return result.response.text();
  }

  getMetrics() { return { ...this.metrics }; }
}
```

### Retry with Backoff

```typescript
async function generateWithRetry(prompt: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      return await generate(prompt);
    } catch (error) {
      if (i === retries - 1) throw error;
      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Should not reach');
}
```

## Gemini vs Competitors

### Advantages
- **Lowest cost** - Flash-Lite at $0.10/$0.40 per 1M
- **Largest context** - 1M-2M tokens standard
- **Native multimodal** - Text, image, video, audio
- **Google Search grounding** - Real-time web data
- **Fast iteration** - Frequent model updates

### Disadvantages
- Less established ecosystem
- Sometimes less precise instruction following
- API pricing changes (Flash thinking mode changed June 2025)

### When to Use Gemini
- Cost-sensitive applications
- High-volume operations
- Multimodal (video/audio)
- Long documents (1M+ context)
- Real-time data (Search grounding)

### When to Use Alternatives
- Critical instruction following → Claude Haiku
- Complex coding → Claude Sonnet
- Established patterns → OpenAI

## Use Case Recommendations

| Task | Model | Why |
|------|-------|-----|
| Lead extraction | Flash-Lite | Cheapest, good enough |
| Proposal generation | Flash-Lite | Cost-effective |
| Invoice creation | Flash-Lite | Fast, cheap |
| Email composition | Flash | Better quality |
| Complex analysis | Pro | Best reasoning |

## Resources

- [API Quickstart](https://ai.google.dev/gemini-api/docs/quickstart)
- [Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Model Tuning](https://ai.google.dev/gemini-api/docs/model-tuning)
- [Cookbook](https://github.com/google-gemini/cookbook)
