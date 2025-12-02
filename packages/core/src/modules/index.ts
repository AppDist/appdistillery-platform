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

// Export Server Actions
export {
  installModule,
  InstallModuleSchema,
  type InstallModuleInput,
  type InstallModuleResult,
} from './actions/install-module'

export {
  uninstallModule,
  UninstallModuleSchema,
  type UninstallModuleInput,
  type UninstallModuleResult,
} from './actions/uninstall-module'
