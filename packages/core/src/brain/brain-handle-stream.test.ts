import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { brainHandleStream } from './brain-handle-stream';

// Mock dependencies
vi.mock('ai', () => ({
  streamObject: vi.fn(),
}));

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => (model: string) => ({ model })),
}));

vi.mock('../ledger', () => ({
  recordUsage: vi.fn(),
}));

// Import mocked functions
import { streamObject } from 'ai';
import { recordUsage } from '../ledger';

// Test schema
const TestSchema = z.object({
  title: z.string(),
  count: z.number(),
});

type TestOutput = z.infer<typeof TestSchema>;

describe('brainHandleStream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: recordUsage returns success
    vi.mocked(recordUsage).mockResolvedValue({
      success: true,
      data: {
        id: 'event-123',
        action: 'test:action:generate',
        tenantId: null,
        userId: null,
        moduleId: 'test',
        tokensInput: 0,
        tokensOutput: 0,
        tokensTotal: 0,
        units: 0,
        durationMs: 100,
        metadata: {},
        createdAt: new Date().toISOString(),
      },
    });

    // Mock ANTHROPIC_API_KEY
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  describe('Success path', () => {
    it('returns success result with stream when streaming succeeds', async () => {
      const mockPartials = [
        { title: 'T', count: 0 },
        { title: 'Test', count: 42 },
      ];
      const mockFinal: TestOutput = { title: 'Test Title', count: 42 };

      // Create async iterator for partialObjectStream
      async function* mockPartialStream() {
        for (const partial of mockPartials) {
          yield partial;
        }
      }

      vi.mocked(streamObject).mockReturnValue({
        partialObjectStream: mockPartialStream(),
        object: Promise.resolve(mockFinal),
        usage: Promise.resolve({
          inputTokens: 100,
          outputTokens: 200,
          totalTokens: 300,
        }),
      } as any);

      const result = await brainHandleStream({
        tenantId: 'tenant-123',
        userId: 'user-456',
        moduleId: 'agency',
        taskType: 'agency.scope',
        systemPrompt: 'You are a helpful assistant',
        userPrompt: 'Generate something',
        schema: TestSchema,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      // Collect chunks from stream
      const chunks = [];
      for await (const chunk of result.stream) {
        chunks.push(chunk);
      }

      // Should have partial chunks + final chunk
      expect(chunks.length).toBeGreaterThan(0);

      // Last chunk should be marked as done
      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk?.done).toBe(true);
      expect(lastChunk?.partial).toEqual(mockFinal);
    });

    it('calls streamObject with correct parameters', async () => {
      async function* mockPartialStream() {
        yield { title: 'Test', count: 42 };
      }

      vi.mocked(streamObject).mockReturnValue({
        partialObjectStream: mockPartialStream(),
        object: Promise.resolve({ title: 'Test', count: 42 }),
        usage: Promise.resolve({
          inputTokens: 100,
          outputTokens: 200,
          totalTokens: 300,
        }),
      } as any);

      const result = await brainHandleStream({
        tenantId: 'tenant-123',
        userId: 'user-456',
        moduleId: 'agency',
        taskType: 'agency.scope',
        systemPrompt: 'System prompt here',
        userPrompt: 'User prompt here',
        schema: TestSchema,
      });

      expect(result.success).toBe(true);

      expect(streamObject).toHaveBeenCalledWith(
        expect.objectContaining({
          schema: TestSchema,
          prompt: 'User prompt here',
          system: 'System prompt here',
        })
      );
    });

    it('records usage after stream completes', async () => {
      const mockFinal: TestOutput = { title: 'Test', count: 42 };

      async function* mockPartialStream() {
        yield { title: 'T', count: 0 };
      }

      vi.mocked(streamObject).mockReturnValue({
        partialObjectStream: mockPartialStream(),
        object: Promise.resolve(mockFinal),
        usage: Promise.resolve({
          inputTokens: 150,
          outputTokens: 250,
          totalTokens: 400,
        }),
      } as any);

      const result = await brainHandleStream({
        tenantId: 'tenant-123',
        userId: 'user-456',
        moduleId: 'agency',
        taskType: 'agency.scope',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      // Consume entire stream to trigger usage recording
      const chunks = [];
      for await (const chunk of result.stream) {
        chunks.push(chunk);
      }

      expect(recordUsage).toHaveBeenCalledWith({
        action: 'agency:scope:generate',
        tenantId: 'tenant-123',
        userId: 'user-456',
        moduleId: 'agency',
        tokensInput: 150,
        tokensOutput: 250,
        units: 50, // Known task type
        durationMs: expect.any(Number),
        metadata: { task: 'agency.scope' },
      });
    });
  });

  describe('Validation failures', () => {
    it('returns failure for invalid taskType format', async () => {
      const result = await brainHandleStream({
        moduleId: 'agency',
        taskType: 'invalid',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error).toContain('Invalid taskType format');
      expect(result.error).toContain('invalid');

      // Should not call streamObject
      expect(streamObject).not.toHaveBeenCalled();
    });

    it('returns failure when ANTHROPIC_API_KEY is missing', async () => {
      delete process.env.ANTHROPIC_API_KEY;

      const result = await brainHandleStream({
        moduleId: 'agency',
        taskType: 'agency.scope',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error).toContain('ANTHROPIC_API_KEY');

      // Restore for other tests
      process.env.ANTHROPIC_API_KEY = 'test-api-key';
    });
  });

  describe('Stream error handling', () => {
    it('records failed usage when stream throws error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      async function* mockPartialStream() {
        yield { title: 'T', count: 0 };
        throw new Error('Stream error');
      }

      vi.mocked(streamObject).mockReturnValue({
        partialObjectStream: mockPartialStream(),
        object: Promise.resolve({ title: 'Test', count: 42 }),
        usage: Promise.resolve({
          promptTokens: 100,
          completionTokens: 200,
          totalTokens: 300,
        }),
      } as any);

      const result = await brainHandleStream({
        tenantId: 'tenant-123',
        userId: 'user-456',
        moduleId: 'agency',
        taskType: 'agency.scope',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      // Consuming stream should throw error
      await expect(async () => {
        for await (const _chunk of result.stream) {
          // Iterate until error
        }
      }).rejects.toThrow('Stream error');

      // Should record failed usage
      expect(recordUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          units: 0,
          metadata: expect.objectContaining({
            failed: true,
            error: 'Stream error',
          }),
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Rate limiting', () => {
    it('checks rate limit before starting stream', async () => {
      async function* mockPartialStream() {
        yield { title: 'Test', count: 1 };
      }

      vi.mocked(streamObject).mockReturnValue({
        partialObjectStream: mockPartialStream(),
        object: Promise.resolve({ title: 'Test', count: 1 }),
        usage: Promise.resolve({
          inputTokens: 10,
          outputTokens: 20,
          totalTokens: 30,
        }),
      } as any);

      const result1 = await brainHandleStream({
        tenantId: 'rate-limit-test-tenant',
        moduleId: 'test',
        taskType: 'test.task',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      const result2 = await brainHandleStream({
        tenantId: 'rate-limit-test-tenant',
        moduleId: 'test',
        taskType: 'test.task',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      // Both should succeed (under default limit)
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });
});
