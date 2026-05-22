import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'

interface BulkActionBarProps {
  selectedCount: number
  actions?: ReactNode
  onClearSelection: () => void
}

export function BulkActionBar({ selectedCount, actions, onClearSelection }: BulkActionBarProps) {
  if (selectedCount === 0) {
    return null
  }

  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-2">
      <span className="text-xs text-foreground-muted">{selectedCount} selected</span>
      <div className="flex items-center gap-2">
        {actions}
        <Button type="button" variant="ghost" size="sm" onClick={onClearSelection}>
          Clear
        </Button>
      </div>
    </div>
  )
}
