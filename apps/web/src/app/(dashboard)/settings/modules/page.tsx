import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package } from 'lucide-react'
import { getSessionContext, createServerSupabaseClient } from '@appdistillery/core/auth'
import { getInstalledModules } from '@appdistillery/core/modules'
import type { Database } from '@appdistillery/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ModuleToggle } from './module-toggle'

type ModuleRow = Database['public']['Tables']['modules']['Row']

interface Module {
  id: string
  name: string
  description: string | null
  version: string
  isActive: boolean
}

/**
 * Fetch all available modules from the database
 */
async function getAvailableModules(): Promise<Module[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('modules')
    .select('id, name, description, version, is_active')
    .eq('is_active', true)
    .order('name')
    .returns<Pick<ModuleRow, 'id' | 'name' | 'description' | 'version' | 'is_active'>[]>()

  if (error) {
    console.error('[getAvailableModules] Database error:', error)
    return []
  }

  return (data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    version: m.version,
    isActive: m.is_active,
  }))
}

/**
 * Loading skeleton for module list
 */
function ModuleListSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading modules">
      <span className="sr-only">Loading module list...</span>
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="animate-pulse" aria-hidden="true">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 bg-muted rounded" />
              <div className="h-6 w-12 bg-muted rounded-full" />
            </div>
            <div className="h-4 w-64 bg-muted rounded mt-2" />
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

/**
 * Module list content - fetches and displays all modules with their status
 */
async function ModuleListContent() {
  const session = await getSessionContext()
  if (!session) redirect('/login')
  if (!session.tenant) redirect('/dashboard')

  const isAdmin = session.membership?.role === 'owner' || session.membership?.role === 'admin'
  const [modules, installedModules] = await Promise.all([
    getAvailableModules(),
    getInstalledModules(session.tenant.id, { includeDisabled: true }),
  ])

  const installedMap = new Map(
    installedModules.map((m) => [m.moduleId, { enabled: m.enabled, id: m.id }])
  )

  if (modules.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="size-12 text-muted-foreground mb-4" aria-hidden="true" />
          <p className="text-muted-foreground">No modules available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {modules.map((module) => {
        const installation = installedMap.get(module.id)
        const isEnabled = installation?.enabled ?? false

        return (
          <Card key={module.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <CardTitle className="text-lg truncate">{module.name}</CardTitle>
                  <Badge variant={isEnabled ? 'default' : 'secondary'} className="shrink-0">
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                {isAdmin && (
                  <ModuleToggle
                    moduleId={module.id}
                    moduleName={module.name}
                    isEnabled={isEnabled}
                  />
                )}
              </div>
              <CardDescription className="line-clamp-2">
                {module.description || 'No description available'}
              </CardDescription>
              <p className="text-xs text-muted-foreground mt-1">Version {module.version}</p>
            </CardHeader>
          </Card>
        )
      })}
    </div>
  )
}

/**
 * Module Management Page
 *
 * Displays available modules and allows admins to enable/disable them
 */
export default function ModulesPage() {
  return (
    <div className="container max-w-4xl px-4 py-8 md:px-6">
      <Link
        href="/settings"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Settings
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Module Management</h1>
        <p className="text-muted-foreground mt-1">
          Enable or disable modules for your organization
        </p>
      </div>

      <Suspense fallback={<ModuleListSkeleton />}>
        <ModuleListContent />
      </Suspense>
    </div>
  )
}

export const metadata = {
  title: 'Module Management | AppDistillery',
  description: 'Enable or disable modules for your organization',
}
