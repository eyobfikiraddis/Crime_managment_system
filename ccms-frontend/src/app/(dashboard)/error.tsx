'use client'

import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-xl font-semibold">Dashboard Error</h1>
      <p className="text-sm text-foreground-muted">{error.message}</p>
      <Button type="button" onClick={() => reset()}>
        Try Again
      </Button>
    </div>
  )
}
