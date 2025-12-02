/**
 * Core Kernel Integration Tests
 *
 * Tests the full user journey: signup → create tenant → brainHandle → verify usage recorded
 * This test suite verifies the entire Core Kernel flow with real database operations
 * and mocked AI providers.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { z } from 'zod';
import { brainHandle } from '../../brain';
import type { BrainTask } from '../../brain/types';
import { generateStructured } from '../../brain/adapters/anthropic';
import {
  createIntegrationServiceClient,
  createIntegrationTestUser,
  createIntegrationTestTenant,
  cleanupIntegrationTestData,
  type IntegrationTestContext,
} from './setup';

// Skip tests if Supabase is not available
const skipIfNoSupabase =
  !process.env.SUPABASE_SECRET_KEY && !process.env.NEXT_PUBLIC_SUPABASE_URL;

// Mock AI adapters
vi.mock('../../brain/adapters/anthropic', () => ({
  generateStructured: vi.fn(),
}));

vi.mock('../../brain/adapters/openai', () => ({
  generateStructured: vi.fn(),
}));

// Test schema for AI output
const TestOutputSchema = z.object({
  summary: z.string().describe('Brief summary of the test'),
  items: z.array(z.string()).describe('List of test items'),
  confidence: z.number().min(0).max(1).describe('Confidence score'),
});

type TestOutput = z.infer<typeof TestOutputSchema>;

describe.skipIf(skipIfNoSupabase)('Core Kernel Integration', () => {
  let context: Partial<IntegrationTestContext> = {};

  beforeAll(async () => {
    // Setup mock AI response
    const mockAIResponse = {
      success: true as const,
      object: {
        summary: 'Integration test result',
        items: ['item1', 'item2', 'item3'],
        confidence: 0.95,
      },
      usage: {
        promptTokens: 150,
        completionTokens: 75,
        totalTokens: 225,
      },
    };

    vi.mocked(generateStructured).mockResolvedValue(mockAIResponse);

    // Create service client
    context.serviceClient = createIntegrationServiceClient();
    context.usageEventIds = [];
  }, 30000);

  afterAll(async () => {
    if (context.serviceClient) {
      await cleanupIntegrationTestData(context.serviceClient, context);
    }
  }, 30000);

  describe('1. User Journey - Auth & Tenant Setup', () => {
    it('creates user via signup', async () => {
      expect(context.serviceClient).toBeDefined();

      context.user = await createIntegrationTestUser(
        context.serviceClient!,
        'core-kernel'
      );

      expect(context.user).toBeDefined();
      expect(context.user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(context.user.email).toContain('core-kernel');
      expect(context.user.accessToken).toBeTruthy();
    });

    it('auto-creates user_profile via trigger', async () => {
      expect(context.serviceClient).toBeDefined();
      expect(context.user).toBeDefined();

      const { data: profile, error } = await context.serviceClient!
        .from('user_profiles')
        .select('*')
        .eq('id', context.user!.id)
        .single();

      expect(error).toBeNull();
      expect(profile).toBeDefined();
      expect(profile?.id).toBe(context.user!.id);
    });

    it('creates tenant via service role', async () => {
      expect(context.serviceClient).toBeDefined();
      expect(context.user).toBeDefined();

      context.tenant = await createIntegrationTestTenant(
        context.serviceClient!,
        context.user!.id,
        'Core Kernel Test'
      );

      expect(context.tenant).toBeDefined();
      expect(context.tenant.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(context.tenant.name).toContain('Core Kernel Test');
      expect(context.tenant.slug).toContain('integration-test');
      expect(context.tenant.type).toBe('organization');
    });

    it('user is tenant owner', async () => {
      expect(context.serviceClient).toBeDefined();
      expect(context.user).toBeDefined();
      expect(context.tenant).toBeDefined();

      const { data: membership, error } = await context.serviceClient!
        .from('tenant_members')
        .select('*')
        .eq('tenant_id', context.tenant!.id)
        .eq('user_id', context.user!.id)
        .single();

      expect(error).toBeNull();
      expect(membership).toBeDefined();
      expect(membership?.role).toBe('owner');
    });
  });

  describe('2. AI Integration - brainHandle', () => {
    it('brainHandle returns structured output with tenant context', async () => {
      expect(context.user).toBeDefined();
      expect(context.tenant).toBeDefined();

      const task: BrainTask<typeof TestOutputSchema> = {
        tenantId: context.tenant!.id,
        userId: context.user!.id,
        moduleId: 'test',
        taskType: 'test.integration',
        systemPrompt: 'You are a test assistant for integration testing.',
        userPrompt: 'Generate a test result with confidence score.',
        schema: TestOutputSchema,
      };

      const result = await brainHandle(task);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.summary).toBe('Integration test result');
        expect(result.data.items).toHaveLength(3);
        expect(result.data.confidence).toBe(0.95);
        expect(result.usage.promptTokens).toBe(150);
        expect(result.usage.completionTokens).toBe(75);
        expect(result.usage.totalTokens).toBe(225);
        expect(result.usage.durationMs).toBeGreaterThanOrEqual(0);
        expect(result.usage.units).toBeGreaterThan(0);
      }
    });

    it('usage event recorded correctly with tenant_id', async () => {
      expect(context.serviceClient).toBeDefined();
      expect(context.user).toBeDefined();
      expect(context.tenant).toBeDefined();

      // Query usage_events table
      const { data: events, error } = await context.serviceClient!
        .from('usage_events')
        .select('*')
        .eq('tenant_id', context.tenant!.id)
        .eq('user_id', context.user!.id)
        .eq('action', 'test:integration:generate');

      expect(error).toBeNull();
      expect(events).toBeDefined();
      expect(events!.length).toBeGreaterThanOrEqual(1);

      const event = events![0];
      if (!event) throw new Error('Expected event to exist');

      expect(event.tenant_id).toBe(context.tenant!.id);
      expect(event.user_id).toBe(context.user!.id);
      expect(event.module_id).toBe('test');
      expect(event.action).toBe('test:integration:generate');
      expect(event.tokens_input).toBe(150);
      expect(event.tokens_output).toBe(75);
      expect(event.tokens_total).toBe(225);
      expect(event.units).toBeGreaterThan(0);
      expect(event.duration_ms).toBeGreaterThanOrEqual(0);
      expect(event.metadata).toBeDefined();

      // Store event ID for cleanup
      context.usageEventIds!.push(event.id);
    });

    it('verifies tokens and action match expected values', async () => {
      expect(context.serviceClient).toBeDefined();
      expect(context.tenant).toBeDefined();

      const { data: events, error } = await context.serviceClient!
        .from('usage_events')
        .select('*')
        .eq('tenant_id', context.tenant!.id)
        .eq('action', 'test:integration:generate')
        .order('created_at', { ascending: false })
        .limit(1);

      expect(error).toBeNull();
      expect(events).toBeDefined();
      expect(events!.length).toBe(1);

      const event = events![0];
      if (!event) throw new Error('Expected event to exist');

      expect(event.tokens_input).toBe(150);
      expect(event.tokens_output).toBe(75);
      expect(event.tokens_total).toBe(225);
      expect(event.action).toBe('test:integration:generate');
    });
  });

  describe('3. Personal Mode - No Tenant', () => {
    it('brainHandle works without tenant (Personal mode)', async () => {
      expect(context.user).toBeDefined();

      const task: BrainTask<typeof TestOutputSchema> = {
        tenantId: null, // Personal mode
        userId: context.user!.id,
        moduleId: 'test',
        taskType: 'test.personal',
        systemPrompt: 'You are a personal assistant.',
        userPrompt: 'Generate personal test data.',
        schema: TestOutputSchema,
      };

      const result = await brainHandle(task);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.summary).toBe('Integration test result');
        expect(result.usage.totalTokens).toBe(225);
      }
    });

    it('usage event has null tenant_id in Personal mode', async () => {
      expect(context.serviceClient).toBeDefined();
      expect(context.user).toBeDefined();

      const { data: events, error } = await context.serviceClient!
        .from('usage_events')
        .select('*')
        .eq('user_id', context.user!.id)
        .eq('action', 'test:personal:generate')
        .is('tenant_id', null);

      expect(error).toBeNull();
      expect(events).toBeDefined();
      expect(events!.length).toBeGreaterThanOrEqual(1);

      const event = events![0];
      if (!event) throw new Error('Expected event to exist');

      expect(event.tenant_id).toBeNull();
      expect(event.user_id).toBe(context.user!.id);
      expect(event.action).toBe('test:personal:generate');

      // Store event ID for cleanup
      context.usageEventIds!.push(event.id);
    });
  });

  describe('4. Error Handling', () => {
    it('handles brainHandle failure gracefully', async () => {
      expect(context.user).toBeDefined();
      expect(context.tenant).toBeDefined();

      // Mock a failed AI response
      vi.mocked(generateStructured).mockResolvedValueOnce({
        success: false,
        error: 'AI generation failed',
      });

      const task: BrainTask<typeof TestOutputSchema> = {
        tenantId: context.tenant!.id,
        userId: context.user!.id,
        moduleId: 'test',
        taskType: 'test.failure',
        systemPrompt: 'Test system prompt',
        userPrompt: 'Test user prompt',
        schema: TestOutputSchema,
      };

      const result = await brainHandle(task);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('AI generation failed');
        expect(result.usage.durationMs).toBeGreaterThanOrEqual(0);
      }
    });

    it('records failed attempts with units: 0', async () => {
      expect(context.serviceClient).toBeDefined();
      expect(context.tenant).toBeDefined();

      const { data: events, error } = await context.serviceClient!
        .from('usage_events')
        .select('*')
        .eq('tenant_id', context.tenant!.id)
        .eq('action', 'test:failure:generate')
        .eq('units', 0);

      expect(error).toBeNull();
      expect(events).toBeDefined();
      expect(events!.length).toBeGreaterThanOrEqual(1);

      const event = events![0];
      if (!event) throw new Error('Expected event to exist');

      expect(event.tokens_input).toBe(0);
      expect(event.tokens_output).toBe(0);
      expect(event.units).toBe(0);
      expect(event.metadata).toBeDefined();

      // Store event ID for cleanup
      context.usageEventIds!.push(event.id);
    });

    it('handles invalid taskType format', async () => {
      expect(context.user).toBeDefined();

      const task: BrainTask<typeof TestOutputSchema> = {
        tenantId: null,
        userId: context.user!.id,
        moduleId: 'test',
        taskType: 'invalid-format', // Invalid format (no dot separator)
        systemPrompt: 'Test',
        userPrompt: 'Test',
        schema: TestOutputSchema,
      };

      const result = await brainHandle(task);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid taskType format');
      }
    });
  });
});
