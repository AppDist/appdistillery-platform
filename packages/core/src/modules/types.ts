/**
 * Module manifest type definition
 *
 * Describes the structure of a module in the AppDistillery platform.
 * Used for module registry, routing, and usage tracking.
 */
export interface ModuleManifest {
  /**
   * Unique module identifier (e.g., 'agency')
   */
  id: string

  /**
   * Human-readable module name
   */
  name: string

  /**
   * Module description
   */
  description: string

  /**
   * Semantic version (e.g., '1.0.0')
   */
  version: string

  /**
   * Module routes for navigation
   */
  routes: {
    /**
     * Route path relative to module root
     */
    path: string

    /**
     * Icon name (e.g., 'Users', 'FileText')
     */
    icon: string

    /**
     * Label for navigation
     */
    label: string
  }[]

  /**
   * Usage actions for billing and tracking
   * Format: '<module>:<domain>:<verb>' (e.g., 'agency:scope:generate')
   */
  usageActions: string[]
}

/**
 * Installed module data from database
 * Combines module definition with tenant-specific installation details
 */
export interface InstalledModule {
  id: string
  tenantId: string
  moduleId: string
  enabled: boolean
  settings: Record<string, unknown>
  installedAt: Date
  updatedAt: Date
  module: {
    id: string
    name: string
    description: string | null
    version: string
    isActive: boolean
    createdAt: Date
  }
}
