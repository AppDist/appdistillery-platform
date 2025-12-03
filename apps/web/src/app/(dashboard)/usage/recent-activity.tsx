import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { UsageEvent } from '@appdistillery/core/ledger'
import { cn } from '@/lib/utils'

interface RecentActivityProps {
  events: UsageEvent[]
  className?: string
}

/**
 * Formats a date to a relative or absolute string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Extracts module name from action (e.g., "agency:scope:generate" -> "agency")
 */
function getModuleFromAction(action: string): string {
  const parts = action.split(':')
  return parts[0] ?? action
}

/**
 * Formats action name for display (e.g., "agency:scope:generate" -> "scope:generate")
 */
function formatActionDisplay(action: string): string {
  const parts = action.split(':')
  if (parts.length >= 3) {
    return `${parts[1]}:${parts[2]}`
  }
  return action
}

/**
 * Get badge variant based on module
 */
function getModuleBadgeVariant(
  module: string
): 'default' | 'secondary' | 'outline' {
  switch (module.toLowerCase()) {
    case 'agency':
      return 'default'
    case 'core':
      return 'secondary'
    default:
      return 'outline'
  }
}

/**
 * Recent activity table showing usage events
 */
export function RecentActivity({ events, className }: RecentActivityProps) {
  const hasEvents = events.length > 0

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest AI operations and their resource consumption
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasEvents ? (
          <div className="overflow-x-auto -mx-6">
            <div className="min-w-full inline-block align-middle px-6">
              <Table>
                <caption className="sr-only">
                  Recent AI usage activity showing time, action, tokens, units, and duration
                </caption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-36">Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="text-right w-24">Tokens</TableHead>
                    <TableHead className="text-right w-24">Units</TableHead>
                    <TableHead className="text-right w-24 hidden sm:table-cell">
                      Duration
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => {
                    const moduleName = getModuleFromAction(event.action)
                    return (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          <time
                            dateTime={event.createdAt}
                            title={new Date(event.createdAt).toLocaleString()}
                          >
                            {formatDate(event.createdAt)}
                          </time>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={getModuleBadgeVariant(moduleName)}>
                              {moduleName}
                            </Badge>
                            <span className="text-sm text-muted-foreground font-mono">
                              {formatActionDisplay(event.action)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {(event.tokensTotal ?? 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {event.units.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono hidden sm:table-cell">
                          {event.durationMs ? `${event.durationMs}ms` : '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground text-sm">
              No activity recorded yet
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Usage events will appear here after using AI features
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
