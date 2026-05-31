'use client'

import { useTranslations } from 'next-intl'
import { DateRangePicker } from '@/shared/components/forms/DateRangePicker'
import { DepartmentSelect } from '@/shared/components/forms/DepartmentSelect'
import { PermissionGuard } from '@/shared/components/permission/PermissionGuard'
import { Permission } from '@/shared/constants/permissions'
import { DatePreset } from '../types/reports.types'

interface ReportsFilterBarProps {
  dateFrom: string
  dateTo: string
  preset: DatePreset | null
  departmentId: string
  onChange: (updates: { dateFrom?: string; dateTo?: string; preset?: DatePreset | null; departmentId?: string }) => void
  hideDepartmentFilter?: boolean
}

export function ReportsFilterBar({
  dateFrom,
  dateTo,
  preset,
  departmentId,
  onChange,
  hideDepartmentFilter = false,
}: ReportsFilterBarProps) {
  const t = useTranslations('reports')

  const pickerLabels = {
    from: t('filters.fromLabel'),
    to: t('filters.toLabel'),
    last7Days: t('filters.presets.last7Days'),
    last30Days: t('filters.presets.last30Days'),
    lastQuarter: t('filters.presets.lastQuarter'),
    custom: t('filters.presets.custom'),
  }

  const handleDateChange = (from: string, to: string, newPreset: DatePreset | null) => {
    onChange({ dateFrom: from, dateTo: to, preset: newPreset })
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border border-border bg-card/40 w-full mb-6">
      {/* Date preset selector + pickers */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-foreground-muted">
          {t('filters.dateRangeLabel')}:
        </span>
        <DateRangePicker
          dateFrom={dateFrom}
          dateTo={dateTo}
          activePreset={preset}
          onChange={handleDateChange}
          labels={pickerLabels}
        />
      </div>

      {/* Department selector (Admin+ only, unless explicitly hidden e.g. on comparison reports) */}
      {!hideDepartmentFilter && (
        <PermissionGuard permission={Permission.ADMIN_MANAGE}>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-semibold text-foreground-muted flex-shrink-0">
              {t('filters.departmentLabel')}:
            </span>
            <div className="w-[200px]">
              <DepartmentSelect
                value={departmentId}
                onChange={(v) => onChange({ departmentId: v })}
                placeholder={t('filters.departmentAll')}
              />
            </div>
          </div>
        </PermissionGuard>
      )}
    </div>
  )
}
