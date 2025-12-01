'use client'

import { Button } from '@/components/ui/button'
import { signOut } from '@/app/(auth)/actions'
import { useTransition } from 'react'

export function SignOutButton() {
  const [isPending, startTransition] = useTransition()

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut()
    })
  }

  return (
    <Button
      variant="ghost"
      onClick={handleSignOut}
      disabled={isPending}
    >
      {isPending ? 'Signing out...' : 'Sign out'}
    </Button>
  )
}
