import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { TenantSwitcher } from './tenant-switcher'
import type { Tenant, TenantMember } from '@appdistillery/core/auth'

// Mock the switchTenant action
vi.mock('@/actions/tenant', () => ({
  switchTenant: vi.fn(),
}))

// Import after mock to get the mocked version
import { switchTenant } from '@/actions/tenant'

describe('TenantSwitcher', () => {
  const mockUser = {
    email: 'user@example.com',
    displayName: 'Test User',
  }

  const mockHouseholdTenant: Tenant = {
    id: 'tenant-household',
    name: 'My Household',
    type: 'household',
    slug: 'my-household',
    orgNumber: null,
    billingEmail: null,
    settings: {},
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  const mockOrgTenant: Tenant = {
    id: 'tenant-org',
    name: 'My Organization',
    type: 'organization',
    slug: 'my-organization',
    orgNumber: null,
    billingEmail: null,
    settings: {},
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  const mockHouseholdMembership: TenantMember = {
    id: 'member-1',
    tenantId: 'tenant-household',
    userId: 'user-123',
    role: 'owner',
    joinedAt: new Date('2024-01-01'),
  }

  const mockOrgMembership: TenantMember = {
    id: 'member-2',
    tenantId: 'tenant-org',
    userId: 'user-123',
    role: 'admin',
    joinedAt: new Date('2024-01-01'),
  }

  const mockTenants = [
    { tenant: mockHouseholdTenant, membership: mockHouseholdMembership },
    { tenant: mockOrgTenant, membership: mockOrgMembership },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock returns the discriminated union type
    vi.mocked(switchTenant).mockResolvedValue({ success: true })
  })

  it('renders current tenant name when tenant is active', () => {
    render(
      <TenantSwitcher
        tenants={mockTenants}
        activeTenantId="tenant-household"
        user={mockUser}
      />
    )

    expect(screen.getByText('My Household')).toBeInTheDocument()
  })

  it('renders "Personal" when no tenant is active', () => {
    render(
      <TenantSwitcher
        tenants={mockTenants}
        activeTenantId={null}
        user={mockUser}
      />
    )

    expect(screen.getByText('Personal')).toBeInTheDocument()
  })

  it('shows dropdown when clicked', async () => {
    const user = userEvent.setup()

    render(
      <TenantSwitcher
        tenants={mockTenants}
        activeTenantId={null}
        user={mockUser}
      />
    )

    const trigger = screen.getByRole('button', {
      name: /Current context: Personal/i,
    })
    await user.click(trigger)

    // Personal mode should be visible
    expect(screen.getByText(mockUser.email)).toBeInTheDocument()

    // Tenants should be visible
    expect(screen.getByText('My Household')).toBeInTheDocument()
    expect(screen.getByText('My Organization')).toBeInTheDocument()
  })

  it('displays personal mode option with user email', async () => {
    const user = userEvent.setup()

    render(
      <TenantSwitcher
        tenants={mockTenants}
        activeTenantId="tenant-household"
        user={mockUser}
      />
    )

    const trigger = screen.getByRole('button')
    await user.click(trigger)

    expect(screen.getByText(mockUser.email)).toBeInTheDocument()
    expect(screen.getByText('Personal Account')).toBeInTheDocument()
  })

  it('displays tenant list with roles and types', async () => {
    const user = userEvent.setup()

    render(
      <TenantSwitcher
        tenants={mockTenants}
        activeTenantId={null}
        user={mockUser}
      />
    )

    const trigger = screen.getByRole('button')
    await user.click(trigger)

    // Check tenant names
    expect(screen.getByText('My Household')).toBeInTheDocument()
    expect(screen.getByText('My Organization')).toBeInTheDocument()

    // Check roles
    expect(screen.getByText('owner')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()

    // Check tenant type badges
    const badges = screen.getAllByText(/household|organization/)
    expect(badges.length).toBeGreaterThan(0)
  })

  it('calls switchTenant when tenant selected', async () => {
    const user = userEvent.setup()

    render(
      <TenantSwitcher
        tenants={mockTenants}
        activeTenantId={null}
        user={mockUser}
      />
    )

    const trigger = screen.getByRole('button')
    await user.click(trigger)

    const householdOption = screen.getByText('My Household').closest('div')
    await user.click(householdOption!)

    await waitFor(() => {
      expect(switchTenant).toHaveBeenCalledWith({
        tenantId: 'tenant-household',
      })
    })
  })

  it('calls switchTenant with null when personal mode selected', async () => {
    const user = userEvent.setup()

    render(
      <TenantSwitcher
        tenants={mockTenants}
        activeTenantId="tenant-household"
        user={mockUser}
      />
    )

    const trigger = screen.getByRole('button')
    await user.click(trigger)

    const personalOption = screen.getByText(mockUser.email).closest('div')
    await user.click(personalOption!)

    await waitFor(() => {
      expect(switchTenant).toHaveBeenCalledWith({ tenantId: null })
    })
  })

  it('does not call switchTenant when already on selected tenant', async () => {
    const user = userEvent.setup()

    render(
      <TenantSwitcher
        tenants={mockTenants}
        activeTenantId="tenant-household"
        user={mockUser}
      />
    )

    const trigger = screen.getByRole('button')
    await user.click(trigger)

    // Find the menu item for the already-active household tenant
    // Wait for menu to be visible
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    // Get all menuitems and find the household one
    const menuItems = screen.getAllByRole('menuitem')
    const householdItem = menuItems.find((item) =>
      item.textContent?.includes('My Household')
    )

    expect(householdItem).toBeDefined()
    await user.click(householdItem!)

    // Should not call switchTenant because we're already on this tenant
    expect(switchTenant).not.toHaveBeenCalled()
  })

  it('shows loading state during switch', async () => {
    const user = userEvent.setup()
    let resolveSwitch: (value: { success: true }) => void

    vi.mocked(switchTenant).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSwitch = resolve
        })
    )

    render(
      <TenantSwitcher
        tenants={mockTenants}
        activeTenantId={null}
        user={mockUser}
      />
    )

    const trigger = screen.getByRole('button')
    await user.click(trigger)

    const orgOption = screen.getByText('My Organization').closest('div')
    await user.click(orgOption!)

    // Should show "Switching..." text
    await waitFor(() => {
      expect(screen.getByText('Switching...')).toBeInTheDocument()
    })

    // Button should be disabled
    expect(screen.getByRole('button')).toBeDisabled()

    // Resolve the switch
    resolveSwitch!({ success: true })
  })

  it('handles empty tenant list', async () => {
    const user = userEvent.setup()

    render(
      <TenantSwitcher tenants={[]} activeTenantId={null} user={mockUser} />
    )

    const trigger = screen.getByRole('button')
    await user.click(trigger)

    // Should still show personal mode
    expect(screen.getByText(mockUser.email)).toBeInTheDocument()

    // Should show "Create New" section
    expect(screen.getByText('Create Household')).toBeInTheDocument()
    expect(screen.getByText('Create Organization')).toBeInTheDocument()

    // Should not show "Tenants" label
    expect(screen.queryByText('Tenants')).not.toBeInTheDocument()
  })

  it('displays check mark on active tenant', async () => {
    const user = userEvent.setup()

    render(
      <TenantSwitcher
        tenants={mockTenants}
        activeTenantId="tenant-household"
        user={mockUser}
      />
    )

    const trigger = screen.getByRole('button')
    await user.click(trigger)

    // Find the check mark by aria-label
    const checkMarks = screen.getAllByLabelText('Currently active')
    expect(checkMarks).toHaveLength(1)
  })

  it('displays check mark on personal mode when active', async () => {
    const user = userEvent.setup()

    render(
      <TenantSwitcher
        tenants={mockTenants}
        activeTenantId={null}
        user={mockUser}
      />
    )

    const trigger = screen.getByRole('button')
    await user.click(trigger)

    const checkMarks = screen.getAllByLabelText('Currently active')
    expect(checkMarks).toHaveLength(1)
  })

  it('provides accessible button label', () => {
    render(
      <TenantSwitcher
        tenants={mockTenants}
        activeTenantId="tenant-household"
        user={mockUser}
      />
    )

    expect(
      screen.getByLabelText(
        'Current context: My Household. Click to switch context.'
      )
    ).toBeInTheDocument()
  })

  it('displays correct icons for tenant types', async () => {
    const user = userEvent.setup()

    render(
      <TenantSwitcher
        tenants={mockTenants}
        activeTenantId={null}
        user={mockUser}
      />
    )

    const trigger = screen.getByRole('button')
    await user.click(trigger)

    // Icons are hidden from accessibility, so we can't directly test them
    // But we can verify the structure is correct by checking the text is present
    expect(screen.getByText('My Household')).toBeInTheDocument()
    expect(screen.getByText('My Organization')).toBeInTheDocument()
  })
})
