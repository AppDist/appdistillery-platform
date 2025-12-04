'use client'

import { ReactNode } from 'react'
import { ErrorBoundary } from './error-boundary'
import { ErrorFallback } from './error-fallback'

interface DashboardErrorBoundaryProps {
  children: ReactNode
}

/**
 * Error boundary wrapper for dashboard pages.
 * Provides context-specific error handling for the dashboard area.
 */
export function DashboardErrorBoundary({
  children,
}: DashboardErrorBoundaryProps) {
  return (
    <ErrorBoundary
      context="Dashboard"
      fallbackRender={({ error, resetError }) => (
        <ErrorFallback
          error={error}
          resetError={resetError}
          className="min-h-[calc(100vh-56px)]"
        />
      )}
    >
      {children}
    </ErrorBoundary>
  )
}
