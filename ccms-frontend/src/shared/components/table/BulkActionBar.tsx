'use client'

import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePermission } from '@/shared/hooks/usePermission'
import type { Permission } from '@/shared/constants/permissions'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface BulkAction {
  label: string
  icon: LucideIcon
  variant?: 'default' | 'destructive'
  onClick: () => void
  requiredPermission?: Permission
  disabled?: boolean
  disabledTooltip?: string
}

interface BulkActionBarProps {
  selectedCount: number
  onClearSelection: () => void
  actions: BulkAction[]
}

export function BulkActionBar({ selectedCount, onClearSelection, actions }: BulkActionBarProps) {
  const { hasPermission } = usePermission()

  if (selectedCount === 0) {
    return null
  }

  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-2.5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">
          {selectedCount} selected
        </span>
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={onClearSelection}
          className="h-auto p-0 text-xs text-foreground-muted hover:text-foreground"
        >
          Clear selection
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <TooltipProvider>
          {actions.map((action, idx) => {
            if (action.requiredPermission && !hasPermission(action.requiredPermission)) {
              return null
            }

            const Icon = action.icon
            const isDestructive = action.variant === 'destructive'

            const buttonEl = (
              <Button
                type="button"
                variant={isDestructive ? 'destructive' : 'outline'}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                className="h-8 gap-1.5"
              >
                <Icon className="h-4 w-4" />
                {action.label}
              </Button>
            )

            if (action.disabled && action.disabledTooltip) {
              return (
                <Tooltip key={idx}>
                  <TooltipTrigger asChild>
                    <span>{buttonEl}</span>
                  </TooltipTrigger>
                  <TooltipContent>{action.disabledTooltip}</TooltipContent>
                </Tooltip>
              )
            }

            return <span key={idx}>{buttonEl}</span>
          })}
        </TooltipProvider>
      </div>
    </div>
  )
}
export default BulkActionBar
