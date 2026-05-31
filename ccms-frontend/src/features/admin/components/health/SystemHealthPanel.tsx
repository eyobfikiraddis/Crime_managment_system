'use client'

import { useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle, AlertTriangle, XCircle, RotateCw, ShieldAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@shared/components/display/PageHeader'
import { PermissionGuard } from '@shared/components/permission/PermissionGuard'
import { Permission } from '@shared/constants/permissions'
import { ForbiddenState } from '@shared/components/feedback/ForbiddenState'

import { useSystemHealth } from '../../hooks/useSystemHealth'
import { useSystemReadiness } from '../../hooks/useSystemReadiness'
import { formatResponseTime } from '../../utils/adminUtils'
import { HealthStatusCard } from './HealthStatusCard'
import { HealthMetricCard } from './HealthMetricCard'

export function SystemHealthPanel() {
  const t = useTranslations('admin')

  const { data: health, isLoading: isHealthLoading, isError: isHealthError, refetch: refetchHealth, isFetching } = useSystemHealth()
  const { data: readiness, isLoading: isReadinessLoading } = useSystemReadiness()

  const handleRetry = () => {
    void refetchHealth()
  }

  // Initial load skeleton
  if (isHealthLoading && !health) {
    return (
      <PermissionGuard permission={Permission.ADMIN_MANAGE} fallback={<ForbiddenState />}>
        <div className="space-y-6">
          <PageHeader
            title={t('health.pageTitle')}
            description={t('health.pollingNotice')}
          />
          <div className="space-y-6 animate-pulse">
            <div className="h-16 bg-muted/20 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-32 bg-muted/20 rounded-lg" />
              <div className="h-32 bg-muted/20 rounded-lg" />
              <div className="h-32 bg-muted/20 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-24 bg-muted/20 rounded-lg" />
              <div className="h-24 bg-muted/20 rounded-lg" />
              <div className="h-24 bg-muted/20 rounded-lg" />
            </div>
          </div>
        </div>
      </PermissionGuard>
    )
  }

  // Initial load error (no data)
  if (isHealthError && !health) {
    return (
      <PermissionGuard permission={Permission.ADMIN_MANAGE} fallback={<ForbiddenState />}>
        <div className="space-y-6">
          <PageHeader
            title={t('health.pageTitle')}
            description={t('health.pollingNotice')}
            actions={
              <Button onClick={handleRetry}>
                <RotateCw className="mr-2 h-4 w-4" />
                {t('health.retryButton')}
              </Button>
            }
          />
          <div className="flex flex-col items-center justify-center p-8 bg-card rounded-md border border-border text-center">
            <ShieldAlert className="size-12 text-destructive mb-3" />
            <h3 className="text-lg font-semibold">{t('health.error')}</h3>
            <Button onClick={handleRetry} className="mt-4">
              {t('health.retryButton')}
            </Button>
          </div>
        </div>
      </PermissionGuard>
    )
  }

  // Render overall state
  const statusBorderMap = {
    healthy: 'border-l-success',
    degraded: 'border-l-warning',
    down: 'border-l-destructive',
  }

  const iconMap = {
    healthy: <CheckCircle className="size-6 text-success shrink-0" />,
    degraded: <AlertTriangle className="size-6 text-warning shrink-0" />,
    down: <XCircle className="size-6 text-destructive shrink-0" />,
  }

  const lastCheckedText = health
    ? formatDistanceToNow(new Date(health.timestamp), { addSuffix: true })
    : ''

  const lastBackupText = health?.metrics.lastBackupAt
    ? formatDistanceToNow(new Date(health.metrics.lastBackupAt), { addSuffix: true })
    : t('health.metrics.lastBackupNever')

  const apiResponseTimeText = health?.metrics.apiResponseTimeP95Ms !== undefined
    ? formatResponseTime(health.metrics.apiResponseTimeP95Ms)
    : t('health.metrics.noMetric')

  return (
    <PermissionGuard permission={Permission.ADMIN_MANAGE} fallback={<ForbiddenState />}>
      <div className="space-y-6">
        <PageHeader
          title={t('health.pageTitle')}
          description={t('health.pollingNotice')}
          actions={
            isFetching ? (
              <RotateCw className="h-5 w-5 animate-spin text-foreground-muted" />
            ) : isHealthError ? (
              <Button size="sm" variant="outline" onClick={handleRetry}>
                <RotateCw className="mr-2 h-4 w-4" />
                {t('health.retryButton')}
              </Button>
            ) : null
          }
        />

        {/* Background error warning banner */}
        {isHealthError && health && (
          <div className="flex items-start gap-2 rounded-md border border-warning bg-warning/10 p-3 text-xs text-warning">
            <AlertTriangle className="size-4 shrink-0" />
            <div>Unable to refresh health data. Showing last known state.</div>
          </div>
        )}

        {health && (
          <>
            {/* Overall Status Bar */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-card rounded-lg border border-border border-l-4 ${statusBorderMap[health.overall] ?? 'border-l-border'}`}>
              <div className="flex items-center gap-3">
                {iconMap[health.overall] ?? <XCircle className="size-6 text-foreground-muted shrink-0" />}
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    {t('health.overallStatus')}: {t(`health.status.${health.overall}`)}
                  </h2>
                  <div className="text-xs text-foreground-muted">
                    {t('health.lastChecked')}: {lastCheckedText}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-foreground-muted">{t('health.readiness.title')}:</span>
                <span className={`font-semibold ${readiness?.ready ? 'text-success' : 'text-destructive'}`}>
                  {readiness?.ready ? t('health.readiness.ready') : t('health.readiness.notReady')}
                </span>
              </div>
            </div>

            {/* Service Status */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">{t('health.services.title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <HealthStatusCard
                  label={t('health.services.database')}
                  health={health.services.database}
                />
                <HealthStatusCard
                  label={t('health.services.redis')}
                  health={health.services.redis}
                />
                <HealthStatusCard
                  label={t('health.services.api')}
                  health={health.services.api}
                />
              </div>
            </div>

            {/* System Metrics */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">{t('health.metrics.title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <HealthMetricCard
                  label={t('health.metrics.activeSessions')}
                  value={health.metrics.activeSessionCount}
                  fallback="—"
                />
                <HealthMetricCard
                  label={t('health.metrics.apiResponseTimeP95')}
                  value={apiResponseTimeText}
                  fallback="—"
                />
                <HealthMetricCard
                  label={t('health.metrics.lastBackup')}
                  value={lastBackupText}
                  fallback="—"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </PermissionGuard>
  )
}
