'use client'

import { useTranslations } from 'next-intl'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ServiceHealth } from '../../types/admin.types'
import { formatResponseTime } from '../../utils/adminUtils'

interface HealthStatusCardProps {
  label: string
  health: ServiceHealth
}

export function HealthStatusCard({ label, health }: HealthStatusCardProps) {
  const t = useTranslations('admin')

  const iconMap = {
    healthy: <CheckCircle className="size-5 text-success" />,
    degraded: <AlertTriangle className="size-5 text-warning" />,
    down: <XCircle className="size-5 text-destructive" />,
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {iconMap[health.status] ?? <XCircle className="size-5 text-muted-foreground" />}
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <span className="text-2xl font-bold text-foreground">
            {t(`health.status.${health.status}`)}
          </span>
        </div>
        <div className="space-y-1 text-xs text-foreground-muted">
          <div className="flex justify-between">
            <span>{t('health.services.responseTime')}:</span>
            <span className="font-semibold text-foreground">
              {formatResponseTime(health.responseTimeMs)}
            </span>
          </div>
          <div className="space-y-0.5 pt-1">
            <span>{t('health.services.message')}:</span>
            <p className="text-foreground font-medium break-words">
              {health.message || t('health.services.noMessage')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
