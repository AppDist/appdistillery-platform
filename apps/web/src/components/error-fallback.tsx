'use client'

import { AlertCircle, RotateCcw, MailQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  className?: string
  showDetails?: boolean
  supportUrl?: string
}

function ErrorDetails({ error }: { error: Error }) {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <CardContent>
      <div className="rounded-lg bg-muted p-3">
        <p className="text-sm font-medium text-muted-foreground">Error Details</p>
        <p className="mt-1 break-words font-mono text-sm text-destructive">
          {error.name}: {error.message}
        </p>
        {isDev && error.stack && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              Stack trace
            </summary>
            <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </CardContent>
  )
}

/**
 * Default fallback UI for ErrorBoundary component.
 * Displays a user-friendly error message with retry and support options.
 */
export function ErrorFallback({
  error,
  resetError,
  className,
  showDetails = process.env.NODE_ENV === 'development',
  supportUrl,
}: ErrorFallbackProps) {
  return (
    <div
      className={cn('flex min-h-[400px] w-full items-center justify-center p-4', className)}
      role="alert"
      aria-live="assertive"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="size-6 text-destructive" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription>
            We encountered an unexpected error. Please try again or contact support if the problem
            persists.
          </CardDescription>
        </CardHeader>

        {showDetails && <ErrorDetails error={error} />}

        <CardFooter className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={resetError} className="w-full sm:w-auto" aria-label="Try again">
            <RotateCcw className="size-4" aria-hidden="true" />
            Try Again
          </Button>
          {supportUrl && (
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <a href={supportUrl} target="_blank" rel="noopener noreferrer">
                <MailQuestion className="size-4" aria-hidden="true" />
                Contact Support
              </a>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
