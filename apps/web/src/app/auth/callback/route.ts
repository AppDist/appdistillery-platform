import { createServerSupabaseClient } from '@appdistillery/core/auth'
import { NextResponse } from 'next/server'

// Validate internal URL to prevent open redirects
function isInternalUrl(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//')
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const safeNext = isInternalUrl(next) ? next : '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    const errorMessage = errorDescription || error
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorMessage)}`
    )
  }

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      // Successful authentication - redirect to intended destination
      return NextResponse.redirect(`${origin}${safeNext}`)
    }

    // Exchange failed - redirect to login with error
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`
    )
  }

  // No code provided - redirect to login with error
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('Invalid authentication request.')}`
  )
}
