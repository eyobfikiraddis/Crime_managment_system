'use client'

import { Folder, Search, Gavel, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { KpiCard } from '@/shared/components/display/KpiCard'
import type { InvestigatorKpis } from '../../types/dashboard.types'

interface MyCasesKpiStripProps {
  kpis?: InvestigatorKpis | undefined
  isLoading: boolean
}

export function MyCasesKpiStrip({ kpis, isLoading }: MyCasesKpiStripProps) {
  const t = useTranslations('dashboard')

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        icon={Folder}
        label={t('investigator.kpis.openCases')}
        value={kpis?.openCaseCount ?? null}
        isLoading={isLoading}
      />
      <KpiCard
        icon={Search}
        label={t('investigator.kpis.underInvestigation')}
        value={kpis?.underInvestigationCount ?? null}
        isLoading={isLoading}
      />
      <KpiCard
        icon={Gavel}
        label={t('investigator.kpis.referredToCourt')}
        value={kpis?.referredToCourtCount ?? null}
        isLoading={isLoading}
      />
      <KpiCard
        icon={AlertCircle}
        label={t('investigator.kpis.overdueActions')}
        value={kpis?.overdueActionCount ?? null}
        isLoading={isLoading}
        changeIsPositiveWhenUp={false}
      />
    </div>
  )
}
