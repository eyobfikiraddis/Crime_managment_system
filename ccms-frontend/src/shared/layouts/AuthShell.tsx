import { LocaleToggle } from '@/shared/components/i18n/LocaleToggle'

interface AuthShellProps {
  children: React.ReactNode
  brandLabel: string
  brandName: string
  classification: string
}

export function AuthShell({ children, brandLabel, brandName, classification }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-10 text-foreground">
      <div className="mb-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground-muted">
          {brandLabel}
        </p>
        <h1 className="text-2xl font-semibold">{brandName}</h1>
      </div>
      <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-md">
        <div className="absolute right-4 top-4">
          <LocaleToggle />
        </div>
        {children}
      </div>
      <p className="mt-6 text-xs text-foreground-muted">{classification}</p>
    </div>
  )
}
