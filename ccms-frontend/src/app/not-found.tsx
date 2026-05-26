import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { Button } from '@/components/ui/button'

export default async function NotFound() {
  const tErrors = await getTranslations('errors')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
      <h1 className="text-2xl font-semibold">{tErrors('pages.404.title')}</h1>
      <p className="text-sm text-foreground-muted">{tErrors('pages.404.description')}</p>
      <Button asChild variant="outline">
        <Link href="/dashboard">{tErrors('pages.404.action')}</Link>
      </Button>
    </div>
  )
}
