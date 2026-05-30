import type { BadgeVariant } from '@shared/types/ui.types'

import {
  ChargeStatus,
  CourtCaseStatus,
  TERMINAL_CHARGE_STATUSES,
} from '../types/legal.types'

// ─── Charge Status badge variant mapping ─────────────────────────────────────
export const CHARGE_STATUS_VARIANTS: Record<ChargeStatus, BadgeVariant> = {
  FILED: 'primary',
  ACTIVE: 'warning',
  CONVICTED: 'destructive',
  ACQUITTED: 'success',
  DROPPED: 'muted',
}

// ─── Court Case Status badge variant mapping ──────────────────────────────────
export const COURT_CASE_STATUS_VARIANTS: Record<CourtCaseStatus, BadgeVariant> = {
  PENDING: 'muted',
  ACTIVE: 'warning',
  CONCLUDED: 'success',
  DISMISSED: 'destructive',
}

// ─── Terminal state guard ─────────────────────────────────────────────────────
export function isChargeTerminal(status: ChargeStatus): boolean {
  return TERMINAL_CHARGE_STATUSES.includes(status)
}

// ─── Available next statuses for a charge ────────────────────────────────────
export function getAvailableChargeStatuses(current: ChargeStatus): ChargeStatus[] {
  if (isChargeTerminal(current)) return []
  if (current === ChargeStatus.FILED) {
    return [ChargeStatus.ACTIVE, ChargeStatus.ACQUITTED]
  }
  if (current === ChargeStatus.ACTIVE) {
    return [ChargeStatus.ACQUITTED]
  }
  return []
}

// ─── Duration formatter ───────────────────────────────────────────────────────
export function formatDurationMonths(months: number): string {
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (rem === 0) return `${years} year${years === 1 ? '' : 's'}`
  return `${years} year${years === 1 ? '' : 's'}, ${rem} month${rem === 1 ? '' : 's'}`
}

// ─── Fine amount formatter ────────────────────────────────────────────────────
export function formatFineAmount(amount: number): string {
  return `${amount.toLocaleString('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`
}
