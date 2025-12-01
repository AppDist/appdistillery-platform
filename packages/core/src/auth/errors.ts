import type { AuthError } from '@supabase/supabase-js'

/**
 * Maps Supabase auth errors to user-friendly messages
 *
 * @param error - The Supabase AuthError
 * @returns A sanitized, user-friendly error message
 */
export function getAuthErrorMessage(error: AuthError): string {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password'
    case 'Email not confirmed':
      return 'Please verify your email before signing in'
    case 'User already registered':
      return 'An account with this email already exists'
    case 'Password should be at least 6 characters':
      return 'Password must be at least 6 characters'
    case 'Signup requires a valid password':
      return 'Please enter a valid password'
    default:
      // Log the actual error for debugging, return generic message
      console.error('[Auth Error]', error.message)
      return 'Authentication failed. Please try again.'
  }
}
