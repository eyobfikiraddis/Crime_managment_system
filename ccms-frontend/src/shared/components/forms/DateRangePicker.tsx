'use client'

import { format, parseISO } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DatePicker } from './DatePicker'
import { Button } from '@/components/ui/button'
import { DatePreset } from '@features/reports/types/reports.types'
import { resolveDatePreset } from '@features/reports/utils/reportUtils'

interface DateRangePickerProps {
  dateFrom: string                // 'YYYY-MM-DD'
  dateTo: string                  // 'YYYY-MM-DD'
  activePreset: DatePreset | null
  onChange: (from: string, to: string, preset: DatePreset | null) => void
  labels: {
    from: string
    to: string
    last7Days: string
    last30Days: string
    lastQuarter: string
    custom: string
  }
}

export function DateRangePicker({
  dateFrom,
  dateTo,
  activePreset,
  onChange,
  labels,
}: DateRangePickerProps) {
  const presets: { preset: DatePreset; label: string }[] = [
    { preset: DatePreset.LAST_7_DAYS,   label: labels.last7Days },
    { preset: DatePreset.LAST_30_DAYS,  label: labels.last30Days },
    { preset: DatePreset.LAST_QUARTER,  label: labels.lastQuarter },
  ]

  function handlePreset(preset: DatePreset) {
    const { dateFrom: from, dateTo: to } = resolveDatePreset(preset)
    onChange(from, to, preset)
  }

  function handleFromChange(date: Date | undefined) {
    if (!date) return
    const from = format(date, 'yyyy-MM-dd')
    onChange(from, dateTo, DatePreset.CUSTOM)
  }

  function handleToChange(date: Date | undefined) {
    if (!date) return
    const to = format(date, 'yyyy-MM-dd')
    onChange(dateFrom, to, DatePreset.CUSTOM)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Preset buttons */}
      {presets.map(({ preset, label }) => (
        <Button
          key={preset}
          variant={activePreset === preset ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePreset(preset)}
          className="h-8 text-xs"
        >
          {label}
        </Button>
      ))}

      {/* Custom range pickers */}
      <div className="flex items-center gap-1">
        <CalendarIcon className="h-3.5 w-3.5 text-foreground-muted" />
        <DatePicker
          value={dateFrom ? parseISO(dateFrom) : undefined}
          onChange={handleFromChange}
          placeholder={labels.from}
          maxDate={dateTo ? parseISO(dateTo) : undefined}
        />
        <span className="text-foreground-muted text-xs">–</span>
        <DatePicker
          value={dateTo ? parseISO(dateTo) : undefined}
          onChange={handleToChange}
          placeholder={labels.to}
          minDate={dateFrom ? parseISO(dateFrom) : undefined}
        />
      </div>
    </div>
  )
}
