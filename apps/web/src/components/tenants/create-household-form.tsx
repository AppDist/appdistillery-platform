'use client'

import { useState, useId, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createHousehold } from '@/actions/tenant'
import {
  CreateHouseholdSchema,
  type CreateHouseholdInput,
} from '@appdistillery/core/auth/schemas'
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
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Generate unique IDs for accessibility
  const formId = useId()
  const errorId = `${formId}-error`

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateHouseholdInput>({
    resolver: zodResolver(CreateHouseholdSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  })

  // Watch name field to auto-generate slug
  const nameValue = watch('name')
  const slugValue = watch('slug')

  // Auto-generate slug from name when user hasn't manually edited the slug
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  useEffect(() => {
    if (!slugManuallyEdited && nameValue) {
      const generatedSlug = slugify(nameValue)
      setValue('slug', generatedSlug)
    }
  }, [nameValue, slugManuallyEdited, setValue])

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true)
    // Apply slugify to manual input as well to enforce format
    const value = slugify(e.target.value)
    setValue('slug', value)
  }

  const onSubmit = async (data: CreateHouseholdInput) => {
    setServerError(null)
    setIsLoading(true)

    try {
      const result = await createHousehold(data)

      if (!result.success) {
        setServerError(result.error)
        setIsLoading(false)
        return
      }

      // Success - redirect to dashboard
      router.push('/dashboard')
    } catch {
      setServerError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const hasAnyError = serverError || Object.keys(errors).length > 0

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create a Household</CardTitle>
        <CardDescription>
          Set up your household for family members or roommates to share
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Server error message */}
          {serverError && (
            <div
              id={errorId}
              role="alert"
              aria-live="polite"
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              {serverError}
            </div>
          )}

          {/* Household Name Field */}
          <div className="space-y-2">
            <Label htmlFor={`${formId}-name`}>Household Name</Label>
            <Input
              id={`${formId}-name`}
              type="text"
              placeholder="e.g., Smith Family"
              {...register('name')}
              autoComplete="organization"
              disabled={isLoading}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? `${formId}-name-error` : undefined}
              className={cn(errors.name && 'border-destructive')}
            />
            {errors.name && (
              <p
                id={`${formId}-name-error`}
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.name.message}
              </p>
            )}
          </div>

          {/* URL Slug Field */}
          <div className="space-y-2">
            <Label htmlFor={`${formId}-slug`}>URL Slug</Label>
            <Input
              id={`${formId}-slug`}
              type="text"
              placeholder="e.g., smith-family"
              value={slugValue}
              onChange={handleSlugChange}
              autoComplete="off"
              disabled={isLoading}
              aria-invalid={!!errors.slug}
              aria-describedby={
                errors.slug
                  ? `${formId}-slug-error ${formId}-slug-preview`
                  : `${formId}-slug-preview`
              }
              className={cn(errors.slug && 'border-destructive')}
            />
            <p
              id={`${formId}-slug-preview`}
              className="text-sm text-muted-foreground"
            >
              Your household URL: appdistillery.com/h/{slugValue || 'your-slug'}
            </p>
            {errors.slug && (
              <p
                id={`${formId}-slug-error`}
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.slug.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            aria-describedby={hasAnyError ? errorId : undefined}
          >
            {isLoading ? 'Creating household...' : 'Create Household'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
