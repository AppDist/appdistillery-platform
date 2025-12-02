import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Zap, Hash, TrendingUp } from 'lucide-react'
import type { UsageSummary } from '@appdistillery/core/ledger'
import { cn } from '@/lib/utils'

interface UsageSummaryCardsProps {
  summary: UsageSummary
  className?: string
}

/**
 * Formats large numbers with K/M suffixes
 */
function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  return value.toLocaleString()
}

/**
 * Usage summary cards showing key metrics
 * - Total tokens consumed
 * - Brain Units used
 * - Total events
 * - Top action
 */
export function UsageSummaryCards({
  summary,
  className,
}: UsageSummaryCardsProps) {
  // Determine the top action by token usage
  const topAction = summary.byAction[0]

  return (
    <div
      className={cn(
        'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {/* Total Tokens Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Tokens
          </CardTitle>
          <Zap
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold">
            <span aria-label={`${summary.totalTokens.toLocaleString()} tokens`}>
              {formatNumber(summary.totalTokens)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Input + output tokens
          </p>
        </CardContent>
      </Card>

      {/* Brain Units Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Brain Units
          </CardTitle>
          <Activity
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold">
            <span aria-label={`${summary.totalUnits.toLocaleString()} Brain Units`}>
              {formatNumber(summary.totalUnits)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Credits consumed
          </p>
        </CardContent>
      </Card>

      {/* Total Events Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Events
          </CardTitle>
          <Hash
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold">
            <span aria-label={`${summary.eventCount.toLocaleString()} events`}>
              {formatNumber(summary.eventCount)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            AI operations
          </p>
        </CardContent>
      </Card>

      {/* Top Action Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Top Action
          </CardTitle>
          <TrendingUp
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold truncate" title={topAction?.action}>
            {topAction ? formatActionName(topAction.action) : 'None'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {topAction
              ? `${formatNumber(topAction.count)} calls`
              : 'No activity yet'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Formats action name (e.g., "agency:scope:generate" -> "Scope Generate")
 */
function formatActionName(action: string): string {
  const parts = action.split(':')
  if (parts.length < 3) return action

  // Take domain and verb, capitalize each word
  const domain = parts[1] ?? ''
  const verb = parts[2] ?? ''
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  return `${capitalize(domain)} ${capitalize(verb)}`
}
