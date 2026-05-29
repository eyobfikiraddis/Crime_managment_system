'use client'

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'

interface TableFilterBarProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  children?: ReactNode
  icon?: LucideIcon
}

export function TableFilterBar({
  value,
  onChange,
  placeholder = 'Search',
  children,
  icon: Icon,
}: TableFilterBarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {Icon ? (
          <div className="relative max-w-xs">
            <Icon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-muted" />
            <Input
              value={value}
              onChange={(event) => onChange?.(event.target.value)}
              placeholder={placeholder}
              className="pl-9"
            />
          </div>
        ) : (
          <Input
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            placeholder={placeholder}
            className="max-w-xs"
          />
        )}
        {children}
      </div>
    </div>
  )
}
