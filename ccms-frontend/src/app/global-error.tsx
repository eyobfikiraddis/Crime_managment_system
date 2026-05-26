'use client'

import { useLocale, useTranslations } from 'next-intl'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const locale = useLocale()
  const tErrors = useTranslations('errors')

  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <h1 className="text-2xl font-semibold">{tErrors('pages.global.title')}</h1>
        <p className="text-sm text-foreground-muted">{error.message}</p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md border border-border bg-card px-4 py-2 text-sm"
        >
          {tErrors('pages.global.action')}
        </button>
      </body>
    </html>
  )
}
