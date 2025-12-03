'use client'

import { useState, useId, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createHousehold } from '@/actions/tenant'
import { CreateHouseholdSchema } from '@appdistillery/core/auth/schemas'
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

/**
 * Converts a name to a URL-friendly slug
 * Lowercase, replace spaces/special chars with hyphens, remove consecutive hyphens
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Trim hyphens from start and end
}

export function CreateHouseholdForm() {
  const router = useRouter()
  const nameInputId = useId()
  const slugInputId = useId()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    slug?: string
  }>({})
  const [isLoading, setIsLoading] = useState(false)

  // Auto-generate slug from name unless user has manually edited it
  useEffect(() => {
    if (!isSlugManuallyEdited) {
      setSlug(slugify(name))
    }
  }, [name, isSlugManuallyEdited])

  /**
   * Validate a single field using the Zod schema
   */
  const validateField = (field: 'name' | 'slug', value: string): string | undefined => {
    const fieldSchema = CreateHouseholdSchema.shape[field]
    const result = fieldSchema.safeParse(value)
    if (!result.success) {
      return result.error.issues[0]?.message
    }
    return undefined
  }

  /**
   * Handle name input change with validation
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setName(value)
    setError(null)

    // Validate on change
    if (value.length > 0) {
      const nameError = validateField('name', value)
      setFieldErrors((prev) => ({ ...prev, name: nameError }))
    } else {
      setFieldErrors((prev) => ({ ...prev, name: undefined }))
    }
  }

  /**
   * Handle slug input change with validation
   */
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase()
    setSlug(value)
    setIsSlugManuallyEdited(true)
    setError(null)

    // Validate on change
    if (value.length > 0) {
      const slugError = validateField('slug', value)
      setFieldErrors((prev) => ({ ...prev, slug: slugError }))
    } else {
      setFieldErrors((prev) => ({ ...prev, slug: undefined }))
    }
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    // Client-side validation using Zod schema
    const validationResult = CreateHouseholdSchema.safeParse({ name, slug })

    if (!validationResult.success) {
      const errors: { name?: string; slug?: string } = {}
      for (const issue of validationResult.error.issues) {
        const field = issue.path[0] as 'name' | 'slug'
        if (!errors[field]) {
          errors[field] = issue.message
        }
      }
      setFieldErrors(errors)
      return
    }

    setIsLoading(true)

    try {
      const result = await createHousehold({ name, slug })

      if (!result.success) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      // Success - redirect to dashboard
      router.push('/dashboard')
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const hasNameError = !!fieldErrors.name
  const hasSlugError = !!fieldErrors.slug

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create a Household</CardTitle>
        <CardDescription>
          Set up your household for family members or roommates to share
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* General error message */}
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

          {/* Household Name Field */}
          <div className="space-y-2">
            <Label htmlFor={nameInputId}>Household Name</Label>
            <Input
              id={nameInputId}
              type="text"
              placeholder="e.g., Smith Family"
              value={name}
              onChange={handleNameChange}
              autoComplete="organization"
              disabled={isLoading}
              aria-invalid={hasNameError}
              aria-describedby={hasNameError ? `${nameInputId}-error` : undefined}
              className={cn(hasNameError && 'border-destructive')}
            />
            {hasNameError && (
              <p
                id={`${nameInputId}-error`}
                className="text-sm text-destructive"
                role="alert"
              >
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* URL Slug Field */}
          <div className="space-y-2">
            <Label htmlFor={slugInputId}>URL Slug</Label>
            <Input
              id={slugInputId}
              type="text"
              placeholder="e.g., smith-family"
              value={slug}
              onChange={handleSlugChange}
              autoComplete="off"
              disabled={isLoading}
              aria-invalid={hasSlugError}
              aria-describedby={`${slugInputId}-description${hasSlugError ? ` ${slugInputId}-error` : ''}`}
              className={cn(hasSlugError && 'border-destructive')}
            />
            <p
              id={`${slugInputId}-description`}
              className="text-sm text-muted-foreground"
            >
              Your household URL: appdistillery.com/h/{slug || 'your-slug'}
            </p>
            {hasSlugError && (
              <p
                id={`${slugInputId}-error`}
                className="text-sm text-destructive"
                role="alert"
              >
                {fieldErrors.slug}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating household...' : 'Create Household'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
