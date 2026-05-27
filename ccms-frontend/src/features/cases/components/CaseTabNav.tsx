'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Lock } from 'lucide-react'

import { useAuthStore } from '@/shared/stores/auth.store'
import { hasMinRole } from '@/shared/permissions/role-helpers'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { OfficerRole } from '@/shared/constants/roles'

interface CaseTabNavProps {
  caseId: string
}

interface TabItem {
  labelKey: string
  href: string
  minRole: OfficerRole | null
}

export function CaseTabNav({ caseId }: CaseTabNavProps) {
  const t = useTranslations('cases')
  const pathname = usePathname()
  const currentRole = useAuthStore((state) => state.role)

  const tabs: TabItem[] = [
    { labelKey: 'detail.tabs.overview', href: `/cases/${caseId}`, minRole: null },
    { labelKey: 'detail.tabs.evidence', href: `/cases/${caseId}/evidence`, minRole: null },
    { labelKey: 'detail.tabs.officers', href: `/cases/${caseId}/officers`, minRole: null },
    { labelKey: 'detail.tabs.arrests', href: `/cases/${caseId}/arrests`, minRole: 'INVESTIGATOR' },
    { labelKey: 'detail.tabs.interrogations', href: `/cases/${caseId}/interrogations`, minRole: 'INVESTIGATOR' },
    { labelKey: 'detail.tabs.legal', href: `/cases/${caseId}/legal`, minRole: 'LEGAL_OFFICER' },
    { labelKey: 'detail.tabs.reports', href: `/cases/${caseId}/reports`, minRole: 'DEPT_HEAD' },
    { labelKey: 'detail.tabs.timeline', href: `/cases/${caseId}/timeline`, minRole: null },
    { labelKey: 'detail.tabs.permissions', href: `/cases/${caseId}/permissions`, minRole: 'ADMIN' },
  ]

  return (
    <nav
      className="sticky top-0 z-10 flex border-b border-border bg-card px-6 overflow-x-auto scrollbar-none"
      aria-label="Case workspace tabs"
    >
      <TooltipProvider>
        <div className="flex gap-6 min-w-max">
          {tabs.map((tab) => {
            const isOverview = tab.href === `/cases/${caseId}`
            // Active checks: overview matches exactly, other tabs match if path starts with tab href
            const active = isOverview 
              ? pathname === tab.href 
              : pathname.startsWith(tab.href)

            const hasAccess = !tab.minRole || (currentRole && hasMinRole(currentRole, tab.minRole))

            if (!hasAccess) {
              return (
                <Tooltip key={tab.href}>
                  <TooltipTrigger asChild>
                    <span
                      className="flex items-center gap-1 cursor-not-allowed opacity-50 px-1 py-4 text-sm font-medium text-foreground-muted select-none"
                      role="link"
                      aria-disabled="true"
                    >
                      {t(tab.labelKey)}
                      <Lock className="h-3 w-3 inline text-foreground-muted" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('detail.tabs.lockedTooltip', { minRole: tab.minRole ?? '' })}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative px-1 py-4 text-sm font-medium transition hover:text-foreground ${
                  active
                    ? 'text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary'
                    : 'text-foreground-muted'
                }`}
              >
                {t(tab.labelKey)}
              </Link>
            )
          })}
        </div>
      </TooltipProvider>
    </nav>
  )
}
