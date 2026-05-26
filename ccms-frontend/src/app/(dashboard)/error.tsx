'use client'

import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const tErrors = useTranslations('errors')

  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-xl font-semibold">{tErrors('pages.dashboard.title')}</h1>
      <p className="text-sm text-foreground-muted">{error.message}</p>
      <Button type="button" onClick={() => reset()}>
        {tErrors('pages.dashboard.action')}
      </Button>
    </div>
  )
}
