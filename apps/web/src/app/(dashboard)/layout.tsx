import { getSessionContext, getUserTenants } from '@appdistillery/core/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TenantSwitcher } from '@/components/tenants/tenant-switcher'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { ThemeToggle } from '@/components/theme-toggle'

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
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Dashboard Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4 md:px-6">
          {/* Left: Logo/Brand + Nav */}
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-semibold text-foreground hover:text-foreground/80 transition-colors"
            >
              <span className="text-lg">AppDistillery</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-4">
              <Link
                href="/usage"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Usage
              </Link>
              <Link
                href="/settings"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Settings
              </Link>
            </nav>
          </div>

          {/* Center/Right: TenantSwitcher, Theme Toggle, and User Menu */}
          <div className="flex items-center gap-2">
            <TenantSwitcher
              tenants={tenants}
              activeTenantId={activeTenantId}
              user={{
                email: session.user.email,
                displayName: session.user.displayName,
              }}
            />
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}
