/**
 * Module Action Schemas
 *
 * Zod schemas for module install/uninstall operations.
 * Kept separate from 'use server' files to allow proper bundling.
 */

import { z } from 'zod'

/**
 * Input schema for installing a module
 */
export const InstallModuleSchema = z.object({
  moduleId: z.string().min(1, 'Module ID is required'),
  settings: z.record(z.unknown()).optional().default({}),
})

export type InstallModuleInput = z.infer<typeof InstallModuleSchema>

/**
 * Input schema for uninstalling a module
 */
export const UninstallModuleSchema = z.object({
  moduleId: z.string().min(1, 'Module ID is required'),
  /**
   * Soft delete: disable module but keep data
   * Hard delete: remove tenant_modules record (may cascade delete module data)
   */
  hardDelete: z.boolean().optional().default(false),
})

export type UninstallModuleInput = z.infer<typeof UninstallModuleSchema>
