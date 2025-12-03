/**
 * Module Lifecycle Integration Tests
 *
 * Tests the complete module lifecycle flow:
 * 1. Install module with settings
 * 2. Verify module is enabled
 * 3. Disable module (soft delete)
 * 4. Verify module is disabled but data preserved
 * 5. Re-enable module
 * 6. Verify settings preserved after re-enable
 * 7. Hard delete module
 * 8. Verify module record removed
 *
 * This test suite validates the full module management flow with real database operations.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { installModule } from '../../modules/actions/install-module';
import { uninstallModule } from '../../modules/actions/uninstall-module';
import {
  createIntegrationServiceClient,
  createIntegrationTestUser,
  createIntegrationTestTenant,
  cleanupIntegrationTestData,
  type IntegrationTestContext,
} from './setup';

// Skip tests if Supabase is not available
const skipIfNoSupabase =
  !process.env.SUPABASE_SECRET_KEY && !process.env.NEXT_PUBLIC_SUPABASE_URL;

describe.skipIf(skipIfNoSupabase)('Module Lifecycle Integration', () => {
  let context: Partial<IntegrationTestContext> = {};
  let moduleId: string;
  let tenantModuleId: string | null = null;

  beforeAll(async () => {
    // Create service client
    context.serviceClient = createIntegrationServiceClient();
    context.usageEventIds = [];

    // Create test user
    context.user = await createIntegrationTestUser(
      context.serviceClient,
      'module-lifecycle'
    );

    // Create test tenant with user as owner
    context.tenant = await createIntegrationTestTenant(
      context.serviceClient,
      context.user.id,
      'Module Lifecycle Test'
    );

    // Create a test module in the database
    const timestamp = Date.now();
    moduleId = `test-module-${timestamp}`;

    const { data: module, error: moduleError } = await context.serviceClient
      .from('modules')
      .insert({
        id: moduleId,
        name: 'Test Module',
        description: 'Integration test module',
        version: '1.0.0',
        is_active: true,
      })
      .select('id')
      .single();

    if (moduleError || !module) {
      throw new Error(`Failed to create test module: ${moduleError?.message}`);
    }
  }, 30000);

  afterAll(async () => {
    // Clean up tenant_modules first
    if (context.serviceClient && tenantModuleId) {
      await context.serviceClient
        .from('tenant_modules')
        .delete()
        .eq('id', tenantModuleId);
    }

    // Delete test module
    if (context.serviceClient && moduleId) {
      await context.serviceClient.from('modules').delete().eq('id', moduleId);
    }

    // Clean up user and tenant
    if (context.serviceClient) {
      await cleanupIntegrationTestData(context.serviceClient, context);
    }
  }, 30000);

  beforeEach(() => {
    tenantModuleId = null;
  });

  describe('1. Module Installation', () => {
    it('installs module with custom settings', async () => {
      expect(context.serviceClient).toBeDefined();
      expect(context.tenant).toBeDefined();

      const customSettings = {
        featureFlags: { proposals: true, briefs: true },
        theme: 'dark',
        maxUsers: 10,
      };

      const result = await installModule({
        moduleId,
        settings: customSettings,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.moduleId).toBe(moduleId);
        expect(result.data.id).toBeTruthy();
        tenantModuleId = result.data.id;
      }
    });

    it('verifies tenant_modules record exists with enabled=true', async () => {
      expect(context.serviceClient).toBeDefined();
      expect(context.tenant).toBeDefined();
      expect(tenantModuleId).toBeTruthy();

      const { data: tenantModule, error } = await context.serviceClient!
        .from('tenant_modules')
        .select('*')
        .eq('id', tenantModuleId!)
        .single();

      expect(error).toBeNull();
      expect(tenantModule).toBeDefined();
      expect(tenantModule?.tenant_id).toBe(context.tenant!.id);
      expect(tenantModule?.module_id).toBe(moduleId);
      expect(tenantModule?.enabled).toBe(true);
      expect(tenantModule?.settings).toEqual({
        featureFlags: { proposals: true, briefs: true },
        theme: 'dark',
        maxUsers: 10,
      });
    });

    it('verifies settings are persisted correctly', async () => {
      expect(context.serviceClient).toBeDefined();
      expect(tenantModuleId).toBeTruthy();

      const { data: tenantModule } = await context.serviceClient!
        .from('tenant_modules')
        .select('settings')
        .eq('id', tenantModuleId!)
        .single();

      expect(tenantModule?.settings).toBeDefined();
      const settings = tenantModule?.settings as Record<string, unknown>;
      expect(settings.featureFlags).toEqual({ proposals: true, briefs: true });
      expect(settings.theme).toBe('dark');
      expect(settings.maxUsers).toBe(10);
    });
  });

  describe('2. Module Disable (Soft Delete)', () => {
    it('disables module via soft delete', async () => {
      expect(tenantModuleId).toBeTruthy();

      const result = await uninstallModule({
        moduleId,
        hardDelete: false,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.moduleId).toBe(moduleId);
        expect(result.data.hardDeleted).toBe(false);
      }
    });

    it('verifies tenant_modules record has enabled=false', async () => {
      expect(context.serviceClient).toBeDefined();
      expect(tenantModuleId).toBeTruthy();

      const { data: tenantModule, error } = await context.serviceClient!
        .from('tenant_modules')
        .select('*')
        .eq('id', tenantModuleId!)
        .single();

      expect(error).toBeNull();
      expect(tenantModule).toBeDefined();
      expect(tenantModule?.enabled).toBe(false);
      expect(tenantModule?.module_id).toBe(moduleId);
    });

    it('verifies settings preserved after soft delete', async () => {
      expect(context.serviceClient).toBeDefined();
      expect(tenantModuleId).toBeTruthy();

      const { data: tenantModule } = await context.serviceClient!
        .from('tenant_modules')
        .select('settings')
        .eq('id', tenantModuleId!)
        .single();

      expect(tenantModule?.settings).toEqual({
        featureFlags: { proposals: true, briefs: true },
        theme: 'dark',
        maxUsers: 10,
      });
    });
  });

  describe('3. Module Re-enable', () => {
    it('re-enables module via installModule', async () => {
      expect(tenantModuleId).toBeTruthy();

      // installModule should detect disabled module and re-enable it
      const result = await installModule({
        moduleId,
        settings: {
          featureFlags: { proposals: false, briefs: true },
          theme: 'light',
          maxUsers: 20,
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(tenantModuleId);
        expect(result.data.moduleId).toBe(moduleId);
      }
    });

    it('verifies module is enabled after re-install', async () => {
      expect(context.serviceClient).toBeDefined();
      expect(tenantModuleId).toBeTruthy();

      const { data: tenantModule, error } = await context.serviceClient!
        .from('tenant_modules')
        .select('*')
        .eq('id', tenantModuleId!)
        .single();

      expect(error).toBeNull();
      expect(tenantModule).toBeDefined();
      expect(tenantModule?.enabled).toBe(true);
      expect(tenantModule?.module_id).toBe(moduleId);
    });

    it('verifies settings updated after re-enable', async () => {
      expect(context.serviceClient).toBeDefined();
      expect(tenantModuleId).toBeTruthy();

      const { data: tenantModule } = await context.serviceClient!
        .from('tenant_modules')
        .select('settings')
        .eq('id', tenantModuleId!)
        .single();

      // Settings should be updated to the new values from re-install
      expect(tenantModule?.settings).toEqual({
        featureFlags: { proposals: false, briefs: true },
        theme: 'light',
        maxUsers: 20,
      });
    });
  });

  describe('4. Module Hard Delete', () => {
    it('hard deletes module', async () => {
      expect(tenantModuleId).toBeTruthy();

      const result = await uninstallModule({
        moduleId,
        hardDelete: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.moduleId).toBe(moduleId);
        expect(result.data.hardDeleted).toBe(true);
      }
    });

    it('verifies tenant_modules record removed', async () => {
      expect(context.serviceClient).toBeDefined();
      expect(tenantModuleId).toBeTruthy();

      const { data: tenantModule, error } = await context.serviceClient!
        .from('tenant_modules')
        .select('*')
        .eq('id', tenantModuleId!)
        .maybeSingle();

      expect(error).toBeNull();
      expect(tenantModule).toBeNull();
    });

    it('verifies module no longer appears in tenant modules list', async () => {
      expect(context.serviceClient).toBeDefined();
      expect(context.tenant).toBeDefined();

      const { data: tenantModules, error } = await context.serviceClient!
        .from('tenant_modules')
        .select('*')
        .eq('tenant_id', context.tenant!.id)
        .eq('module_id', moduleId);

      expect(error).toBeNull();
      expect(tenantModules).toEqual([]);
    });
  });

  describe('5. Settings Persistence Across Lifecycle', () => {
    it('completes full lifecycle with settings preservation', async () => {
      // Step 1: Install with initial settings
      const initialSettings = {
        feature: 'enabled',
        color: 'blue',
        count: 5,
      };

      const installResult = await installModule({
        moduleId,
        settings: initialSettings,
      });

      expect(installResult.success).toBe(true);
      let currentTenantModuleId: string = '';
      if (installResult.success) {
        currentTenantModuleId = installResult.data.id;
      }

      // Step 2: Verify installed with correct settings
      let { data: tenantModule } = await context.serviceClient!
        .from('tenant_modules')
        .select('*')
        .eq('id', currentTenantModuleId)
        .single();

      expect(tenantModule?.enabled).toBe(true);
      expect(tenantModule?.settings).toEqual(initialSettings);

      // Step 3: Soft delete
      const uninstallResult = await uninstallModule({
        moduleId,
        hardDelete: false,
      });

      expect(uninstallResult.success).toBe(true);

      // Step 4: Verify settings preserved after soft delete
      ({ data: tenantModule } = await context.serviceClient!
        .from('tenant_modules')
        .select('*')
        .eq('id', currentTenantModuleId)
        .single());

      expect(tenantModule?.enabled).toBe(false);
      expect(tenantModule?.settings).toEqual(initialSettings);

      // Step 5: Re-enable with new settings
      const updatedSettings = {
        feature: 'disabled',
        color: 'red',
        count: 10,
      };

      const reInstallResult = await installModule({
        moduleId,
        settings: updatedSettings,
      });

      expect(reInstallResult.success).toBe(true);

      // Step 6: Verify settings updated
      ({ data: tenantModule } = await context.serviceClient!
        .from('tenant_modules')
        .select('*')
        .eq('id', currentTenantModuleId)
        .single());

      expect(tenantModule?.enabled).toBe(true);
      expect(tenantModule?.settings).toEqual(updatedSettings);

      // Cleanup: Hard delete
      await uninstallModule({
        moduleId,
        hardDelete: true,
      });
    });
  });

  describe('6. Error Handling', () => {
    it('returns error when installing already installed module', async () => {
      // First install
      const installResult = await installModule({
        moduleId,
        settings: { test: true },
      });

      expect(installResult.success).toBe(true);
      let currentTenantModuleId = '';
      if (installResult.success) {
        currentTenantModuleId = installResult.data.id;
      }

      // Try to install again (should fail)
      const duplicateResult = await installModule({
        moduleId,
        settings: { test: true },
      });

      expect(duplicateResult.success).toBe(false);
      if (!duplicateResult.success) {
        expect(duplicateResult.error).toBe('Module already installed');
      }

      // Cleanup
      await context.serviceClient!
        .from('tenant_modules')
        .delete()
        .eq('id', currentTenantModuleId);
    });

    it('returns error when uninstalling non-existent module', async () => {
      const nonExistentModuleId = 'non-existent-module-999';

      const result = await uninstallModule({
        moduleId: nonExistentModuleId,
        hardDelete: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Module not installed');
      }
    });

    it('returns error when soft deleting already disabled module', async () => {
      // Install module
      const installResult = await installModule({
        moduleId,
        settings: { test: true },
      });

      expect(installResult.success).toBe(true);
      let currentTenantModuleId = '';
      if (installResult.success) {
        currentTenantModuleId = installResult.data.id;
      }

      // Soft delete once
      const firstUninstall = await uninstallModule({
        moduleId,
        hardDelete: false,
      });

      expect(firstUninstall.success).toBe(true);

      // Try to soft delete again (should fail)
      const secondUninstall = await uninstallModule({
        moduleId,
        hardDelete: false,
      });

      expect(secondUninstall.success).toBe(false);
      if (!secondUninstall.success) {
        expect(secondUninstall.error).toBe('Module already disabled');
      }

      // Cleanup
      await context.serviceClient!
        .from('tenant_modules')
        .delete()
        .eq('id', currentTenantModuleId);
    });

    it('returns error when installing inactive module', async () => {
      // Create inactive test module
      const timestamp = Date.now();
      const inactiveModuleId = `inactive-module-${timestamp}`;

      await context.serviceClient!.from('modules').insert({
        id: inactiveModuleId,
        name: 'Inactive Module',
        description: 'Inactive test module',
        version: '1.0.0',
        is_active: false,
      });

      // Try to install inactive module
      const result = await installModule({
        moduleId: inactiveModuleId,
        settings: {},
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Module is not active');
      }

      // Cleanup
      await context.serviceClient!
        .from('modules')
        .delete()
        .eq('id', inactiveModuleId);
    });
  });

  describe('7. Tenant Isolation', () => {
    it('verifies tenant isolation in module operations', async () => {
      expect(context.serviceClient).toBeDefined();
      expect(context.tenant).toBeDefined();

      // Install module
      const result = await installModule({
        moduleId,
        settings: { isolation: 'test' },
      });

      expect(result.success).toBe(true);
      let currentTenantModuleId = '';
      if (result.success) {
        currentTenantModuleId = result.data.id;
      }

      // Verify tenant_id in database record
      const { data: tenantModule } = await context.serviceClient!
        .from('tenant_modules')
        .select('*')
        .eq('id', currentTenantModuleId)
        .single();

      expect(tenantModule?.tenant_id).toBe(context.tenant!.id);

      // Cleanup
      await uninstallModule({
        moduleId,
        hardDelete: true,
      });
    });

    it('prevents access to modules from other tenants', async () => {
      expect(context.serviceClient).toBeDefined();
      expect(context.user).toBeDefined();

      // Create second tenant
      const timestamp = Date.now();
      const tenant2 = await createIntegrationTestTenant(
        context.serviceClient!,
        context.user!.id,
        `Second Tenant ${timestamp}`
      );

      // Install module for first tenant
      const result = await installModule({
        moduleId,
        settings: { tenant: 'first' },
      });

      expect(result.success).toBe(true);
      let currentTenantModuleId = '';
      if (result.success) {
        currentTenantModuleId = result.data.id;
      }

      // Verify module only visible for first tenant
      const { data: tenant1Modules } = await context.serviceClient!
        .from('tenant_modules')
        .select('*')
        .eq('tenant_id', context.tenant!.id)
        .eq('module_id', moduleId);

      expect(tenant1Modules).toHaveLength(1);

      // Verify module not visible for second tenant
      const { data: tenant2Modules } = await context.serviceClient!
        .from('tenant_modules')
        .select('*')
        .eq('tenant_id', tenant2.id)
        .eq('module_id', moduleId);

      expect(tenant2Modules).toHaveLength(0);

      // Cleanup
      await context.serviceClient!
        .from('tenant_modules')
        .delete()
        .eq('id', currentTenantModuleId);

      await context.serviceClient!
        .from('tenant_members')
        .delete()
        .eq('tenant_id', tenant2.id);

      await context.serviceClient!
        .from('tenants')
        .delete()
        .eq('id', tenant2.id);
    });
  });
});
