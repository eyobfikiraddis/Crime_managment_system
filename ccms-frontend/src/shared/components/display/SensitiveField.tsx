'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useNotificationStore } from '@/shared/stores/notification.store'

interface SensitiveFieldProps {
  value: string
  maskedValue: string
  canReveal: boolean
  onReveal?: () => void
}

export function SensitiveField({ value, maskedValue, canReveal, onReveal }: SensitiveFieldProps) {
  const [revealed, setRevealed] = useState(false)
  const addToast = useNotificationStore((state) => state.addToast)

  const toggleReveal = () => {
    if (!canReveal) {
      return
    }
    const nextValue = !revealed
    setRevealed(nextValue)
    if (nextValue) {
      // Notify parent that a reveal happened (audit logging hook)
      try {
        ;(onReveal && onReveal())
      } catch (e) {
        // swallow — audit must not break UX
      }
      addToast({
        message: 'Sensitive data revealed.',
        variant: 'warning',
      })
    }
  }

  if (!canReveal) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground-muted">{maskedValue}</span>
        <span className="rounded-full bg-muted/30 px-2 py-0.5 text-xs text-foreground-muted">
          Sensitive
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-foreground">{revealed ? value : maskedValue}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={revealed ? 'Hide sensitive value' : 'Reveal sensitive value'}
        onClick={toggleReveal}
      >
        {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  )
}
