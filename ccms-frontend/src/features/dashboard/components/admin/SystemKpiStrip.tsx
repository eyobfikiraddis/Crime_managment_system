'use client'

import { Folder, Users, Layers, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { KpiCard } from '@/shared/components/display/KpiCard'
import type { AdminKpis } from '../../types/dashboard.types'

interface SystemKpiStripProps {
  kpis?: AdminKpis | undefined
  isLoading: boolean
}

export function SystemKpiStrip({ kpis, isLoading }: SystemKpiStripProps) {
  const t = useTranslations('dashboard')

  const healthStatus = kpis?.systemHealthStatus ?? 'healthy'

  const HealthIcon = (() => {
    switch (healthStatus) {
      case 'healthy':
        return CheckCircle
      case 'degraded':
        return AlertTriangle
      case 'down':
        return XCircle
      default:
        return CheckCircle
    }
  })()

  const healthLabel = t(`admin.healthStatus.${healthStatus}`)

  const healthColorClasses = (() => {
    switch (healthStatus) {
      case 'healthy':
        return 'bg-success/5 border-success/20 text-success'
      case 'degraded':
        return 'bg-warning/5 border-warning/20 text-warning'
      case 'down':
        return 'bg-destructive/5 border-destructive/20 text-destructive'
      default:
        return 'bg-success/5 border-success/20 text-success'
    }
  })()

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        icon={Folder}
        label={t('admin.kpis.totalCases')}
        value={kpis?.totalCaseCount ?? null}
        isLoading={isLoading}
      />
      <KpiCard
        icon={Users}
        label={t('admin.kpis.totalOfficers')}
        value={kpis?.totalOfficerCount ?? null}
        isLoading={isLoading}
      />
      <KpiCard
        icon={Layers}
        label={t('admin.kpis.totalEvidence')}
        value={kpis?.totalEvidenceCount ?? null}
        isLoading={isLoading}
      />
      <KpiCard
        icon={HealthIcon}
        label={t('admin.kpis.systemHealth')}
        value={healthLabel}
        isLoading={isLoading}
        linkTo="/admin/health"
        className={healthColorClasses}
      />
    </div>
  )
}
