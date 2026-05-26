import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  title?: string
  description?: string
  retry?: () => void
  retryLabel?: string
}

export function ErrorState({
  title,
  description,
  retry,
  retryLabel,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-10 text-center">
      <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
      <div className="space-y-1">
        {title ? <p className="text-base font-semibold">{title}</p> : null}
        {description ? <p className="text-sm text-foreground-muted">{description}</p> : null}
      </div>
      {retry ? (
        <Button type="button" variant="outline" onClick={retry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  )
}
