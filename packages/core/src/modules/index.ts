/**
 * Module Registry
 *
 * Provides helpers for querying and managing module installations
 * in the AppDistillery Platform.
 */

// Export types
export type { ModuleManifest, InstalledModule } from './types'

// Export helpers
export { getInstalledModules } from './get-installed-modules'
export { isModuleEnabled } from './is-module-enabled'

// Export schemas (kept separate from 'use server' files)
export {
  InstallModuleSchema,
  UninstallModuleSchema,
  type InstallModuleInput,
  type UninstallModuleInput,
} from './schemas'

// Export Server Actions (async functions only)
export { installModule, type InstallModuleResult } from './actions/install-module'
export { uninstallModule, type UninstallModuleResult } from './actions/uninstall-module'
