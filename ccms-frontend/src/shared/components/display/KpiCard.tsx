'use client'

import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { cn } from '@/shared/utils/cn'

interface KpiCardProps {
  icon: LucideIcon
  label: string
  value: number | string | null
  valueFormatter?: (v: number | string) => string
  changePercent?: number | null          // Positive = improvement; negative = decline; null = N/A
  changeIsPositiveWhenUp?: boolean       // true = ↑ is green; false = ↑ is red (e.g. overdue count)
  isLoading?: boolean
  linkTo?: string                        // Wraps the entire card in a Link if provided
  className?: string
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  valueFormatter,
  changePercent,
  changeIsPositiveWhenUp = true,
  isLoading = false,
  linkTo,
  className,
}: KpiCardProps) {
  const formattedValue =
    value === null || value === undefined
      ? '—'
      : valueFormatter
      ? valueFormatter(value)
      : typeof value === 'number'
      ? value.toLocaleString()
      : value

  const trendElement = (() => {
    if (changePercent === null || changePercent === undefined) return null
    const isUp = changePercent >= 0
    const isPositive = changeIsPositiveWhenUp ? isUp : !isUp
    const TrendIcon = changePercent === 0 ? Minus : isUp ? TrendingUp : TrendingDown
    const sign = changePercent > 0 ? '+' : ''
    return (
      <span
        className={cn(
          'flex items-center gap-1 text-xs font-medium',
          changePercent === 0
            ? 'text-foreground-muted'
            : isPositive
            ? 'text-success'
            : 'text-destructive',
        )}
      >
        <TrendIcon className="h-3 w-3" />
        {sign}{changePercent.toFixed(1)}%
      </span>
    )
  })()

  const inner = (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4 flex flex-col gap-3 h-full',
        linkTo && 'cursor-pointer hover:bg-card-hover transition-colors duration-120',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
          {label}
        </span>
        <Icon className="h-4 w-4 text-foreground-muted" />
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <span className="text-3xl font-semibold text-foreground leading-none">
            {formattedValue}
          </span>
          {trendElement}
        </div>
      )}
    </div>
  )

  if (linkTo) {
    return <Link href={linkTo} className="block h-full">{inner}</Link>
  }
  return inner
}
