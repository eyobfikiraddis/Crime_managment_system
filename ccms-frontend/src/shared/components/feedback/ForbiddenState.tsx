import type { ReactNode } from 'react'

interface ForbiddenStateProps {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
}

export function ForbiddenState({ title, description, action }: ForbiddenStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-10 text-center">
      {title ? <p className="text-base font-semibold">{title}</p> : null}
      {description ? <p className="text-sm text-foreground-muted">{description}</p> : null}
      {action}
    </div>
  )
}
