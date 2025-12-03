'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserSupabaseClient, getAuthErrorMessage } from '@appdistillery/core/auth/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Basic validation
    if (!email.trim()) {
      setError('Email is required')
      setIsLoading(false)
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createBrowserSupabaseClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/reset-password`,
      })

      if (resetError) {
        setError(getAuthErrorMessage(resetError))
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>
            We sent a password reset link to{' '}
            <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click the link in your email to reset your password. The link will expire in 1 hour.
          </p>
        </CardContent>
        <CardFooter>
          <p className="text-center text-sm text-muted-foreground w-full">
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Forgot password</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a reset link
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div
              id="error-message"
              role="alert"
              aria-live="polite"
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={isLoading}
              aria-describedby={error ? 'error-message' : undefined}
              className={cn(error && 'border-destructive')}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Sending reset link...' : 'Send reset link'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
