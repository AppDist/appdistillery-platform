'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { installModule, uninstallModule } from '@appdistillery/core/modules/actions'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ModuleToggleProps {
  moduleId: string
  moduleName: string
  isEnabled: boolean
}

/**
 * Client component for toggling module enabled/disabled state with confirmation
 */
export function ModuleToggle({ moduleId, moduleName, isEnabled }: ModuleToggleProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = () => {
    setError(null)
    startTransition(async () => {
      const result = isEnabled
        ? await uninstallModule({ moduleId })
        : await installModule({ moduleId })

      if (!result.success) {
        setError(result.error)
        return
      }
      setIsOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <Button
        variant={isEnabled ? 'outline' : 'default'}
        size="sm"
        onClick={() => setIsOpen(true)}
        disabled={isPending}
        aria-label={isEnabled ? `Disable ${moduleName}` : `Enable ${moduleName}`}
      >
        {isPending ? 'Updating...' : isEnabled ? 'Disable' : 'Enable'}
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isEnabled ? `Disable ${moduleName}?` : `Enable ${moduleName}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEnabled
                ? `Warning: Module data will be preserved but features will be unavailable. You can re-enable this module at any time.`
                : `This will make ${moduleName} features available to your organization.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <p className="text-sm text-destructive" role="alert" aria-live="polite">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isPending}
              className={isEnabled ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {isPending ? 'Updating...' : isEnabled ? 'Disable' : 'Enable'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
