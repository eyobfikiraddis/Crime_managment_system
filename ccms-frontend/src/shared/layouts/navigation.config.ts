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
    label: 'sections.operations',
    items: [
      { href: ROUTES.dashboard, label: 'items.dashboard', icon: LayoutDashboard },
      { href: ROUTES.cases, label: 'items.cases', icon: Briefcase },
    ],
  },
  {
    label: 'sections.evidence',
    items: [{ href: ROUTES.cases, label: 'items.evidence', icon: Shield }],
  },
  {
    label: 'sections.legal',
    items: [{ href: ROUTES.legalCourtCases, label: 'items.courtCases', icon: Scale }],
  },
  {
    label: 'sections.personnel',
    items: [
      { href: ROUTES.personnelPersons, label: 'items.persons', icon: Users },
      { href: ROUTES.personnelOfficers, label: 'items.officers', icon: Users },
    ],
  },
  {
    label: 'sections.organisation',
    items: [{ href: ROUTES.departments, label: 'items.departments', icon: Building2 }],
  },
  {
    label: 'sections.intelligence',
    items: [{ href: ROUTES.reports, label: 'items.reports', icon: FileText }],
  },
  {
    label: 'sections.system',
    minRole: OfficerRole.ADMIN,
    items: [
      { href: ROUTES.adminLocations, label: 'items.locations', icon: Settings },
      { href: ROUTES.adminCrimeTypes, label: 'items.crimeTypes', icon: Settings },
      { href: ROUTES.adminHealth, label: 'items.systemHealth', icon: Settings },
    ],
  },
  {
    label: 'sections.account',
    items: [
      { href: ROUTES.settingsProfile, label: 'items.profile', icon: Bell },
      { href: ROUTES.settingsPassword, label: 'items.password', icon: Bell },
    ],
  },
]
