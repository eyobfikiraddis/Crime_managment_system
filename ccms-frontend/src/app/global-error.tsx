'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-foreground-muted">{error.message}</p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md border border-border bg-card px-4 py-2 text-sm"
        >
          Reload
        </button>
      </body>
    </html>
  )
}
