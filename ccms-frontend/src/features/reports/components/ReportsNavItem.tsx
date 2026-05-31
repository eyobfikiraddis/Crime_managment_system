'use client'

import Link from 'next/link'
import { cn } from '@/shared/utils/cn'

interface ReportsNavItemProps {
  label: string
  href: string
  active: boolean
}

export function ReportsNavItem({ label, href, active }: ReportsNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center px-4 py-2 text-xs font-semibold rounded-md border-l-2 transition-all duration-120',
        active
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-transparent text-foreground-muted hover:text-foreground hover:bg-card-hover/40'
      )}
    >
      {label}
    </Link>
  )
}
