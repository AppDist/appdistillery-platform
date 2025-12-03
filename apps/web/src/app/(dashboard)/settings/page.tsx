import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, ChevronRight } from 'lucide-react'
import { getSessionContext, createServerSupabaseClient } from '@appdistillery/core/auth'
import { getInstalledModules } from '@appdistillery/core/modules'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Fetch module statistics for the current tenant
 */
async function getModuleStats(): Promise<{ enabled: number; total: number }> {
  const session = await getSessionContext()
  if (!session?.tenant) return { enabled: 0, total: 0 }

  const supabase = await createServerSupabaseClient()

  // Get total available modules
  const { count: totalModules } = await supabase
    .from('modules')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // Get installed (enabled) modules for this tenant
  const installedModules = await getInstalledModules(session.tenant.id, {
    includeDisabled: false,
  })

  return {
    enabled: installedModules.length,
    total: totalModules ?? 0,
  }
}

/**
 * Loading skeleton for settings sections
 */
function SettingsSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading settings">
      <span className="sr-only">Loading settings...</span>
      <Card className="animate-pulse" aria-hidden="true">
        <CardHeader>
          <div className="h-5 w-32 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted rounded mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-10 w-full bg-muted rounded" />
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Module settings section - displays enabled modules count and link to manage
 */
async function ModuleSettingsSection() {
  const session = await getSessionContext()
  if (!session) redirect('/login')

  const stats = await getModuleStats()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Package className="size-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-lg">Modules</CardTitle>
            <CardDescription>
              {stats.enabled} of {stats.total} modules enabled
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Link
          href="/settings/modules"
          className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
        >
          <span className="text-sm font-medium">Manage Modules</span>
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  )
}

/**
 * Settings Page
 *
 * Central settings hub with links to different settings sections
 */
export default function SettingsPage() {
  return (
    <div className="container max-w-4xl px-4 py-8 md:px-6">
      <Link
        href="/dashboard"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your organization settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        <Suspense fallback={<SettingsSkeleton />}>
          <ModuleSettingsSection />
        </Suspense>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Settings | AppDistillery',
  description: 'Manage your organization settings and preferences',
}
