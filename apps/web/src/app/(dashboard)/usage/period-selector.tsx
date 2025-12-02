'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Period } from '@appdistillery/core/ledger'

interface PeriodSelectorProps {
  currentPeriod: Period
}

/**
 * Period selector for filtering usage data
 * Updates URL search params to maintain state
 */
export function PeriodSelector({ currentPeriod }: PeriodSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePeriodChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('period', value)
      router.push(`/usage?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="period-select"
        className="text-sm font-medium text-muted-foreground"
      >
        Period:
      </label>
      <Select value={currentPeriod} onValueChange={handlePeriodChange}>
        <SelectTrigger id="period-select" className="w-32">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Today</SelectItem>
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="month">This Month</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
