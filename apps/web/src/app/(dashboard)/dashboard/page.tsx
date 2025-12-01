import { getSessionContext } from '@appdistillery/core/auth'

export default async function DashboardPage() {
  // Middleware guarantees user is authenticated
  const session = await getSessionContext()

  return (
    <div className="container px-4 py-8 md:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user.displayName || 'User'}
        </p>
      </div>

      {/* Context Info Card */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            Current Context
          </h2>
          <p className="text-lg font-semibold">
            {session?.tenant ? session.tenant.name : 'Personal'}
          </p>
          {session?.tenant && session?.membership && (
            <p className="text-sm text-muted-foreground mt-1 capitalize">
              Role: {session.membership.role}
            </p>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            Account
          </h2>
          <p className="text-lg font-semibold truncate">
            {session?.user.email}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {session?.user.displayName || 'No display name set'}
          </p>
        </div>
      </div>
    </div>
  )
}
