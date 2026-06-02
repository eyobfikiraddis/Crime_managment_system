import type { Meta, StoryObj } from '@storybook/react'
import { DateRangePicker } from './DateRangePicker'
import { DatePreset } from '@/features/reports/types/reports.types'
import React, { useState } from 'react'

const meta: Meta<typeof DateRangePicker> = {
  title: 'Shared/Forms/DateRangePicker',
  component: DateRangePicker,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof DateRangePicker>

const defaultLabels = {
  from: 'From Date',
  to: 'To Date',
  last7Days: 'Last 7 Days',
  last30Days: 'Last 30 Days',
  lastQuarter: 'Last Quarter',
  custom: 'Custom Range',
}

export const Default: Story = {
  args: {
    dateFrom: '2026-05-01',
    dateTo: '2026-06-01',
    activePreset: DatePreset.LAST_30_DAYS,
    labels: defaultLabels,
    onChange: (from, to, preset) => console.log('Range changed:', { from, to, preset }),
  },
}

export const Interactive: Story = {
  render: () => {
    const [range, setRange] = useState({
      from: '2026-05-25',
      to: '2026-06-01',
      preset: DatePreset.LAST_7_DAYS as DatePreset | null,
    })

    return React.createElement(DateRangePicker, {
      dateFrom: range.from,
      dateTo: range.to,
      activePreset: range.preset,
      labels: defaultLabels,
      onChange: (from, to, preset) => setRange({ from, to, preset }),
    })
  },
}
