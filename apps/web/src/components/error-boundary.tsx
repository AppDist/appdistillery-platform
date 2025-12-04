'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { clientLogger } from '@/lib/client-logger'
import { ErrorFallback, type ErrorFallbackProps } from './error-fallback'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Custom fallback component to render when an error occurs */
  fallback?: ReactNode
  /** Custom fallback render function with error details and reset capability */
  fallbackRender?: (props: ErrorFallbackProps) => ReactNode
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Optional context label for logging */
  context?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary component for catching React component errors.
 * Provides user-friendly error UI with reset capability.
 *
 * @example
 * // Basic usage with default fallback
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * @example
 * // With custom fallback render function
 * <ErrorBoundary
 *   fallbackRender={({ error, resetError }) => (
 *     <div>
 *       <p>Error: {error.message}</p>
 *       <button onClick={resetError}>Retry</button>
 *     </div>
 *   )}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, context = 'ErrorBoundary' } = this.props

    // Log error with structured client-safe logger
    clientLogger.error(context, 'React component error', {
      error: error.message,
      errorName: error.name,
      componentStack: errorInfo.componentStack,
      stack: error.stack,
    })

    // Call user-provided error handler if present
    onError?.(error, errorInfo)
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    const { hasError, error } = this.state
    const { children, fallback, fallbackRender } = this.props

    if (hasError && error) {
      // Priority: fallbackRender > fallback > default ErrorFallback
      if (fallbackRender) {
        return fallbackRender({ error, resetError: this.resetError })
      }

      if (fallback) {
        return fallback
      }

      return <ErrorFallback error={error} resetError={this.resetError} />
    }

    return children
  }
}
