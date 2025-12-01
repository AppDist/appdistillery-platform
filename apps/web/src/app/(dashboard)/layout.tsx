import { getSessionContext, getUserTenants } from '@appdistillery/core/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TenantSwitcher } from '@/components/tenants/tenant-switcher'
import { SignOutButton } from '@/components/auth/sign-out-button'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get session context - middleware guarantees authentication
  const session = await getSessionContext()

  // Redirect to login if not authenticated (safety fallback)
  if (!session) {
    redirect('/login')
  }

  // Fetch all tenants for the user
  const tenants = await getUserTenants()

  // Determine active tenant ID from session
  const activeTenantId = session.tenant?.id ?? null

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4 md:px-6">
          {/* Left: Logo/Brand */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-semibold text-foreground hover:text-foreground/80 transition-colors"
            >
              <span className="text-lg">AppDistillery</span>
            </Link>
          </div>

          {/* Center/Right: TenantSwitcher and User Menu */}
          <div className="flex items-center gap-2">
            <TenantSwitcher
              tenants={tenants}
              activeTenantId={activeTenantId}
              user={{
                email: session.user.email,
                displayName: session.user.displayName,
              }}
            />
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}
