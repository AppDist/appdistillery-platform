import { Suspense } from 'react'
import { CreateHouseholdForm } from '@/components/tenants/create-household-form'
import { CreateOrganizationForm } from '@/components/tenants/create-organization-form'

interface PageProps {
  searchParams: Promise<{ type?: string }>
}

/**
 * New Tenant Page
 *
 * Displays the appropriate creation form based on the `type` query parameter:
 * - ?type=household -> CreateHouseholdForm
 * - ?type=organization -> CreateOrganizationForm
 */
export default async function NewTenantPage({ searchParams }: PageProps) {
  const params = await searchParams
  const type = params.type

  return (
    <div className="container max-w-2xl py-8 px-4 md:px-6">
      <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
        {type === 'household' ? (
          <CreateHouseholdForm />
        ) : type === 'organization' ? (
          <CreateOrganizationForm />
        ) : (
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">Create New Tenant</h1>
            <p className="text-muted-foreground mb-6">
              Please select a tenant type from the menu.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/tenants/new?type=household"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                Create Household
              </a>
              <a
                href="/tenants/new?type=organization"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Create Organization
              </a>
            </div>
          </div>
        )}
      </Suspense>
    </div>
  )
}
