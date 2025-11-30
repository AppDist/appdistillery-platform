/**
 * Tests for Agency lead intake schema
 * Demonstrates Zod schema validation testing patterns
 */

import { describe, it, expect } from 'vitest'
import { LeadIntakeSchema, type LeadIntake } from '../../schemas/intake'

describe('LeadIntakeSchema', () => {
  describe('valid inputs', () => {
    it('should accept minimal valid input', () => {
      const input = {
        clientName: 'Acme Corp',
        problemDescription: 'We need a new website',
      }

      const result = LeadIntakeSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.clientName).toBe('Acme Corp')
        expect(result.data.source).toBe('other') // default value
      }
    })

    it('should accept full input with all fields', () => {
      const input: LeadIntake = {
        clientName: 'Tech Startup Inc',
        contactEmail: 'hello@techstartup.com',
        contactPhone: '+1-555-123-4567',
        source: 'referral',
        problemDescription: 'We need help building a mobile app for our customers',
        budgetRange: '$50,000 - $100,000',
        timeline: 'Q1 2025',
      }

      const result = LeadIntakeSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.source).toBe('referral')
        expect(result.data.contactEmail).toBe('hello@techstartup.com')
      }
    })

    it('should accept empty string for optional email', () => {
      const input = {
        clientName: 'No Email Corp',
        contactEmail: '',
        problemDescription: 'We want to improve our process',
      }

      const result = LeadIntakeSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should accept all valid source types', () => {
      const sources = ['website', 'referral', 'linkedin', 'other'] as const

      for (const source of sources) {
        const input = {
          clientName: 'Test Client',
          source,
          problemDescription: 'Testing source types',
        }

        const result = LeadIntakeSchema.safeParse(input)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.source).toBe(source)
        }
      }
    })
  })

  describe('invalid inputs', () => {
    it('should reject empty client name', () => {
      const input = {
        clientName: '',
        problemDescription: 'Valid description here',
      }

      const result = LeadIntakeSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Client name is required')
      }
    })

    it('should reject short problem description', () => {
      const input = {
        clientName: 'Valid Client',
        problemDescription: 'Too short',
      }

      const result = LeadIntakeSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Please describe the problem')
      }
    })

    it('should reject invalid email format', () => {
      const input = {
        clientName: 'Email Test',
        contactEmail: 'not-an-email',
        problemDescription: 'We need help with email validation',
      }

      const result = LeadIntakeSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject invalid source type', () => {
      const input = {
        clientName: 'Source Test',
        source: 'invalid-source',
        problemDescription: 'Testing invalid source',
      }

      const result = LeadIntakeSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject missing required fields', () => {
      const input = {}

      const result = LeadIntakeSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0)
      }
    })
  })

  describe('type inference', () => {
    it('should correctly infer LeadIntake type', () => {
      const lead: LeadIntake = {
        clientName: 'Type Test Corp',
        source: 'website',
        problemDescription: 'Testing TypeScript inference',
      }

      // TypeScript should compile this without errors
      expect(lead.clientName).toBe('Type Test Corp')
    })
  })
})
