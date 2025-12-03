'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
// Import client-safe auth utilities (no server-only code)
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

// Validate internal URL to prevent open redirects
function isInternalUrl(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//')
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  const redirectTo = isInternalUrl(redirect) ? redirect : '/dashboard'
  const urlError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Display error from URL (e.g., from auth callback)
  useEffect(() => {
    if (urlError) {
      setError(urlError)
    }
  }, [urlError])

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

    if (!password) {
      setError('Password is required')
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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(getAuthErrorMessage(signInError))
        setIsLoading(false)
        return
      }

      router.push(redirectTo)
      router.refresh()
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
        <CardDescription>
          Enter your email and password to access your account
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
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={isLoading}
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
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
          <div className="flex flex-col gap-2">
            <Link
              href="/forgot-password"
              className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Forgot your password?
            </Link>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
