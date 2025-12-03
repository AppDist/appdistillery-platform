/**
 * Module Actions
 *
 * Server Actions for module installation and uninstallation.
 * Safe to import in client components.
 *
 * Note: Only async functions are exported here as this file re-exports
 * from 'use server' modules. Zod schemas and types are available from
 * the parent @appdistillery/core/modules export for server-side use.
 */

export { installModule } from './install-module'
export { uninstallModule } from './uninstall-module'

// Types are safe to re-export
export type { InstallModuleInput, InstallModuleResult } from './install-module'
export type { UninstallModuleInput, UninstallModuleResult } from './uninstall-module'
