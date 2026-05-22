import Link from 'next/link'

import { Button } from '@/components/ui/button'

export function ForbiddenState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-10 text-center">
      <p className="text-base font-semibold">Access Denied</p>
      <p className="text-sm text-foreground-muted">
        You do not have permission to view this content.
      </p>
      <Button asChild variant="outline">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  )
}
