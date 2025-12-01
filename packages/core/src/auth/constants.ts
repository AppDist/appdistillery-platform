/**
 * Shared constants for auth package
 * Extracted to eliminate DRY violations across auth modules
 */

/**
 * Cookie name for tracking the active tenant
 */
export const ACTIVE_TENANT_COOKIE = 'active_tenant_id'

/**
 * Cookie max age in seconds (30 days)
 */
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30
