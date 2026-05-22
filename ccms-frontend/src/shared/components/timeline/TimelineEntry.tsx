import type { LucideIcon } from 'lucide-react'
import { Lock } from 'lucide-react'

interface TimelineEntryProps {
  icon: LucideIcon
  eventType: string
  actor: string
  timestamp: string
  description: string
  diff?: { before: unknown; after: unknown }
  securityBadge?: { severity: string }
}

export function TimelineEntry({
  icon: Icon,
  eventType,
  actor,
  timestamp,
  description,
  diff,
  securityBadge,
}: TimelineEntryProps) {
  return (
    <div className="relative flex gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted/30">
        <Icon className="size-4 text-foreground" aria-hidden="true" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">{eventType}</span>
          {securityBadge ? (
            <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">
              {securityBadge.severity}
            </span>
          ) : null}
        </div>
        <p className="text-sm text-foreground-muted">{description}</p>
        {diff ? (
          <pre className="rounded-md bg-background px-3 py-2 text-xs text-foreground-muted">
            {JSON.stringify(diff, null, 2)}
          </pre>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
          <span>Actor: {actor}</span>
          <span>{timestamp}</span>
          <span className="flex items-center gap-1">
            <Lock className="size-3" aria-hidden="true" /> Immutable
          </span>
        </div>
      </div>
    </div>
  )
}
