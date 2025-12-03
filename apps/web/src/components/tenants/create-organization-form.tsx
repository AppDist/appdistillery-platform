'use client'

import { useState, useEffect, useId } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createOrganization } from '@/actions/tenant'
import {
  CreateOrganizationSchema,
  type CreateOrganizationInput,
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
 * Convert a string to a URL-friendly slug
 * - Converts to lowercase
 * - Replaces spaces and underscores with hyphens
 * - Removes non-alphanumeric characters (except hyphens)
 * - Removes consecutive hyphens
 * - Removes leading/trailing hyphens
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric characters except hyphens
    .replace(/-+/g, '-') // Replace consecutive hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

export function CreateOrganizationForm() {
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
  } = useForm<CreateOrganizationInput>({
    resolver: zodResolver(CreateOrganizationSchema),
    defaultValues: {
      name: '',
      slug: '',
      orgNumber: '',
      billingEmail: '',
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

  const onSubmit = async (data: CreateOrganizationInput) => {
    setServerError(null)
    setIsLoading(true)

    try {
      const result = await createOrganization(data)

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
    <Card className="w-full max-w-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create Organization</CardTitle>
        <CardDescription>
          Set up your organization to start collaborating with your team
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Server Error Display */}
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

          {/* Required Fields */}
          <div className="space-y-4">
            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor={`${formId}-name`}>
                Organization Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`${formId}-name`}
                type="text"
                placeholder="Acme Corporation"
                {...register('name')}
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

            {/* URL Slug */}
            <div className="space-y-2">
              <Label htmlFor={`${formId}-slug`}>
                URL Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`${formId}-slug`}
                type="text"
                placeholder="acme-corp"
                value={slugValue}
                onChange={handleSlugChange}
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
                {slugValue ? (
                  <>
                    Your organization URL:{' '}
                    <span className="font-medium text-foreground">
                      appdistillery.com/o/{slugValue}
                    </span>
                  </>
                ) : (
                  'Lowercase letters, numbers, and hyphens only'
                )}
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
          </div>

          {/* Optional Fields Section */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Optional Details
                </span>
              </div>
            </div>

            {/* Organization Number */}
            <div className="space-y-2">
              <Label htmlFor={`${formId}-org-number`}>Organization Number</Label>
              <Input
                id={`${formId}-org-number`}
                type="text"
                placeholder="e.g., 123456789"
                {...register('orgNumber')}
                disabled={isLoading}
                aria-describedby={`${formId}-org-number-hint`}
              />
              <p
                id={`${formId}-org-number-hint`}
                className="text-sm text-muted-foreground"
              >
                Business registration number (VAT, EIN, etc.)
              </p>
            </div>

            {/* Billing Email */}
            <div className="space-y-2">
              <Label htmlFor={`${formId}-billing-email`}>Billing Email</Label>
              <Input
                id={`${formId}-billing-email`}
                type="email"
                placeholder="billing@acme.com"
                {...register('billingEmail')}
                disabled={isLoading}
                aria-invalid={!!errors.billingEmail}
                aria-describedby={
                  errors.billingEmail
                    ? `${formId}-billing-email-error`
                    : `${formId}-billing-email-hint`
                }
                className={cn(errors.billingEmail && 'border-destructive')}
              />
              {errors.billingEmail ? (
                <p
                  id={`${formId}-billing-email-error`}
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.billingEmail.message}
                </p>
              ) : (
                <p
                  id={`${formId}-billing-email-hint`}
                  className="text-sm text-muted-foreground"
                >
                  Where invoices and receipts should be sent
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            aria-describedby={hasAnyError ? errorId : undefined}
          >
            {isLoading ? 'Creating organization...' : 'Create Organization'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
