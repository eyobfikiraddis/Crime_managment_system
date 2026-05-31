'use client'

import { useRef, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { CHART_COLORS } from '@shared/constants/chartColors'
import { Skeleton } from '@shared/components/feedback/Skeleton'
import type { ReactNode } from 'react'

export interface CcmsLineChartDataPoint {
  [key: string]: string | number
}

export interface CcmsLineSeries {
  dataKey: string
  label: string
  color?: string         // Defaults to CHART_COLORS.series[index]
  strokeWidth?: number   // Defaults to 2
}

interface CcmsLineChartProps {
  data: CcmsLineChartDataPoint[]
  series: CcmsLineSeries[]
  xAxisKey: string
  xAxisTickFormatter?: (value: string) => string
  yAxisTickFormatter?: (value: number) => string
  height?: number         // Defaults to 280
  showLegend?: boolean
  tooltipLabelFormatter?: (label: ReactNode) => ReactNode
  isLoading?: boolean
}

export function CcmsLineChart({
  data,
  series,
  xAxisKey,
  xAxisTickFormatter,
  yAxisTickFormatter,
  height = 280,
  showLegend = false,
  tooltipLabelFormatter,
  isLoading = false,
}: CcmsLineChartProps) {
  const hasLoadedOnceRef = useRef(false)

  useEffect(() => {
    if (data && data.length > 0) {
      hasLoadedOnceRef.current = true
    }
  }, [data])

  const isInitialLoading = isLoading && !hasLoadedOnceRef.current

  if (isInitialLoading) {
    return (
      <div style={{ height }} className="w-full">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div 
        style={{ height }}
        className="flex w-full items-center justify-center rounded-lg border border-dashed border-border bg-card/30 p-4 text-center text-xs text-foreground-muted"
      >
        No data available for the selected range.
      </div>
    )
  }

  const isAnimationActive = !hasLoadedOnceRef.current

  const xAxisTickFormatterFn = xAxisTickFormatter
    ? (value: unknown) => xAxisTickFormatter(String(value))
    : undefined
  const yAxisTickFormatterFn = yAxisTickFormatter
    ? (value: unknown) => yAxisTickFormatter(Number(value))
    : undefined

  const xAxisTickProps = xAxisTickFormatterFn ? { tickFormatter: xAxisTickFormatterFn } : {}
  const yAxisTickProps = yAxisTickFormatterFn ? { tickFormatter: yAxisTickFormatterFn } : {}
  const tooltipLabelProps = tooltipLabelFormatter ? { labelFormatter: tooltipLabelFormatter } : {}

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 12, right: 16, left: -20, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={CHART_COLORS.gridLine}
          vertical={false}
        />
        <XAxis
          dataKey={xAxisKey}
          tick={{ fill: CHART_COLORS.axisLabel, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          {...xAxisTickProps}
          dy={8}
        />
        <YAxis
          tick={{ fill: CHART_COLORS.axisLabel, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          {...yAxisTickProps}
          width={50}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: CHART_COLORS.tooltipBg,
            border: `1px solid ${CHART_COLORS.tooltipBorder}`,
            borderRadius: '6px',
            color: CHART_COLORS.tooltipText,
            fontSize: '12px',
          }}
          {...tooltipLabelProps}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ color: CHART_COLORS.axisLabel, fontSize: 12 }}
          />
        )}
        {series.map((s, idx) => (
          <Line
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            name={s.label}
            stroke={s.color ?? CHART_COLORS.series[idx % CHART_COLORS.series.length] ?? CHART_COLORS.primary}
            strokeWidth={s.strokeWidth ?? 2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={isAnimationActive}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
