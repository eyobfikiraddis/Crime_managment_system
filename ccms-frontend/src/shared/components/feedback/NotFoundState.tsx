import Link from 'next/link'

import { Button } from '@/components/ui/button'

interface NotFoundStateProps {
  message?: string
  returnHref?: string
}

export function NotFoundState({
  message = 'The requested resource was not found.',
  returnHref = '/dashboard',
}: NotFoundStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-10 text-center">
      <p className="text-base font-semibold">Not Found</p>
      <p className="text-sm text-foreground-muted">{message}</p>
      <Button asChild variant="outline">
        <Link href={returnHref}>Back to list</Link>
      </Button>
    </div>
  )
}
