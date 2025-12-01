'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronDown,
  Check,
  Plus,
  Building2,
  Home,
  User,
} from 'lucide-react'
import type { Tenant, TenantMember } from '@appdistillery/core/auth'
import { switchTenant } from '@/actions/tenant'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Props for the TenantSwitcher component
 */
export interface TenantSwitcherProps {
  /** List of tenants the user belongs to with their membership details */
  tenants: Array<{ tenant: Tenant; membership: TenantMember }>
  /** Currently active tenant ID, or null for personal mode */
  activeTenantId: string | null
  /** Current user information */
  user: { email: string; displayName: string | null }
}

/**
 * TenantSwitcher - Allows users to switch between personal mode and their tenants
 *
 * Displays a dropdown menu with:
 * - Personal mode option (working as individual)
 * - List of tenants the user belongs to
 * - Options to create new household or organization
 *
 * Uses semantic tokens from the design system and shadcn/ui components.
 */
export function TenantSwitcher({
  tenants,
  activeTenantId,
  user,
}: TenantSwitcherProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  /**
   * Get the display name for the current context
   */
  const getCurrentContextName = () => {
    if (!activeTenantId) {
      return 'Personal'
    }
    const activeTenant = tenants.find((t) => t.tenant.id === activeTenantId)
    return activeTenant?.tenant.name ?? 'Unknown'
  }

  /**
   * Get the icon for the current context
   */
  const getCurrentContextIcon = () => {
    if (!activeTenantId) {
      return <User className="size-4" aria-hidden="true" />
    }
    const activeTenant = tenants.find((t) => t.tenant.id === activeTenantId)
    if (activeTenant?.tenant.type === 'household') {
      return <Home className="size-4" aria-hidden="true" />
    }
    return <Building2 className="size-4" aria-hidden="true" />
  }

  /**
   * Handle tenant switch
   */
  const handleSwitchTenant = (tenantId: string | null) => {
    // Don't switch if already on this tenant
    if (tenantId === activeTenantId) {
      return
    }

    startTransition(async () => {
      const result = await switchTenant({ tenantId })
      if (result.success) {
        router.refresh()
      }
      // Error handling could be improved with toast notifications
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 px-3"
          disabled={isPending}
          aria-label={`Current context: ${getCurrentContextName()}. Click to switch context.`}
        >
          {getCurrentContextIcon()}
          <span className="truncate max-w-[150px]">
            {isPending ? 'Switching...' : getCurrentContextName()}
          </span>
          <ChevronDown
            className={cn(
              'size-4 text-muted-foreground transition-transform duration-200',
              isPending && 'animate-pulse'
            )}
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[240px]">
        {/* Personal Mode Section */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Personal Account
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => handleSwitchTenant(null)}
            disabled={isPending}
            className="cursor-pointer"
          >
            <User className="size-4" aria-hidden="true" />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="truncate font-medium">Personal</span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
            {activeTenantId === null && (
              <Check
                className="size-4 text-primary shrink-0"
                aria-label="Currently active"
              />
            )}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {/* Tenants Section */}
        {tenants.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Tenants
              </DropdownMenuLabel>
              {tenants.map(({ tenant, membership }) => (
                <DropdownMenuItem
                  key={tenant.id}
                  onClick={() => handleSwitchTenant(tenant.id)}
                  disabled={isPending}
                  className="cursor-pointer"
                >
                  {tenant.type === 'household' ? (
                    <Home className="size-4" aria-hidden="true" />
                  ) : (
                    <Building2 className="size-4" aria-hidden="true" />
                  )}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="truncate font-medium">{tenant.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {membership.role}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 capitalize shrink-0"
                  >
                    {tenant.type}
                  </Badge>
                  {activeTenantId === tenant.id && (
                    <Check
                      className="size-4 text-primary shrink-0"
                      aria-label="Currently active"
                    />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}

        {/* Create New Section */}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Create New
          </DropdownMenuLabel>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/tenants/new?type=household">
              <Plus className="size-4" aria-hidden="true" />
              <span>Create Household</span>
              <Home
                className="ml-auto size-4 text-muted-foreground"
                aria-hidden="true"
              />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/tenants/new?type=organization">
              <Plus className="size-4" aria-hidden="true" />
              <span>Create Organization</span>
              <Building2
                className="ml-auto size-4 text-muted-foreground"
                aria-hidden="true"
              />
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
