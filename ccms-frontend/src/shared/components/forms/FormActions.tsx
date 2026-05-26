import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface FormActionsProps {
  onCancel?: () => void
  onSubmit?: () => void
  isSubmitting?: boolean
  submitLabel?: string
  cancelLabel?: string
}

export function FormActions({
  onCancel,
  onSubmit,
  isSubmitting,
  submitLabel,
  cancelLabel,
}: FormActionsProps) {
  return (
    <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-border bg-card px-4 py-3">
      {onCancel ? (
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          {cancelLabel}
        </Button>
      ) : null}
      <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </div>
  )
}
