import { format, subDays, startOfQuarter, endOfQuarter } from 'date-fns'
import { DatePreset } from '../types/reports.types'

// ─── Date preset resolver ─────────────────────────────────────────────────────
// Returns [dateFrom, dateTo] as 'YYYY-MM-DD' strings for a given preset.
export function resolveDatePreset(preset: DatePreset): {
  dateFrom: string
  dateTo: string
} {
  const today = new Date()
  switch (preset) {
    case DatePreset.LAST_7_DAYS:
      return {
        dateFrom: format(subDays(today, 6), 'yyyy-MM-dd'),
        dateTo: format(today, 'yyyy-MM-dd'),
      }
    case DatePreset.LAST_30_DAYS:
      return {
        dateFrom: format(subDays(today, 29), 'yyyy-MM-dd'),
        dateTo: format(today, 'yyyy-MM-dd'),
      }
    case DatePreset.LAST_QUARTER: {
      const lastQuarterEnd = subDays(startOfQuarter(today), 1)
      return {
        dateFrom: format(startOfQuarter(lastQuarterEnd), 'yyyy-MM-dd'),
        dateTo: format(endOfQuarter(lastQuarterEnd), 'yyyy-MM-dd'),
      }
    }
    case DatePreset.CUSTOM:
      // Custom range fallback: default to last 30 days
      return {
        dateFrom: format(subDays(today, 29), 'yyyy-MM-dd'),
        dateTo: format(today, 'yyyy-MM-dd'),
      }
  }
}

// ─── Default filter (Last 30 Days) ───────────────────────────────────────────
export function getDefaultReportFilters() {
  return resolveDatePreset(DatePreset.LAST_30_DAYS)
}

// ─── Build report URL params ──────────────────────────────────────────────────
export function buildReportParams(
  filters: { dateFrom: string; dateTo: string; departmentId?: string | undefined },
): string {
  const p = new URLSearchParams()
  p.set('dateFrom', filters.dateFrom)
  p.set('dateTo', filters.dateTo)
  if (filters.departmentId) p.set('departmentId', filters.departmentId)
  return p.toString()
}

// ─── Format percentage for display ───────────────────────────────────────────
export function formatPercent(value: number | null, fallback = '—'): string {
  if (value === null) return fallback
  return `${value.toFixed(1)}%`
}

// ─── Format change indicator ──────────────────────────────────────────────────
// Returns "+12.3%" or "-4.5%" or "—"
export function formatChange(changePercent: number | null): string {
  if (changePercent === null) return '—'
  const sign = changePercent >= 0 ? '+' : ''
  return `${sign}${changePercent.toFixed(1)}%`
}

// ─── Change direction ─────────────────────────────────────────────────────────
export function getChangeDirection(
  changePercent: number | null,
): 'up' | 'down' | 'neutral' {
  if (changePercent === null || changePercent === 0) return 'neutral'
  return changePercent > 0 ? 'up' : 'down'
}

// ─── CSV filename ─────────────────────────────────────────────────────────────
export function buildCsvFilename(reportType: string): string {
  return `ccms-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.csv`
}
