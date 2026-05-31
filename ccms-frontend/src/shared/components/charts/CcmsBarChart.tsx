'use client'

import { useRef, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'
import { CHART_COLORS } from '@shared/constants/chartColors'
import { Skeleton } from '@shared/components/feedback/Skeleton'

export interface CcmsBarSeries {
  dataKey: string
  label: string
  color?: string
}

interface CcmsBarChartProps {
  data: Record<string, string | number>[]
  series: CcmsBarSeries[]
  xAxisKey: string
  layout?: 'horizontal' | 'vertical'   // Defaults to 'horizontal'
  xAxisTickFormatter?: (value: string) => string
  yAxisTickFormatter?: (value: number | string) => string
  height?: number
  showLegend?: boolean
  // For single-series charts where each bar is a different colour (e.g. status breakdown)
  useSeriesColorsPerBar?: boolean
  isLoading?: boolean
}

export function CcmsBarChart({
  data,
  series,
  xAxisKey,
  layout = 'horizontal',
  xAxisTickFormatter,
  yAxisTickFormatter,
  height = 280,
  showLegend = false,
  useSeriesColorsPerBar = false,
  isLoading = false,
}: CcmsBarChartProps) {
  const isVertical = layout === 'vertical'
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
    ? (value: unknown) => yAxisTickFormatter(value as number | string)
    : undefined

  const xAxisTickProps = xAxisTickFormatterFn ? { tickFormatter: xAxisTickFormatterFn } : {}
  const yAxisTickProps = yAxisTickFormatterFn ? { tickFormatter: yAxisTickFormatterFn } : {}

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={layout}
        margin={{ top: 12, right: 16, left: isVertical ? 20 : -20, bottom: 0 }}
        barCategoryGap="30%"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={CHART_COLORS.gridLine}
          horizontal={!isVertical}
          vertical={isVertical}
        />
        {isVertical ? (
          <>
            <XAxis
              type="number"
              tick={{ fill: CHART_COLORS.axisLabel, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              {...yAxisTickProps}
            />
            <YAxis
              type="category"
              dataKey={xAxisKey}
              tick={{ fill: CHART_COLORS.axisLabel, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              {...xAxisTickProps}
              width={100}
            />
          </>
        ) : (
          <>
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
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: CHART_COLORS.tooltipBg,
            border: `1px solid ${CHART_COLORS.tooltipBorder}`,
            borderRadius: '6px',
            color: CHART_COLORS.tooltipText,
            fontSize: '12px',
          }}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
        />
        {showLegend && (
          <Legend wrapperStyle={{ color: CHART_COLORS.axisLabel, fontSize: 12 }} />
        )}
        {series.map((s, idx) => (
          <Bar
            key={s.dataKey}
            dataKey={s.dataKey}
            name={s.label}
            fill={s.color ?? CHART_COLORS.series[idx % CHART_COLORS.series.length] ?? CHART_COLORS.primary}
            radius={isVertical ? [0, 3, 3, 0] : [3, 3, 0, 0]}
            isAnimationActive={isAnimationActive}
          >
            {useSeriesColorsPerBar &&
              data.map((_, cellIdx) => (
                <Cell
                  key={`cell-${cellIdx}`}
                  fill={CHART_COLORS.series[cellIdx % CHART_COLORS.series.length] ?? CHART_COLORS.primary}
                />
              ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
