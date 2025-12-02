'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { UsageEvent } from '@appdistillery/core/ledger'
import { cn } from '@/lib/utils'

interface UsageChartProps {
  events: UsageEvent[]
  period: 'day' | 'week' | 'month'
  className?: string
}

interface ChartDataPoint {
  date: string
  label: string
  tokens: number
  units: number
}

/**
 * Aggregates usage events by time period for chart display
 */
function aggregateByPeriod(
  events: UsageEvent[],
  period: 'day' | 'week' | 'month'
): ChartDataPoint[] {
  const dataMap = new Map<string, { tokens: number; units: number }>()

  // Group events by date key
  for (const event of events) {
    const date = new Date(event.createdAt)
    let dateKey: string

    if (period === 'day') {
      // Group by hour
      dateKey = `${date.getHours().toString().padStart(2, '0')}:00`
    } else if (period === 'week') {
      // Group by day of week
      dateKey = date.toISOString().split('T')[0] ?? date.toISOString()
    } else {
      // Group by day of month
      dateKey = date.toISOString().split('T')[0] ?? date.toISOString()
    }

    const existing = dataMap.get(dateKey) ?? { tokens: 0, units: 0 }
    dataMap.set(dateKey, {
      tokens: existing.tokens + (event.tokensTotal ?? 0),
      units: existing.units + event.units,
    })
  }

  // Convert to array and sort
  const result: ChartDataPoint[] = []
  const sortedEntries = Array.from(dataMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  )

  for (const [date, data] of sortedEntries) {
    const dateObj = period === 'day' ? null : new Date(date)
    const label =
      period === 'day'
        ? date
        : period === 'week'
          ? dateObj?.toLocaleDateString('en-US', { weekday: 'short' }) ?? date
          : dateObj?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ?? date

    result.push({
      date,
      label,
      tokens: data.tokens,
      units: data.units,
    })
  }

  return result
}

/**
 * Custom tooltip component for the chart
 */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; color: string }>
  label?: string
}) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium mb-2">{label}</p>
      {payload.map((entry, index) => (
        <p
          key={index}
          className="text-sm"
          style={{ color: entry.color }}
        >
          {entry.dataKey === 'tokens' ? 'Tokens' : 'Brain Units'}:{' '}
          <span className="font-semibold">{entry.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  )
}

/**
 * Usage trend chart showing tokens and units over time
 */
export function UsageChart({ events, period, className }: UsageChartProps) {
  const chartData = useMemo(
    () => aggregateByPeriod(events, period),
    [events, period]
  )

  const periodLabel = {
    day: 'Today',
    week: 'This Week',
    month: 'This Month',
  }[period]

  const hasData = chartData.length > 0

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Usage Trend</CardTitle>
        <CardDescription>
          Token and Brain Unit consumption for {periodLabel.toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div
            className="h-64 md:h-80"
            role="img"
            aria-label={`Usage trend chart for ${periodLabel.toLowerCase()} showing tokens and Brain Units over time`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-chart-1)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-chart-1)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="colorUnits" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-chart-2)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-chart-2)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  tickFormatter={(value) =>
                    value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value
                  }
                  width={50}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: 'var(--color-border)', strokeDasharray: '3 3' }}
                />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTokens)"
                />
                <Area
                  type="monotone"
                  dataKey="units"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUnits)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 md:h-80 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              No usage data available for this period
            </p>
          </div>
        )}

        {/* Legend */}
        {hasData && (
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div
                className="size-3 rounded-full"
                style={{ backgroundColor: 'var(--color-chart-1)' }}
                aria-hidden="true"
              />
              <span className="text-sm text-muted-foreground">Tokens</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="size-3 rounded-full"
                style={{ backgroundColor: 'var(--color-chart-2)' }}
                aria-hidden="true"
              />
              <span className="text-sm text-muted-foreground">Brain Units</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
