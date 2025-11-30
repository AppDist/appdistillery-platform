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
        orgId: 'org-123',
        moduleId: 'agency',
        taskType: 'scope.generate',
        systemPrompt: 'You are a project scoping assistant.',
        userPrompt: 'Analyze this project request.',
        schema,
        options: {
          maxTokens: 1000,
          temperature: 0.7,
        },
      }

      expect(task.orgId).toBe('org-123')
      expect(task.moduleId).toBe('agency')
      expect(task.options?.maxTokens).toBe(1000)
    })

    it('should work without optional options', () => {
      const schema = z.object({ result: z.string() })

      const task: BrainTask<typeof schema> = {
        orgId: 'org-456',
        moduleId: 'agency',
        taskType: 'proposal.draft',
        systemPrompt: 'You are a proposal writer.',
        userPrompt: 'Write a proposal.',
        schema,
      }

      expect(task.options).toBeUndefined()
    })
  })

  describe('brainHandle', () => {
    it('should throw not implemented error (Phase 1 stub)', async () => {
      const schema = z.object({ result: z.string() })

      const task: BrainTask<typeof schema> = {
        orgId: 'org-789',
        moduleId: 'agency',
        taskType: 'test',
        systemPrompt: 'Test prompt',
        userPrompt: 'Test input',
        schema,
      }

      await expect(brainHandle(task)).rejects.toThrow('Not implemented - Phase 1')
    })
  })

  describe('BrainResult type', () => {
    it('should represent a successful result', () => {
      const result: BrainResult<{ summary: string }> = {
        success: true,
        data: { summary: 'Test summary' },
        usage: { tokens: 500, durationMs: 1200 },
      }

      expect(result.success).toBe(true)
      expect(result.data?.summary).toBe('Test summary')
      expect(result.error).toBeUndefined()
    })

    it('should represent a failed result', () => {
      const result: BrainResult<{ summary: string }> = {
        success: false,
        error: 'API rate limit exceeded',
        usage: { durationMs: 100 },
      }

      expect(result.success).toBe(false)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('API rate limit exceeded')
    })
  })
})
