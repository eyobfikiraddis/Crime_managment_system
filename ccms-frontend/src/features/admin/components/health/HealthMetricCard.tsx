'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface HealthMetricCardProps {
  label: string
  value: string | number | null
  fallback: string
}

export function HealthMetricCard({ label, value, fallback }: HealthMetricCardProps) {
  const displayValue = value !== null && value !== undefined ? value : fallback

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground-muted">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight text-foreground">
          {displayValue}
        </div>
      </CardContent>
    </Card>
  )
}
