import type { BadgeVariant } from '@shared/types/ui.types'
import { HealthStatus, CrimeSeverity } from '../types/admin.types'

// ─── Health status badge variants ─────────────────────────────────────────────
export const HEALTH_STATUS_VARIANTS: Record<HealthStatus, BadgeVariant> = {
  healthy:  'success',
  degraded: 'warning',
  down:     'destructive',
}

// ─── Crime severity badge variants ────────────────────────────────────────────
export const CRIME_SEVERITY_VARIANTS: Record<CrimeSeverity, BadgeVariant> = {
  MISDEMEANOR: 'muted',
  FELONY:      'warning',
  CAPITAL:     'destructive',
}

// ─── Health status icon name helper ──────────────────────────────────────────
// Returns the lucide icon name appropriate for a given health status.
export function getHealthStatusIcon(status: HealthStatus): 'check-circle' | 'alert-triangle' | 'x-circle' {
  if (status === 'healthy') return 'check-circle'
  if (status === 'degraded') return 'alert-triangle'
  return 'x-circle'
}

// ─── Format response time ─────────────────────────────────────────────────────
export function formatResponseTime(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}
