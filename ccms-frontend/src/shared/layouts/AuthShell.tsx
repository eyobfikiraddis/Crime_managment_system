import type { ReactNode } from 'react'
import { Shield } from 'lucide-react'

import { LocaleToggle } from '@/shared/components/i18n/LocaleToggle'

interface AuthShellProps {
  children: ReactNode
  brandLabel: string
  brandName: string
  classification: string
}

export function AuthShell({ children, brandLabel, brandName, classification }: AuthShellProps) {
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-background text-foreground"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% -20%, rgba(59, 130, 246, 0.08) 0%, transparent 60%)',
      }}
    >
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-[420px]">
          <div className="auth-card-entrance relative overflow-hidden rounded-xl border border-border bg-card shadow-xl">
            <div className="absolute right-4 top-4">
              <LocaleToggle />
            </div>
            <div className="px-6 pb-7 pt-8">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-2">
                  <Shield className="size-7 text-primary" aria-hidden="true" />
                  <span className="text-[22px] font-semibold tracking-[0.05em]">
                    {brandLabel}
                  </span>
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-foreground-muted">
                  {brandName}
                </p>
              </div>
              <div className="mt-6">{children}</div>
            </div>
          </div>
        </div>
      </div>
      <p className="pointer-events-none fixed bottom-0 left-0 right-0 py-3 text-center text-xs text-foreground-muted">
        {classification}
      </p>
    </div>
  )
}
