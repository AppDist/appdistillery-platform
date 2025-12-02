/**
 * Tests for brain module
 * Demonstrates testing patterns for the brainHandle service
 */

import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import { brainHandle, type BrainTask, type BrainResult } from '../brain'

describe('brain module', () => {
  describe('BrainTask interface', () => {
    it('should accept a valid BrainTask configuration', () => {
      const schema = z.object({
        summary: z.string(),
        items: z.array(z.string()),
      })

      const task: BrainTask<typeof schema> = {
        tenantId: 'org-123',
        userId: 'user-456',
        moduleId: 'agency',
        taskType: 'agency.scope',
        systemPrompt: 'You are a project scoping assistant.',
        userPrompt: 'Analyze this project request.',
        schema,
        options: {
          maxTokens: 1000,
          temperature: 0.7,
        },
      }

      expect(task.tenantId).toBe('org-123')
      expect(task.moduleId).toBe('agency')
      expect(task.options?.maxTokens).toBe(1000)
    })

    it('should work without optional options', () => {
      const schema = z.object({ result: z.string() })

      const task: BrainTask<typeof schema> = {
        tenantId: 'org-456',
        moduleId: 'agency',
        taskType: 'agency.proposal',
        systemPrompt: 'You are a proposal writer.',
        userPrompt: 'Write a proposal.',
        schema,
      }

      expect(task.options).toBeUndefined()
    })
  })

  describe('brainHandle', () => {
    it('should return error for invalid task type format', async () => {
      const schema = z.object({ result: z.string() })

      const task: BrainTask<typeof schema> = {
        tenantId: 'org-789',
        moduleId: 'agency',
        taskType: 'invalid-format',
        systemPrompt: 'Test prompt',
        userPrompt: 'Test input',
        schema,
      }

      const result = await brainHandle(task)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Invalid taskType format')
      }
    })
  })

  describe('BrainResult type', () => {
    it('should represent a successful result', () => {
      const result: BrainResult<{ summary: string }> = {
        success: true,
        data: { summary: 'Test summary' },
        usage: {
          promptTokens: 100,
          completionTokens: 400,
          totalTokens: 500,
          durationMs: 1200,
          units: 50,
        },
      }

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.summary).toBe('Test summary')
        expect(result.usage.totalTokens).toBe(500)
      }
    })

    it('should represent a failed result', () => {
      const result: BrainResult<{ summary: string }> = {
        success: false,
        error: 'API rate limit exceeded',
        usage: { durationMs: 100 },
      }

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('API rate limit exceeded')
      }
    })
  })
})
