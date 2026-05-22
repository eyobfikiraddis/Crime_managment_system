import {
  Bell,
  Briefcase,
  Building2,
  FileText,
  LayoutDashboard,
  Scale,
  Settings,
  Shield,
  Users,
} from 'lucide-react'

import { ROUTES } from '@/shared/constants/routes'
import { OfficerRole } from '@/shared/constants/roles'
import type { NavigationSection } from '@/shared/types/navigation.types'

export const navigationSections: NavigationSection[] = [
  {
    label: 'Operations',
    items: [
      { href: ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard },
      { href: ROUTES.cases, label: 'Cases', icon: Briefcase },
    ],
  },
  {
    label: 'Evidence',
    items: [{ href: ROUTES.cases, label: 'Evidence', icon: Shield }],
  },
  {
    label: 'Legal',
    items: [{ href: ROUTES.legalCourtCases, label: 'Court Cases', icon: Scale }],
  },
  {
    label: 'Personnel',
    items: [
      { href: ROUTES.personnelPersons, label: 'Persons', icon: Users },
      { href: ROUTES.personnelOfficers, label: 'Officers', icon: Users },
    ],
  },
  {
    label: 'Organisation',
    items: [{ href: ROUTES.departments, label: 'Departments', icon: Building2 }],
  },
  {
    label: 'Intelligence',
    items: [{ href: ROUTES.reports, label: 'Reports', icon: FileText }],
  },
  {
    label: 'System',
    minRole: OfficerRole.ADMIN,
    items: [
      { href: ROUTES.adminLocations, label: 'Locations', icon: Settings },
      { href: ROUTES.adminCrimeTypes, label: 'Crime Types', icon: Settings },
      { href: ROUTES.adminHealth, label: 'System Health', icon: Settings },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: ROUTES.settingsProfile, label: 'Profile', icon: Bell },
      { href: ROUTES.settingsPassword, label: 'Password', icon: Bell },
    ],
  },
]
