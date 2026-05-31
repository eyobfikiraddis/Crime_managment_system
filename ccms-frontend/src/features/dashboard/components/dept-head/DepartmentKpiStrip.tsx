'use client'

import { Folder, Percent, Clock, Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { KpiCard } from '@/shared/components/display/KpiCard'
import { formatPercent } from '@features/reports/utils/reportUtils'
import type { DeptHeadKpis } from '../../types/dashboard.types'

interface DepartmentKpiStripProps {
  kpis?: DeptHeadKpis | undefined
  isLoading: boolean
}

export function DepartmentKpiStrip({ kpis, isLoading }: DepartmentKpiStripProps) {
  const t = useTranslations('dashboard')

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        icon={Folder}
        label={t('deptHead.kpis.activeCases')}
        value={kpis?.totalActiveCaseCount ?? null}
        isLoading={isLoading}
      />
      <KpiCard
        icon={Percent}
        label={t('deptHead.kpis.resolutionRate')}
        value={kpis?.resolutionRatePercent ?? null}
        valueFormatter={(v) => formatPercent(v as number)}
        isLoading={isLoading}
      />
      <KpiCard
        icon={Clock}
        label={t('deptHead.kpis.avgCaseAge')}
        value={kpis?.averageCaseAgeDays ?? null}
        valueFormatter={(v) => `${Number(v).toFixed(0)} ${t('deptHead.kpis.avgCaseAgeSuffix')}`}
        isLoading={isLoading}
      />
      <KpiCard
        icon={Shield}
        label={t('deptHead.kpis.openArrests')}
        value={kpis?.openArrestCount ?? null}
        isLoading={isLoading}
      />
    </div>
  )
}
