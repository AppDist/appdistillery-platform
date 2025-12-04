import { describe, it, expect, vi } from 'vitest'
import { getAuthErrorMessage } from './errors'
import type { AuthError } from '@supabase/supabase-js'

// Helper to create mock AuthError with required fields
function createMockAuthError(message: string, status = 400): AuthError {
  return {
    name: 'AuthApiError',
    message,
    status,
    code: 'auth_error',
    __isAuthError: true,
  } as unknown as AuthError
}

describe('getAuthErrorMessage', () => {
  describe('known error messages', () => {
    it('returns friendly message for invalid login credentials', () => {
      const error = createMockAuthError('Invalid login credentials')

      const result = getAuthErrorMessage(error)

      expect(result).toBe('Invalid email or password')
    })

    it('returns friendly message for unconfirmed email', () => {
      const error = createMockAuthError('Email not confirmed')

      const result = getAuthErrorMessage(error)

      expect(result).toBe('Please verify your email before signing in')
    })

    it('returns friendly message for existing user', () => {
      const error = createMockAuthError('User already registered')

      const result = getAuthErrorMessage(error)

      expect(result).toBe('An account with this email already exists')
    })

    it('returns friendly message for short password', () => {
      const error = createMockAuthError('Password should be at least 6 characters')

      const result = getAuthErrorMessage(error)

      expect(result).toBe('Password must be at least 6 characters')
    })

    it('returns friendly message for missing password', () => {
      const error = createMockAuthError('Signup requires a valid password')

      const result = getAuthErrorMessage(error)

      expect(result).toBe('Please enter a valid password')
    })
  })

  describe('unknown error messages', () => {
    it('returns generic message for unknown error', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const error = createMockAuthError('Unknown database error', 500)

      const result = getAuthErrorMessage(error)

      expect(result).toBe('Authentication failed. Please try again.')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Auth Error] Unknown database error',
        ''
      )

      consoleErrorSpy.mockRestore()
    })

    it('returns generic message for network error', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const error = createMockAuthError('Network connection failed', 0)

      const result = getAuthErrorMessage(error)

      expect(result).toBe('Authentication failed. Please try again.')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Auth Error] Network connection failed',
        ''
      )

      consoleErrorSpy.mockRestore()
    })

    it('returns generic message for unexpected error format', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const error = createMockAuthError('Unexpected error format', 500)

      const result = getAuthErrorMessage(error)

      expect(result).toBe('Authentication failed. Please try again.')
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('error logging', () => {
    it('logs unknown errors to console for debugging', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const error = createMockAuthError('Detailed internal error message', 500)

      getAuthErrorMessage(error)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Auth Error] Detailed internal error message',
        ''
      )

      consoleErrorSpy.mockRestore()
    })

    it('does not log known error messages', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const error = createMockAuthError('Invalid login credentials')

      getAuthErrorMessage(error)

      expect(consoleErrorSpy).not.toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('error message consistency', () => {
    it('always returns a non-empty string', () => {
      const errors = [
        createMockAuthError('Invalid login credentials'),
        createMockAuthError('Unknown error', 500),
        createMockAuthError('', 500),
      ]

      errors.forEach((error) => {
        const result = getAuthErrorMessage(error)
        expect(result).toBeTruthy()
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      })
    })

    it('sanitizes error messages for user display', () => {
      const error = createMockAuthError('Invalid login credentials')

      const result = getAuthErrorMessage(error)

      // Should not expose technical details
      expect(result).not.toContain('database')
      expect(result).not.toContain('server')
      expect(result).not.toContain('SQL')
    })
  })

  describe('edge cases', () => {
    it('handles empty error message', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const error = createMockAuthError('', 500)

      const result = getAuthErrorMessage(error)

      expect(result).toBe('Authentication failed. Please try again.')
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Auth Error] ', '')

      consoleErrorSpy.mockRestore()
    })

    it('handles error message with different casing', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const error = createMockAuthError('INVALID LOGIN CREDENTIALS')

      const result = getAuthErrorMessage(error)

      // Should not match due to case sensitivity
      expect(result).toBe('Authentication failed. Please try again.')
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('handles error message with extra whitespace', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const error = createMockAuthError('  Invalid login credentials  ')

      const result = getAuthErrorMessage(error)

      // Should not match due to whitespace
      expect(result).toBe('Authentication failed. Please try again.')
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('user-facing messages', () => {
    it('provides actionable guidance in error messages', () => {
      const testCases = [
        {
          message: 'Email not confirmed',
          expected: 'verify your email',
        },
        {
          message: 'Password should be at least 6 characters',
          expected: 'at least 6 characters',
        },
        {
          message: 'Signup requires a valid password',
          expected: 'enter a valid password',
        },
      ]

      testCases.forEach(({ message, expected }) => {
        const error = createMockAuthError(message)
        const result = getAuthErrorMessage(error)
        expect(result.toLowerCase()).toContain(expected)
      })
    })

    it('uses friendly language in all messages', () => {
      const knownMessages = [
        'Invalid login credentials',
        'Email not confirmed',
        'User already registered',
        'Password should be at least 6 characters',
        'Signup requires a valid password',
      ]

      knownMessages.forEach((message) => {
        const error = createMockAuthError(message)
        const result = getAuthErrorMessage(error)

        // Should not contain technical jargon
        expect(result).not.toContain('credentials')
        expect(result).not.toContain('registered')
        expect(result).not.toContain('requires')
      })
    })
  })
})
