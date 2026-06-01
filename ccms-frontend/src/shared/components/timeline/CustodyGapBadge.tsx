'use client'

import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'
import { formatCustodyGapHours } from '@features/audit/utils/auditUtils'
import { format, parseISO } from 'date-fns'

interface CustodyGapBadgeProps {
  gapHours: number
  fromTimestamp: string
  toTimestamp: string
}

export function CustodyGapBadge({
  gapHours,
  fromTimestamp,
  toTimestamp,
}: CustodyGapBadgeProps) {
  const t = useTranslations('audit')

  const parsedFrom = parseISO(fromTimestamp)
  const parsedTo = parseISO(toTimestamp)
  const formattedFrom = format(parsedFrom, 'dd MMM yyyy, HH:mm')
  const formattedTo = format(parsedTo, 'dd MMM yyyy, HH:mm')
  const durationStr = formatCustodyGapHours(gapHours)

  return (
    <div className="flex flex-col items-center print:my-2" data-custody-gap="">
      {/* Dashed connector above */}
      <div
        className="w-[2px] h-6 ml-[-20px]"
        style={{
          borderLeft: '2px dashed var(--color-warning)',
        }}
        aria-hidden="true"
      />

      {/* Warning Badge Card */}
      <div
        className="flex items-start gap-2.5 rounded-md px-4 py-2.5 max-w-md w-fit text-xs border ml-[-20px]"
        style={{
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          borderColor: 'var(--color-warning)',
          color: 'var(--color-warning)',
        }}
      >
        <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <span className="font-bold uppercase tracking-wider text-[10px]">
            {t('custodyGap.badgeLabel')}
          </span>
          <span className="text-foreground font-medium">
            {t('custodyGap.tooltipText', { duration: durationStr })}
          </span>
          <span className="text-[10px] text-foreground-muted">
            {t('custodyGap.fromTo', { from: formattedFrom, to: formattedTo })}
          </span>
        </div>
      </div>

      {/* Dashed connector below */}
      <div
        className="w-[2px] h-6 ml-[-20px]"
        style={{
          borderLeft: '2px dashed var(--color-warning)',
        }}
        aria-hidden="true"
      />
    </div>
  )
}
