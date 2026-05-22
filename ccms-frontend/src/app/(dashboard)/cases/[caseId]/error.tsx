'use client'

import { Button } from '@/components/ui/button'

export default function CaseDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Case Error</h2>
      <p className="text-sm text-foreground-muted">{error.message}</p>
      <Button type="button" onClick={() => reset()}>
        Try Again
      </Button>
    </div>
  )
}
