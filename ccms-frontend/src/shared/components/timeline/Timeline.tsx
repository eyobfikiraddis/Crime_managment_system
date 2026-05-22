import type { ReactNode } from 'react'

interface TimelineProps {
  children: ReactNode
}

export function Timeline({ children }: TimelineProps) {
  return <div className="space-y-4">{children}</div>
}
