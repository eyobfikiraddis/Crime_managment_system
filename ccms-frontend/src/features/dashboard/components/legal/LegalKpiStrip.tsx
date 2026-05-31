'use client'

import { Scale, FileText, Calendar, Award } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { KpiCard } from '@/shared/components/display/KpiCard'
import { formatPercent } from '@features/reports/utils/reportUtils'
import type { LegalKpis } from '../../types/dashboard.types'

interface LegalKpiStripProps {
  kpis?: LegalKpis | undefined
  isLoading: boolean
}

export function LegalKpiStrip({ kpis, isLoading }: LegalKpiStripProps) {
  const t = useTranslations('dashboard')

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        icon={Scale}
        label={t('legal.kpis.openCourtCases')}
        value={kpis?.openCourtCaseCount ?? null}
        isLoading={isLoading}
      />
      <KpiCard
        icon={FileText}
        label={t('legal.kpis.chargesThisMonth')}
        value={kpis?.chargesFiledThisMonthCount ?? null}
        isLoading={isLoading}
      />
      <KpiCard
        icon={Calendar}
        label={t('legal.kpis.upcomingHearings')}
        value={kpis?.upcomingHearingCount ?? null}
        isLoading={isLoading}
      />
      <KpiCard
        icon={Award}
        label={t('legal.kpis.convictionRate')}
        value={kpis?.convictionRatePercent ?? null}
        valueFormatter={(v) => formatPercent(v as number)}
        isLoading={isLoading}
      />
    </div>
  )
}
