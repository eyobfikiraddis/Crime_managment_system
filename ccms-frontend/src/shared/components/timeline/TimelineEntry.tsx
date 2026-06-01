'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Lock } from 'lucide-react'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

import type { AuditEntry } from '@features/audit/types/audit.types'
import { EVENT_TYPE_ICONS, getEventIconColour, SECURITY_SEVERITY_VARIANTS } from '@features/audit/utils/auditUtils'
import { DiffViewer } from './DiffViewer'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PermissionGuard } from '@shared/components/permission/PermissionGuard'
import { Permission } from '@shared/constants/permissions'

interface TimelineEntryProps {
  // New Phase 10 prop
  entry?: AuditEntry

  // Legacy fallback props for CaseOverviewTab backward compatibility
  icon?: any
  eventType?: string
  actor?: string
  timestamp?: string
  description?: string
}

export function TimelineEntry({
  entry,
  icon: Icon,
  eventType,
  actor,
  timestamp,
  description,
}: TimelineEntryProps) {
  const t = useTranslations('audit')

  // If new Phase 10 entry prop is defined, render the full-featured, immutable entry card
  if (entry) {
    const ResolvedIcon = EVENT_TYPE_ICONS[entry.eventType]

    const parsedTimestamp = parseISO(entry.timestamp)
    const absoluteTime = format(parsedTimestamp, 'dd MMM yyyy, HH:mm:ss')
    const relativeTime = formatDistanceToNow(parsedTimestamp, { addSuffix: true })

    const isHighSeverity = entry.securitySeverity === 'HIGH'

    return (
      <div
        className={`rounded-lg border border-border bg-card px-4 py-3 flex flex-col gap-2 relative ${
          isHighSeverity ? 'border-l-2 border-l-destructive' : ''
        }`}
        data-timeline-entry=""
      >
        {/* Icon, Event Type, Immutability Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {ResolvedIcon && <ResolvedIcon className={`h-4.5 w-4.5 ${getEventIconColour(entry.category)}`} />}
            <span className="text-sm font-semibold text-foreground">
              {t(`eventType.${entry.eventType}`)}
            </span>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-foreground">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" aria-label={t('entry.immutableTooltip')} />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('entry.immutableTooltip')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Actor line */}
        <div className="text-xs text-foreground-muted flex flex-wrap items-center gap-1">
          <span>Actor:</span>
          <PermissionGuard
            permission={Permission.OFFICERS_MANAGE}
            fallback={
              <span className="text-xs text-foreground font-semibold">
                {entry.actor.fullName}
              </span>
            }
          >
            <Link
              href={`/personnel/officers/${entry.actor.officerId}`}
              className="text-xs text-primary hover:underline font-semibold"
            >
              {entry.actor.fullName}
            </Link>
          </PermissionGuard>
          <span className="text-xs font-mono">( {entry.actor.badgeNumber} )</span>
          <span className="text-xs">— {entry.actor.departmentName}</span>
        </div>

        {/* Absolute Timestamp with Relative Hover Tooltip */}
        <div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <time
                  dateTime={entry.timestamp}
                  className="text-xs font-mono text-foreground-muted cursor-default hover:text-foreground transition-colors"
                  suppressHydrationWarning
                >
                  {absoluteTime}
                </time>
              </TooltipTrigger>
              <TooltipContent>{relativeTime}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Description text */}
        <p className="text-xs text-foreground leading-relaxed">
          {entry.description}
        </p>

        {/* Security Severity Badge */}
        {entry.category === 'SECURITY' && entry.securitySeverity && (
          <div className="mt-1">
            <Badge
              variant={
                entry.securitySeverity === 'HIGH'
                  ? 'destructive'
                  : entry.securitySeverity === 'MEDIUM'
                  ? 'secondary'
                  : 'outline'
              }
            >
              {t(`entry.securityBadge.${entry.securitySeverity}`)}
            </Badge>
          </div>
        )}

        {/* Linked entities context (mostly for global log) */}
        {entry.linkedCaseNumber && (
          <div className="text-[10px] text-muted-foreground font-mono mt-1">
            Case Link:{' '}
            <Link
              href={`/cases/${entry.linkedCaseId}`}
              className="text-primary hover:underline"
            >
              #{entry.linkedCaseNumber}
            </Link>
          </div>
        )}

        {/* Note content (CASE_NOTE_ADDED) */}
        {entry.noteText && (
          <div className="mt-1 border-l-2 border-primary/20 bg-muted/30 px-3 py-2 rounded text-xs text-foreground-muted italic whitespace-pre-wrap">
            📝 &ldquo;{entry.noteText}&rdquo;
          </div>
        )}

        {/* DiffViewer (Modified event type fields) */}
        {entry.diff && <DiffViewer diff={entry.diff} />}
      </div>
    )
  }

  // Legacy Fallback for backward compatibility in CaseOverviewTab component
  return (
    <div className="flex gap-4 items-start" data-timeline-entry="">
      <div className="flex flex-col items-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background border border-border">
          {Icon && <Icon className="h-4 w-4 text-foreground-muted" />}
        </div>
      </div>
      <div className="flex-1 space-y-1 rounded-lg border border-border bg-card p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">{eventType}</span>
          <span className="text-xs text-foreground-muted font-mono">{timestamp}</span>
        </div>
        <p className="text-xs text-foreground-muted">by {actor}</p>
        <p className="text-xs text-foreground mt-1">{description}</p>
      </div>
    </div>
  )
}
