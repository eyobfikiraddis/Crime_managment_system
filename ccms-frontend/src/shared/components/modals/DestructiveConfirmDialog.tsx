'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'

interface DestructiveConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  isConfirming?: boolean
  confirmPhrase?: string
  confirmPrompt?: string
}

export function DestructiveConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  isConfirming,
  confirmPhrase,
  confirmPrompt,
}: DestructiveConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('')
  const phraseMatches = confirmPhrase ? inputValue === confirmPhrase : true

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {confirmPhrase ? (
          <div className="space-y-2">
            {confirmPrompt ? (
              <p className="text-xs text-foreground-muted">
                {confirmPrompt}
              </p>
            ) : null}
            <Input value={inputValue} onChange={(event) => setInputValue(event.target.value)} />
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>{cancelLabel}</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isConfirming || !phraseMatches}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
