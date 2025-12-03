import Link from 'next/link'
import { Home, Building2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CreateHouseholdForm } from '@/components/tenants/create-household-form'
import { CreateOrganizationForm } from '@/components/tenants/create-organization-form'

interface CreateTenantPageProps {
  searchParams: Promise<{ type?: string }>
}

export default async function CreateTenantPage({
  searchParams,
}: CreateTenantPageProps) {
  const { type } = await searchParams
  const selectedType = type === 'household' || type === 'organization' ? type : null

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Dashboard
        </Link>

        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Create a New Space</h1>
          <p className="mt-2 text-muted-foreground">
            Choose the type of space that fits your needs
          </p>
        </div>

        {/* Content Area */}
        {selectedType === 'household' ? (
          <div className="mx-auto max-w-lg">
            <Link
              href="/settings/create-tenant"
              className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to selection
            </Link>
            <CreateHouseholdForm />
          </div>
        ) : selectedType === 'organization' ? (
          <div className="mx-auto max-w-lg">
            <Link
              href="/settings/create-tenant"
              className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to selection
            </Link>
            <CreateOrganizationForm />
          </div>
        ) : (
          <TenantTypeSelection />
        )}
      </div>
    </div>
  )
}

function TenantTypeSelection() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Household Card */}
      <Card className="relative flex flex-col">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Home className="size-8 text-primary" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">Household</CardTitle>
          <CardDescription>
            Perfect for families and shared living spaces
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-auto flex flex-col gap-4">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              Share expenses and budgets
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              Coordinate household tasks
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              Invite family members
            </li>
          </ul>
          <Button asChild className="w-full">
            <Link href="/settings/create-tenant?type=household">
              Create Household
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Organization Card */}
      <Card className="relative flex flex-col">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="size-8 text-primary" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">Organization</CardTitle>
          <CardDescription>
            For businesses, teams, and professional groups
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-auto flex flex-col gap-4">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              Manage team members and roles
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              Track business expenses
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              Generate invoices and reports
            </li>
          </ul>
          <Button asChild className="w-full">
            <Link href="/settings/create-tenant?type=organization">
              Create Organization
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
