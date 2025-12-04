// Size-justified: Complex visualization component with multiple
// chart types, period switching, and responsive layout
'use client'

import { useMemo, useId } from 'react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
 * Accessible legend item with pattern and color
 */
function LegendItem({
  label,
  patternId,
  strokeColor,
  strokeDasharray,
}: {
  label: string
  patternId: string
  strokeColor: string
  strokeDasharray?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <svg
        width="24"
        height="16"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="0"
          y="0"
          width="24"
          height="16"
          fill={`url(#${patternId})`}
          stroke={strokeColor}
          strokeWidth="2"
          strokeDasharray={strokeDasharray}
          rx="2"
        />
      </svg>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}

/**
 * Accessible data table for screen readers
 */
function AccessibleDataTable({
  data,
  periodLabel,
}: {
  data: ChartDataPoint[]
  periodLabel: string
}) {
  const totals = data.reduce(
    (acc, point) => ({
      tokens: acc.tokens + point.tokens,
      units: acc.units + point.units,
    }),
    { tokens: 0, units: 0 }
  )

  return (
    <div className="sr-only">
      <h3>Usage data table for {periodLabel}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time Period</TableHead>
            <TableHead>Tokens</TableHead>
            <TableHead>Brain Units</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((point) => (
            <TableRow key={point.date}>
              <TableCell>{point.label}</TableCell>
              <TableCell>{point.tokens.toLocaleString()}</TableCell>
              <TableCell>{point.units.toLocaleString()}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell>
              <strong>Total</strong>
            </TableCell>
            <TableCell>
              <strong>{totals.tokens.toLocaleString()}</strong>
            </TableCell>
            <TableCell>
              <strong>{totals.units.toLocaleString()}</strong>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

/**
 * Usage trend chart showing tokens and units over time
 * Accessible to colorblind users via patterns and stroke styles
 */
export function UsageChart({ events, period, className }: UsageChartProps) {
  const chartId = useId()
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

  // Generate unique IDs for patterns to avoid conflicts
  const tokensPatternId = `tokens-pattern-${chartId.replace(/:/g, '')}`
  const unitsPatternId = `units-pattern-${chartId.replace(/:/g, '')}`
  const tokensGradientId = `tokens-gradient-${chartId.replace(/:/g, '')}`
  const unitsGradientId = `units-gradient-${chartId.replace(/:/g, '')}`
  const legendTokensPatternId = `legend-tokens-${chartId.replace(/:/g, '')}`
  const legendUnitsPatternId = `legend-units-${chartId.replace(/:/g, '')}`

  // Calculate totals for aria-label
  const totals = hasData
    ? chartData.reduce(
        (acc, point) => ({
          tokens: acc.tokens + point.tokens,
          units: acc.units + point.units,
        }),
        { tokens: 0, units: 0 }
      )
    : { tokens: 0, units: 0 }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle id={`${chartId}-title`}>Usage Trend</CardTitle>
        <CardDescription id={`${chartId}-desc`}>
          Token and Brain Unit consumption for {periodLabel.toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <>
            {/* SVG patterns for legend (outside chart) */}
            <svg width="0" height="0" aria-hidden="true">
              <defs>
                {/* Tokens pattern: diagonal lines */}
                <pattern
                  id={legendTokensPatternId}
                  patternUnits="userSpaceOnUse"
                  width="6"
                  height="6"
                  patternTransform="rotate(45)"
                >
                  <rect
                    width="6"
                    height="6"
                    fill="var(--color-chart-1)"
                    fillOpacity="0.3"
                  />
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="6"
                    stroke="var(--color-chart-1)"
                    strokeWidth="2"
                    strokeOpacity="0.6"
                  />
                </pattern>
                {/* Units pattern: dots */}
                <pattern
                  id={legendUnitsPatternId}
                  patternUnits="userSpaceOnUse"
                  width="6"
                  height="6"
                >
                  <rect
                    width="6"
                    height="6"
                    fill="var(--color-chart-2)"
                    fillOpacity="0.3"
                  />
                  <circle
                    cx="3"
                    cy="3"
                    r="1.5"
                    fill="var(--color-chart-2)"
                    fillOpacity="0.7"
                  />
                </pattern>
              </defs>
            </svg>

            <div
              className="h-64 md:h-80"
              role="figure"
              aria-labelledby={`${chartId}-title`}
              aria-describedby={`${chartId}-desc`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  aria-label={`Area chart showing usage over ${periodLabel.toLowerCase()}. Total tokens: ${totals.tokens.toLocaleString()}. Total Brain Units: ${totals.units.toLocaleString()}.`}
                >
                  <defs>
                    {/* Tokens pattern: diagonal lines for colorblind accessibility */}
                    <pattern
                      id={tokensPatternId}
                      patternUnits="userSpaceOnUse"
                      width="6"
                      height="6"
                      patternTransform="rotate(45)"
                    >
                      <rect
                        width="6"
                        height="6"
                        fill="var(--color-chart-1)"
                        fillOpacity="0.15"
                      />
                      <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="6"
                        stroke="var(--color-chart-1)"
                        strokeWidth="1.5"
                        strokeOpacity="0.4"
                      />
                    </pattern>
                    {/* Units pattern: dots for colorblind accessibility */}
                    <pattern
                      id={unitsPatternId}
                      patternUnits="userSpaceOnUse"
                      width="6"
                      height="6"
                    >
                      <rect
                        width="6"
                        height="6"
                        fill="var(--color-chart-2)"
                        fillOpacity="0.15"
                      />
                      <circle
                        cx="3"
                        cy="3"
                        r="1"
                        fill="var(--color-chart-2)"
                        fillOpacity="0.5"
                      />
                    </pattern>
                    {/* Gradient overlays for depth */}
                    <linearGradient
                      id={tokensGradientId}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="white" stopOpacity={0} />
                      <stop offset="100%" stopColor="white" stopOpacity={0.5} />
                    </linearGradient>
                    <linearGradient
                      id={unitsGradientId}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="white" stopOpacity={0} />
                      <stop offset="100%" stopColor="white" stopOpacity={0.5} />
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
                    cursor={{
                      stroke: 'var(--color-border)',
                      strokeDasharray: '3 3',
                    }}
                  />
                  {/* Tokens area: solid stroke with diagonal line pattern */}
                  <Area
                    type="monotone"
                    dataKey="tokens"
                    name="Tokens"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#${tokensPatternId})`}
                    dot={{
                      r: 3,
                      fill: 'var(--color-chart-1)',
                      stroke: 'var(--color-background)',
                      strokeWidth: 1,
                    }}
                    activeDot={{
                      r: 5,
                      fill: 'var(--color-chart-1)',
                      stroke: 'var(--color-background)',
                      strokeWidth: 2,
                    }}
                  />
                  {/* Units area: dashed stroke with dot pattern */}
                  <Area
                    type="monotone"
                    dataKey="units"
                    name="Brain Units"
                    stroke="var(--color-chart-2)"
                    strokeWidth={2.5}
                    strokeDasharray="6 3"
                    fillOpacity={1}
                    fill={`url(#${unitsPatternId})`}
                    dot={{
                      r: 3,
                      fill: 'var(--color-background)',
                      stroke: 'var(--color-chart-2)',
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 5,
                      fill: 'var(--color-chart-2)',
                      stroke: 'var(--color-background)',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Accessible data table for screen readers */}
            <AccessibleDataTable data={chartData} periodLabel={periodLabel} />
          </>
        ) : (
          <div className="h-64 md:h-80 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              No usage data available for this period
            </p>
          </div>
        )}

        {/* Accessible Legend with patterns */}
        {hasData && (
          <div
            className="flex items-center justify-center gap-6 mt-4 pt-4 border-t"
            role="group"
            aria-label="Chart legend"
          >
            <LegendItem
              label="Tokens (solid line, diagonal pattern)"
              patternId={legendTokensPatternId}
              strokeColor="var(--color-chart-1)"
            />
            <LegendItem
              label="Brain Units (dashed line, dot pattern)"
              patternId={legendUnitsPatternId}
              strokeColor="var(--color-chart-2)"
              strokeDasharray="4 2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
