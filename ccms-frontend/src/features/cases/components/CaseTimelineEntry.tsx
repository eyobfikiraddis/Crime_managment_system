'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Lock, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuthStore } from '@/shared/stores/auth.store'
import type { TimelineEntry as TimelineEntryType, TimelineEventType } from '../types/case.types'

interface CaseTimelineEntryProps {
  entry: TimelineEntryType
  icon: any
}

export function CaseTimelineEntry({ entry, icon: Icon }: CaseTimelineEntryProps) {
  const t = useTranslations('cases')
  const userRole = useAuthStore((state) => state.role)
  const isAdminPlus = userRole === 'ADMIN' || userRole === 'SUPERADMIN'

  const [showFullDiff, setShowFullDiff] = useState(false)

  // Security severity badge styling
  const severityVariant = (severity: string): 'outline' | 'secondary' | 'destructive' => {
    switch (severity) {
      case 'LOW':
        return 'secondary'
      case 'MEDIUM':
        return 'outline'
      case 'HIGH':
      case 'CRITICAL':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // Format value for diff display
  const formatDiffValue = (val: any) => {
    if (val === null || val === undefined) return '—'
    if (typeof val === 'object') return JSON.stringify(val, null, 2)
    return String(val)
  }

  return (
    <div className="relative flex gap-4 p-4 border border-border bg-card rounded-lg shadow-sm hover:shadow transition group">
      {/* Event Icon Wrapper */}
      <div className="flex size-10 items-center justify-center rounded-full bg-muted/40 shrink-0 border border-border">
        <Icon className="size-4 text-foreground" aria-hidden="true" />
      </div>

      <div className="flex-1 space-y-3 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-foreground">
              {t(`timeline.eventTypes.${entry.eventType}`)}
            </span>
            
            {entry.securitySeverity && (
              <Badge 
                variant={severityVariant(entry.securitySeverity)} 
                className={`text-[10px] tracking-wider py-0.5 px-2 ${
                  entry.securitySeverity === 'MEDIUM' 
                    ? 'border-amber-500/30 text-amber-600 bg-amber-500/10' 
                    : ''
                }`}
              >
                {t(`timeline.securityBadge.${entry.securitySeverity}`)}
              </Badge>
            )}
          </div>

          {/* Monospace exact ISO Date with Relative relative fallback */}
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="font-mono cursor-help select-none">
                    {formatDistanceToNowOrAbsolute(entry.createdAt)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {entry.createdAt}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Immutability padlock icon always on the right */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-foreground-muted cursor-help">
                    <Lock className="size-3.5" aria-hidden="true" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {t('timeline.immutableTooltip')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Audit Description text */}
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {entry.description}
        </p>

        {/* Timeline Diff Panel */}
        {entry.diff && entry.diff.length > 0 && (
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                Changes Made
              </span>
              {isAnyDiffLong(entry.diff) && (
                <button
                  type="button"
                  onClick={() => setShowFullDiff(!showFullDiff)}
                  className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                >
                  {showFullDiff ? (
                    <>
                      Collapse <ChevronUp className="h-3 w-3" />
                    </>
                  ) : (
                    <>
                      Expand <ChevronDown className="h-3 w-3" />
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {entry.diff.map((d, index) => {
                const beforeStr = formatDiffValue(d.before)
                const afterStr = formatDiffValue(d.after)
                const isLong = beforeStr.length > 100 || afterStr.length > 100

                const truncate = (str: string) => {
                  if (str.length > 100 && !showFullDiff) {
                    return str.slice(0, 100) + '...'
                  }
                  return str
                }

                return (
                  <div key={index} className="col-span-1 md:col-span-2 border border-border rounded-md overflow-hidden text-xs">
                    <div className="bg-muted/40 px-3 py-1.5 font-semibold text-foreground-muted border-b border-border flex justify-between">
                      <span>Field: {d.fieldName}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                      {/* Before panel - Red background tint */}
                      <div className="p-3 bg-destructive/5 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-destructive">Before</span>
                        <pre className="font-mono whitespace-pre-wrap text-foreground break-all">
                          {truncate(beforeStr)}
                        </pre>
                      </div>

                      {/* After panel - Green background tint */}
                      <div className="p-3 bg-success/5 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-success">After</span>
                        <pre className="font-mono whitespace-pre-wrap text-foreground break-all">
                          {truncate(afterStr)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Actor attribution bar */}
        <div className="flex items-center gap-2 text-xs text-foreground-muted pt-1">
          <span>Actor:</span>
          {isAdminPlus ? (
            <Link
              href={`/personnel/officers/${entry.actor.id}`}
              className="font-medium text-primary hover:underline"
            >
              {`${entry.actor.firstName} ${entry.actor.lastName}`} ({entry.actor.badgeNumber})
            </Link>
          ) : (
            <span className="font-medium text-foreground">
              {`${entry.actor.firstName} ${entry.actor.lastName}`} ({entry.actor.badgeNumber})
            </span>
          )}
          <span>·</span>
          <span>{entry.actor.departmentName}</span>
        </div>
      </div>
    </div>
  )
}

// Utility function for nice relative format with backup
function formatDistanceToNowOrAbsolute(dateString: string) {
  try {
    const d = new Date(dateString)
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return dateString
  }
}

// Check if any value is long to warrant expand/collapse toggle
function isAnyDiffLong(diffs: any[]) {
  return diffs.some(
    (d) => 
      (d.before && String(d.before).length > 100) || 
      (d.after && String(d.after).length > 100)
  )
}
