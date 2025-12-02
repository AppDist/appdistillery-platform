import { Suspense } from 'react'
import { getSessionContext } from '@appdistillery/core/auth'
import {
  getUsageSummary,
  getUsageHistory,
  type Period,
} from '@appdistillery/core/ledger'
import { redirect } from 'next/navigation'
import { UsageSummaryCards } from './usage-summary'
import { UsageChart } from './usage-chart'
import { RecentActivity } from './recent-activity'
import { PeriodSelector } from './period-selector'

interface UsagePageProps {
  searchParams: Promise<{ period?: string }>
}

/**
 * Validates and returns the period from search params
 */
function validatePeriod(periodParam?: string): Period {
  if (periodParam === 'day' || periodParam === 'week' || periodParam === 'month') {
    return periodParam
  }
  return 'month' // Default to month view
}

/**
 * Loading skeleton for usage summary cards
 */
function UsageSummarySkeleton() {
  return (
    <div
      className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      role="status"
      aria-label="Loading usage summary"
    >
      <span className="sr-only">Loading usage statistics...</span>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border bg-card p-6 animate-pulse"
          aria-hidden="true"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="size-4 bg-muted rounded" />
          </div>
          <div className="h-8 w-20 bg-muted rounded mb-2" />
          <div className="h-3 w-28 bg-muted rounded" />
        </div>
      ))}
    </div>
  )
}

/**
 * Loading skeleton for chart
 */
function ChartSkeleton() {
  return (
    <div
      className="rounded-xl border bg-card animate-pulse"
      role="status"
      aria-label="Loading usage chart"
    >
      <span className="sr-only">Loading usage trend chart...</span>
      <div className="p-6" aria-hidden="true">
        <div className="h-5 w-32 bg-muted rounded mb-2" />
        <div className="h-4 w-64 bg-muted rounded" />
      </div>
      <div className="px-6 pb-6" aria-hidden="true">
        <div className="h-64 md:h-80 bg-muted rounded" />
      </div>
    </div>
  )
}

/**
 * Loading skeleton for activity table
 */
function ActivitySkeleton() {
  return (
    <div
      className="rounded-xl border bg-card animate-pulse"
      role="status"
      aria-label="Loading recent activity"
    >
      <span className="sr-only">Loading recent activity data...</span>
      <div className="p-6" aria-hidden="true">
        <div className="h-5 w-32 bg-muted rounded mb-2" />
        <div className="h-4 w-64 bg-muted rounded" />
      </div>
      <div className="px-6 pb-6" aria-hidden="true">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Usage dashboard content - fetches and displays all data
 */
async function UsageDashboardContent({ period }: { period: Period }) {
  // Get session - layout already ensures authentication
  const session = await getSessionContext()
  if (!session) {
    redirect('/login')
  }

  // Get tenant ID from session (null for Personal mode)
  const tenantId = session.tenant?.id ?? null

  // Fetch usage data in parallel
  const [summaryResult, historyResult] = await Promise.all([
    getUsageSummary(tenantId, period),
    getUsageHistory({
      tenantId,
      limit: 50, // Show last 50 events
    }),
  ])

  // Handle errors gracefully
  const summary = summaryResult.success
    ? summaryResult.data
    : { totalTokens: 0, totalUnits: 0, eventCount: 0, byAction: [] }

  const events = historyResult.success ? historyResult.data : []

  return (
    <>
      {/* Summary Cards */}
      <UsageSummaryCards summary={summary} />

      {/* Chart and Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UsageChart events={events} period={period} />
        <RecentActivity events={events.slice(0, 10)} />
      </div>
    </>
  )
}

/**
 * Usage Dashboard Page
 *
 * Displays organization's AI usage statistics including:
 * - Summary cards with key metrics
 * - Usage trend chart
 * - Recent activity table
 */
export default async function UsagePage({ searchParams }: UsagePageProps) {
  const params = await searchParams
  const period = validatePeriod(params.period)

  return (
    <div className="container px-4 py-8 md:px-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usage Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your AI usage and resource consumption
          </p>
        </div>
        <Suspense fallback={<div className="h-9 w-32 bg-muted rounded animate-pulse" />}>
          <PeriodSelector currentPeriod={period} />
        </Suspense>
      </div>

      {/* Dashboard Content */}
      <div className="space-y-6">
        <Suspense
          fallback={
            <>
              <UsageSummarySkeleton />
              <div className="grid gap-6 lg:grid-cols-2">
                <ChartSkeleton />
                <ActivitySkeleton />
              </div>
            </>
          }
        >
          <UsageDashboardContent period={period} />
        </Suspense>
      </div>
    </div>
  )
}

/**
 * Page metadata
 */
export const metadata = {
  title: 'Usage Dashboard | AppDistillery',
  description: 'Monitor your AI usage and resource consumption',
}
