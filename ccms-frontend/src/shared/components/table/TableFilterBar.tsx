'use client'

import type { ReactNode } from 'react'

import { Input } from '@/components/ui/input'

interface TableFilterBarProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  children?: ReactNode
}

export function TableFilterBar({
  value,
  onChange,
  placeholder = 'Search',
  children,
}: TableFilterBarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          className="max-w-xs"
        />
        {children}
      </div>
    </div>
  )
}
