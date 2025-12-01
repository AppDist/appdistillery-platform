'use server'

import { createServerSupabaseClient } from '@appdistillery/core/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signOut() {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Sign out error:', error.message)
    throw new Error('Failed to sign out')
  }

  // Revalidate all routes to clear cached data
  revalidatePath('/', 'layout')

  // Redirect to login page
  redirect('/login')
}
