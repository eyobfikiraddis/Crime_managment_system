'use client'

import { useRef, useEffect } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { CHART_COLORS } from '@shared/constants/chartColors'
import { Skeleton } from '@shared/components/feedback/Skeleton'

export interface CcmsDonutDataPoint {
  name: string
  value: number
  color?: string
}

interface CcmsDonutChartProps {
  data: CcmsDonutDataPoint[]
  innerRadius?: number    // Defaults to 55 (donut hole)
  outerRadius?: number    // Defaults to 85
  height?: number
  showLegend?: boolean
  // Optional centre label rendered via SVG text
  centreLabel?: string
  centreValue?: string | number
  isLoading?: boolean
}

export function CcmsDonutChart({
  data,
  innerRadius = 55,
  outerRadius = 85,
  height = 240,
  showLegend = true,
  centreLabel,
  centreValue,
  isLoading = false,
}: CcmsDonutChartProps) {
  const hasLoadedOnceRef = useRef(false)

  useEffect(() => {
    if (data && data.length > 0) {
      hasLoadedOnceRef.current = true
    }
  }, [data])

  const isInitialLoading = isLoading && !hasLoadedOnceRef.current

  if (isInitialLoading) {
    return (
      <div style={{ height }} className="flex w-full items-center justify-center">
        <Skeleton className="h-40 w-40 rounded-full" />
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

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          strokeWidth={0}
          isAnimationActive={isAnimationActive}
        >
          {data.map((entry, idx) => (
            <Cell
              key={`cell-${idx}`}
              fill={
                entry.color ??
                CHART_COLORS.series[idx % CHART_COLORS.series.length] ??
                CHART_COLORS.primary
              }
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: CHART_COLORS.tooltipBg,
            border: `1px solid ${CHART_COLORS.tooltipBorder}`,
            borderRadius: '6px',
            color: CHART_COLORS.tooltipText,
            fontSize: '12px',
          }}
          formatter={(value: unknown, name: unknown) => {
            const numeric = typeof value === 'number' ? value : Number(value)
            const displayValue = Number.isFinite(numeric) ? numeric.toLocaleString() : `${value ?? ''}`
            return [displayValue, `${name ?? ''}`]
          }}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ color: CHART_COLORS.axisLabel, fontSize: 12 }}
            iconType="circle"
            iconSize={8}
          />
        )}
        {/* Centre label rendered as SVG */}
        {centreValue !== undefined && (
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
            <tspan
              x="50%"
              dy="-0.2em"
              fontSize="22"
              fontWeight="600"
              fill={CHART_COLORS.tooltipText}
            >
              {centreValue}
            </tspan>
            {centreLabel && (
              <tspan
                x="50%"
                dy="1.4em"
                fontSize="11"
                fill={CHART_COLORS.axisLabel}
              >
                {centreLabel}
              </tspan>
            )}
          </text>
        )}
      </PieChart>
    </ResponsiveContainer>
  )
}
