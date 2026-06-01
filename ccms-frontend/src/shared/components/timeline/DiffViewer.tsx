'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { AuditDiff } from '@features/audit/types/audit.types'

interface DiffViewerProps {
  diff: AuditDiff
}

export function DiffViewer({ diff }: DiffViewerProps) {
  const t = useTranslations('audit')
  const [expanded, setExpanded] = useState(false)
  const fields = diff.fields

  if (!fields || fields.length === 0) return null

  const displayLimit = 5
  const hasMore = fields.length > displayLimit
  const visibleFields = expanded ? fields : fields.slice(0, displayLimit)

  return (
    <div className="mt-2 space-y-2" data-timeline-diff="">
      <span className="text-xs font-semibold text-foreground-muted block">
        {t('entry.diffLabel')}
      </span>
      <div className="space-y-2">
        {visibleFields.map((f, i) => (
          <div key={i} className="flex flex-col gap-1 rounded border border-border p-2">
            <span className="text-xs font-mono font-bold text-foreground">
              {f.field}
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {/* Before Panel */}
              <div
                className="rounded p-1.5 border-l-2"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  borderLeftColor: 'var(--color-destructive)',
                }}
                data-diff-before=""
              >
                <div className="text-[10px] text-destructive font-semibold mb-0.5">
                  {t('entry.diffBefore')}
                </div>
                <div className="whitespace-pre-wrap break-all text-xs">
                  {f.before === null ? (
                    <span className="text-muted-foreground">{t('entry.diffNoChange')}</span>
                  ) : (
                    f.before
                  )}
                </div>
              </div>

              {/* After Panel */}
              <div
                className="rounded p-1.5 border-l-2"
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.08)',
                  borderLeftColor: 'var(--color-success)',
                }}
                data-diff-after=""
              >
                <div className="text-[10px] text-success font-semibold mb-0.5">
                  {t('entry.diffAfter')}
                </div>
                <div className="whitespace-pre-wrap break-all text-xs">
                  {f.after === null ? (
                    <span className="text-muted-foreground">{t('entry.diffNoChange')}</span>
                  ) : (
                    f.after
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary hover:underline font-medium mt-1 inline-block"
        >
          {expanded
            ? t('entry.showFewerChanges', { count: fields.length - displayLimit }) || 'Show fewer changes'
            : t('entry.showMoreChanges', { count: fields.length - displayLimit }) || `Show ${fields.length - displayLimit} more changes`}
        </button>
      )}
    </div>
  )
}
