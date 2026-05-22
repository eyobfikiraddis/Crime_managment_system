import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
}

export function EmptyState({ title, description, icon: Icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-10 text-center">
      {Icon ? <Icon className="size-8 text-foreground-muted" aria-hidden="true" /> : null}
      <div className="space-y-1">
        <p className="text-base font-semibold">{title}</p>
        {description ? <p className="text-sm text-foreground-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
