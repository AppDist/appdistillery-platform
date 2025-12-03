import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sleep,
  isRetryableError,
  extractUsage,
  sanitizeErrorMessage,
  withRetry,
  DEFAULT_RETRY_CONFIG,
  type StandardUsage,
} from './shared';

describe('Shared Adapter Utilities', () => {
  describe('sleep', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('resolves after the specified delay', async () => {
      const promise = sleep(1000);
      let resolved = false;

      promise.then(() => {
        resolved = true;
      });

      // Should not resolve immediately
      expect(resolved).toBe(false);

      // Fast-forward time
      await vi.advanceTimersByTimeAsync(1000);

      // Should resolve after the delay
      expect(resolved).toBe(true);
    });

    it('resolves after different delays', async () => {
      const delays = [100, 500, 2000];
      const results: boolean[] = [];

      const promises = delays.map((delay) =>
        sleep(delay).then(() => results.push(true))
      );

      // Fast-forward to each delay
      await vi.advanceTimersByTimeAsync(100);
      expect(results.length).toBe(1);

      await vi.advanceTimersByTimeAsync(400);
      expect(results.length).toBe(2);

      await vi.advanceTimersByTimeAsync(1500);
      expect(results.length).toBe(3);

      await Promise.all(promises);
    });

    it('resolves immediately with 0ms delay', async () => {
      const promise = sleep(0);
      await vi.advanceTimersByTimeAsync(0);
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('isRetryableError', () => {
    describe('status code detection', () => {
      it('returns true for status 429', () => {
        const error = Object.assign(new Error('Too many requests'), { status: 429 });
        expect(isRetryableError(error)).toBe(true);
      });

      it('returns true for status 502', () => {
        const error = Object.assign(new Error('Bad gateway'), { status: 502 });
        expect(isRetryableError(error)).toBe(true);
      });

      it('returns true for status 503', () => {
        const error = Object.assign(new Error('Service unavailable'), { status: 503 });
        expect(isRetryableError(error)).toBe(true);
      });

      it('returns true for status 504', () => {
        const error = Object.assign(new Error('Gateway timeout'), { status: 504 });
        expect(isRetryableError(error)).toBe(true);
      });

      it('returns false for status 400', () => {
        const error = Object.assign(new Error('Bad request'), { status: 400 });
        expect(isRetryableError(error)).toBe(false);
      });

      it('returns false for status 401', () => {
        const error = Object.assign(new Error('Unauthorized'), { status: 401 });
        expect(isRetryableError(error)).toBe(false);
      });

      it('returns false for status 404', () => {
        const error = Object.assign(new Error('Not found'), { status: 404 });
        expect(isRetryableError(error)).toBe(false);
      });

      it('returns false for status 500', () => {
        const error = Object.assign(new Error('Internal server error'), { status: 500 });
        expect(isRetryableError(error)).toBe(false);
      });
    });

    describe('message detection', () => {
      it('returns true for "rate limit" in message', () => {
        expect(isRetryableError(new Error('rate limit exceeded'))).toBe(true);
        expect(isRetryableError(new Error('RATE LIMIT EXCEEDED'))).toBe(true);
        expect(isRetryableError(new Error('Rate Limit Error'))).toBe(true);
      });

      it('returns true for "timeout" in message', () => {
        expect(isRetryableError(new Error('request timeout'))).toBe(true);
        expect(isRetryableError(new Error('TIMEOUT ERROR'))).toBe(true);
        expect(isRetryableError(new Error('Connection Timeout'))).toBe(true);
      });

      it('returns true for "temporarily unavailable" in message', () => {
        expect(isRetryableError(new Error('service temporarily unavailable'))).toBe(true);
        expect(isRetryableError(new Error('TEMPORARILY UNAVAILABLE'))).toBe(true);
        expect(isRetryableError(new Error('Temporarily Unavailable'))).toBe(true);
      });

      it('returns false for non-retryable error messages', () => {
        expect(isRetryableError(new Error('Invalid input'))).toBe(false);
        expect(isRetryableError(new Error('Unauthorized access'))).toBe(false);
        expect(isRetryableError(new Error('Schema validation failed'))).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('returns false for non-Error objects', () => {
        expect(isRetryableError('string error')).toBe(false);
        expect(isRetryableError(null)).toBe(false);
        expect(isRetryableError(undefined)).toBe(false);
        expect(isRetryableError(123)).toBe(false);
        expect(isRetryableError({})).toBe(false);
      });

      it('checks status code first, then message', () => {
        // Status 400 with "rate limit" message should not be retryable
        const error = Object.assign(new Error('rate limit exceeded'), { status: 400 });
        expect(isRetryableError(error)).toBe(true); // Message match wins

        // Status 429 overrides non-retryable message
        const error429 = Object.assign(new Error('Invalid input'), { status: 429 });
        expect(isRetryableError(error429)).toBe(true);
      });

      it('falls back to message when no status code', () => {
        const error = new Error('rate limit exceeded');
        expect(isRetryableError(error)).toBe(true);
      });
    });
  });

  describe('extractUsage', () => {
    describe('v5 SDK format (inputTokens/outputTokens)', () => {
      it('extracts usage from v5 format', () => {
        const usage = {
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150,
        };

        const result = extractUsage(usage);

        expect(result).toEqual({
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
        });
      });

      it('calculates totalTokens when not provided in v5 format', () => {
        const usage = {
          inputTokens: 75,
          outputTokens: 25,
        };

        const result = extractUsage(usage);

        expect(result).toEqual({
          promptTokens: 75,
          completionTokens: 25,
          totalTokens: 100,
        });
      });
    });

    describe('v4 SDK format (promptTokens/completionTokens)', () => {
      it('extracts usage from v4 format', () => {
        const usage = {
          promptTokens: 200,
          completionTokens: 100,
          totalTokens: 300,
        };

        const result = extractUsage(usage);

        expect(result).toEqual({
          promptTokens: 200,
          completionTokens: 100,
          totalTokens: 300,
        });
      });

      it('calculates totalTokens when not provided in v4 format', () => {
        const usage = {
          promptTokens: 150,
          completionTokens: 50,
        };

        const result = extractUsage(usage);

        expect(result).toEqual({
          promptTokens: 150,
          completionTokens: 50,
          totalTokens: 200,
        });
      });
    });

    describe('edge cases', () => {
      it('returns zeros for undefined usage', () => {
        const result = extractUsage(undefined);

        expect(result).toEqual({
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        });
      });

      it('returns zeros for null usage', () => {
        const result = extractUsage(null);

        expect(result).toEqual({
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        });
      });

      it('returns zeros for empty object', () => {
        const result = extractUsage({});

        expect(result).toEqual({
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        });
      });

      it('prefers totalTokens over calculation when provided', () => {
        const usage = {
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 200, // Different from calculated 150
        };

        const result = extractUsage(usage);

        expect(result.totalTokens).toBe(200);
      });

      it('prefers v5 property names over v4', () => {
        const usage = {
          inputTokens: 100, // v5
          outputTokens: 50, // v5
          promptTokens: 200, // v4
          completionTokens: 100, // v4
        };

        const result = extractUsage(usage);

        expect(result).toEqual({
          promptTokens: 100, // Uses inputTokens (v5)
          completionTokens: 50, // Uses outputTokens (v5)
          totalTokens: 150,
        });
      });
    });
  });

  describe('sanitizeErrorMessage', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    describe('rate limit errors', () => {
      it('returns rate limit message for "rate limit" in error', () => {
        const error = new Error('rate limit exceeded');
        const result = sanitizeErrorMessage(error, 'TestAdapter');

        expect(result).toBe('You\'ve reached the usage limit. Please wait a moment before trying again.');
        expect(consoleErrorSpy).toHaveBeenCalledWith('[TestAdapter] Error:', 'rate limit exceeded');
      });

      it('returns rate limit message for case-insensitive "RATE LIMIT"', () => {
        const error = new Error('RATE LIMIT ERROR');
        const result = sanitizeErrorMessage(error, 'TestAdapter');

        expect(result).toBe('You\'ve reached the usage limit. Please wait a moment before trying again.');
      });
    });

    describe('timeout errors', () => {
      it('returns timeout message for "timeout" in error', () => {
        const error = new Error('request timeout');
        const result = sanitizeErrorMessage(error, 'TestAdapter');

        expect(result).toBe('The request took too long. Please try with a shorter prompt.');
        expect(consoleErrorSpy).toHaveBeenCalledWith('[TestAdapter] Error:', 'request timeout');
      });

      it('returns timeout message for case-insensitive "TIMEOUT"', () => {
        const error = new Error('CONNECTION TIMEOUT');
        const result = sanitizeErrorMessage(error, 'TestAdapter');

        expect(result).toBe('The request took too long. Please try with a shorter prompt.');
      });
    });

    describe('API errors', () => {
      it('returns API error message for "api" in error', () => {
        const error = new Error('API error occurred');
        const result = sanitizeErrorMessage(error, 'TestAdapter');

        expect(result).toBe('Unable to complete your request. Please try again later.');
        expect(consoleErrorSpy).toHaveBeenCalledWith('[TestAdapter] Error:', 'API error occurred');
      });

      it('returns API error message for case-insensitive "API"', () => {
        const error = new Error('Invalid API key');
        const result = sanitizeErrorMessage(error, 'TestAdapter');

        expect(result).toBe('AI service temporarily unavailable. Please try again later.');
      });
    });

    describe('generic errors', () => {
      it('returns generic message for unrecognized errors', () => {
        const error = new Error('Something went wrong');
        const result = sanitizeErrorMessage(error, 'TestAdapter');

        expect(result).toBe('Unable to complete your request. Please try again later.');
        expect(consoleErrorSpy).toHaveBeenCalledWith('[TestAdapter] Error:', 'Something went wrong');
      });

      it('returns generic message for validation errors', () => {
        const error = new Error('Schema validation failed');
        const result = sanitizeErrorMessage(error, 'TestAdapter');

        expect(result).toBe('Unable to complete your request. Please try again later.');
      });
    });

    describe('logging behavior', () => {
      it('logs error with adapter name prefix', () => {
        const error = new Error('Test error');
        sanitizeErrorMessage(error, 'AnthropicAdapter');

        expect(consoleErrorSpy).toHaveBeenCalledWith('[AnthropicAdapter] Error:', 'Test error');
      });

      it('logs full error message before sanitizing', () => {
        const error = new Error('Sensitive internal error details');
        const result = sanitizeErrorMessage(error, 'TestAdapter');

        expect(consoleErrorSpy).toHaveBeenCalledWith('[TestAdapter] Error:', 'Sensitive internal error details');
        expect(result).toBe('Unable to complete your request. Please try again later.');
      });
    });
  });

  describe('withRetry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    describe('success cases', () => {
      it('returns success result on first attempt', async () => {
        const operation = vi.fn().mockResolvedValue('success');

        const resultPromise = withRetry(operation, {
          maxRetries: 3,
          initialDelayMs: 1000,
          maxDelayMs: 10000,
          adapterName: 'TestAdapter',
        });

        const result = await resultPromise;

        expect(result).toEqual({ success: true, data: 'success' });
        expect(operation).toHaveBeenCalledTimes(1);
      });

      it('returns data of any type', async () => {
        const mockData = { id: 123, items: ['a', 'b'] };
        const operation = vi.fn().mockResolvedValue(mockData);

        const result = await withRetry(operation, {
          maxRetries: 3,
          initialDelayMs: 1000,
          maxDelayMs: 10000,
          adapterName: 'TestAdapter',
        });

        expect(result).toEqual({ success: true, data: mockData });
      });
    });

    describe('retry behavior', () => {
      it('retries on retryable errors', async () => {
        const operation = vi
          .fn()
          .mockRejectedValueOnce(new Error('rate limit exceeded'))
          .mockRejectedValueOnce(new Error('timeout'))
          .mockResolvedValueOnce('success');

        const resultPromise = withRetry(operation, {
          maxRetries: 3,
          initialDelayMs: 1000,
          maxDelayMs: 10000,
          adapterName: 'TestAdapter',
        });

        // Advance timers for first retry
        await vi.advanceTimersByTimeAsync(1000);
        // Advance timers for second retry
        await vi.advanceTimersByTimeAsync(2000);

        const result = await resultPromise;

        expect(result).toEqual({ success: true, data: 'success' });
        expect(operation).toHaveBeenCalledTimes(3);
      });

      it('returns immediately on non-retryable errors', async () => {
        const operation = vi.fn().mockRejectedValue(new Error('Invalid input'));

        const result = await withRetry(operation, {
          maxRetries: 3,
          initialDelayMs: 1000,
          maxDelayMs: 10000,
          adapterName: 'TestAdapter',
        });

        expect(result).toEqual({
          success: false,
          error: 'Unable to complete your request. Please try again later.',
        });
        expect(operation).toHaveBeenCalledTimes(1);
      });

      it('returns error after max retries exceeded', async () => {
        const operation = vi.fn().mockRejectedValue(new Error('rate limit exceeded'));

        const resultPromise = withRetry(operation, {
          maxRetries: 3,
          initialDelayMs: 1000,
          maxDelayMs: 10000,
          adapterName: 'TestAdapter',
        });

        // Advance timers for all retries
        await vi.advanceTimersByTimeAsync(1000); // First retry
        await vi.advanceTimersByTimeAsync(2000); // Second retry

        const result = await resultPromise;

        expect(result).toEqual({
          success: false,
          error: 'You\'ve reached the usage limit. Please wait a moment before trying again.',
        });
        expect(operation).toHaveBeenCalledTimes(3);
      });
    });

    describe('exponential backoff', () => {
      it('uses exponential backoff for delays', async () => {
        const operation = vi
          .fn()
          .mockRejectedValueOnce(new Error('timeout'))
          .mockRejectedValueOnce(new Error('timeout'))
          .mockRejectedValueOnce(new Error('timeout'));

        const resultPromise = withRetry(operation, {
          maxRetries: 3,
          initialDelayMs: 1000,
          maxDelayMs: 10000,
          adapterName: 'TestAdapter',
        });

        // First retry: 1000ms (1000 * 2^0)
        await vi.advanceTimersByTimeAsync(1000);
        expect(operation).toHaveBeenCalledTimes(2);

        // Second retry: 2000ms (1000 * 2^1)
        await vi.advanceTimersByTimeAsync(2000);
        expect(operation).toHaveBeenCalledTimes(3);

        await resultPromise;
      });

      it('respects maxDelayMs cap', async () => {
        const operation = vi
          .fn()
          .mockRejectedValueOnce(new Error('timeout'))
          .mockRejectedValueOnce(new Error('timeout'))
          .mockRejectedValueOnce(new Error('timeout'));

        const resultPromise = withRetry(operation, {
          maxRetries: 4,
          initialDelayMs: 1000,
          maxDelayMs: 2000, // Cap at 2000ms
          adapterName: 'TestAdapter',
        });

        // First retry: 1000ms
        await vi.advanceTimersByTimeAsync(1000);
        expect(operation).toHaveBeenCalledTimes(2);

        // Second retry: 2000ms (would be 2000ms, capped)
        await vi.advanceTimersByTimeAsync(2000);
        expect(operation).toHaveBeenCalledTimes(3);

        // Third retry: 2000ms (would be 4000ms, capped at 2000ms)
        await vi.advanceTimersByTimeAsync(2000);
        expect(operation).toHaveBeenCalledTimes(4);

        await resultPromise;
      });

      it('calculates correct delays for multiple retries', async () => {
        let attemptCount = 0;
        const operation = vi.fn().mockImplementation(() => {
          attemptCount++;
          if (attemptCount < 4) {
            return Promise.reject(new Error('timeout'));
          }
          return Promise.resolve('success');
        });

        const resultPromise = withRetry(operation, {
          maxRetries: 4,
          initialDelayMs: 100,
          maxDelayMs: 1000,
          adapterName: 'TestAdapter',
        });

        // First retry: 100ms (100 * 2^0)
        await vi.advanceTimersByTimeAsync(100);
        expect(operation).toHaveBeenCalledTimes(2);

        // Second retry: 200ms (100 * 2^1)
        await vi.advanceTimersByTimeAsync(200);
        expect(operation).toHaveBeenCalledTimes(3);

        // Third retry: 400ms (100 * 2^2)
        await vi.advanceTimersByTimeAsync(400);
        expect(operation).toHaveBeenCalledTimes(4);

        const result = await resultPromise;
        expect(result).toEqual({ success: true, data: 'success' });
      });
    });

    describe('error sanitization', () => {
      it('sanitizes error messages', async () => {
        const operation = vi.fn().mockRejectedValue(new Error('Internal API error with sensitive data'));

        const result = await withRetry(operation, {
          maxRetries: 3,
          initialDelayMs: 1000,
          maxDelayMs: 10000,
          adapterName: 'TestAdapter',
        });

        expect(result).toEqual({
          success: false,
          error: 'Unable to complete your request. Please try again later.',
        });
      });

      it('handles non-Error objects', async () => {
        const operation = vi.fn().mockRejectedValue('string error');

        const result = await withRetry(operation, {
          maxRetries: 3,
          initialDelayMs: 1000,
          maxDelayMs: 10000,
          adapterName: 'TestAdapter',
        });

        expect(result).toEqual({
          success: false,
          error: 'Unable to complete your request. Please try again later.',
        });
      });
    });
  });

  describe('DEFAULT_RETRY_CONFIG', () => {
    it('has correct default values', () => {
      expect(DEFAULT_RETRY_CONFIG).toEqual({
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
      });
    });

    it('is a constant object', () => {
      // Verify it's defined with expected shape
      expect(DEFAULT_RETRY_CONFIG).toBeDefined();
      expect(typeof DEFAULT_RETRY_CONFIG).toBe('object');
      expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_RETRY_CONFIG.initialDelayMs).toBe(1000);
      expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBe(10000);
    });
  });
});
