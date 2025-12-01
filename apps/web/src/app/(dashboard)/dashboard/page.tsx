import { getSessionContext } from '@appdistillery/core/auth'
import { SignOutButton } from '@/components/auth/sign-out-button'

export default async function DashboardPage() {
  // Middleware guarantees user is authenticated
  const session = await getSessionContext()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <SignOutButton />
      </div>
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground mb-2">Signed in as:</p>
        <p className="font-medium">{session?.user.displayName || 'User'}</p>
      </div>
    </div>
  )
}
