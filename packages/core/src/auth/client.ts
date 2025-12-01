/**
 * Client-side auth exports
 * Safe to import in 'use client' components
 * Does NOT include server-only code (next/headers)
 */

export { createBrowserSupabaseClient } from './supabase-browser'
export { getAuthErrorMessage } from './errors'
