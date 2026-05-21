import type { LucideIcon } from 'lucide-react'

import type { OfficerRole } from './auth.types'

export interface NavigationItem {
  href: string
  label: string
  icon: LucideIcon
  minRole?: OfficerRole
  badge?: string | number
}

export interface NavigationSection {
  label: string
  items: NavigationItem[]
  minRole?: OfficerRole
}
