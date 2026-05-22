import type { ReactNode } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MetadataCardProps {
  title: string
  items: Array<{ label: string; value: ReactNode }>
  actions?: ReactNode
}

export function MetadataCard({ title, items, actions }: MetadataCardProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {actions}
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="space-y-1">
            <p className="text-xs uppercase text-foreground-muted">{item.label}</p>
            <div className="text-sm text-foreground">{item.value}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
