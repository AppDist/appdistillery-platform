'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Basic validation
    if (!password) {
      setError('Password is required')
      setIsLoading(false)
      return
    }

    // Validate password strength
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      setIsLoading(false)
      return
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createBrowserSupabaseClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(getAuthErrorMessage(updateError))
        setIsLoading(false)
        return
      }

      setIsSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Password reset successful</CardTitle>
          <CardDescription>
            Your password has been updated successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You will be redirected to the sign in page shortly.
          </p>
        </CardContent>
        <CardFooter>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Sign in now
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
        <CardDescription>
          Enter your new password below
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
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={isLoading}
              aria-describedby={error ? 'error-message' : 'password-hint'}
              className={cn(error && 'border-destructive')}
            />
            <p id="password-hint" className="text-xs text-muted-foreground">
              At least 8 characters with uppercase, lowercase, and number
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
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
            {isLoading ? 'Resetting password...' : 'Reset password'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
