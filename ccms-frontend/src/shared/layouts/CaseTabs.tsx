'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface CaseTabsProps {
  caseId: string
}

const buildTabs = (caseId: string) => [
  { label: 'Overview', href: `/cases/${caseId}` },
  { label: 'Evidence', href: `/cases/${caseId}/evidence` },
  { label: 'Officers', href: `/cases/${caseId}/officers` },
  { label: 'Arrests', href: `/cases/${caseId}/arrests` },
  { label: 'Interrogations', href: `/cases/${caseId}/interrogations` },
  { label: 'Legal', href: `/cases/${caseId}/legal` },
  { label: 'Reports', href: `/cases/${caseId}/reports` },
  { label: 'Timeline', href: `/cases/${caseId}/timeline` },
  { label: 'Permissions', href: `/cases/${caseId}/permissions` },
]

export function CaseTabs({ caseId }: CaseTabsProps) {
  const pathname = usePathname()
  const tabs = buildTabs(caseId)

  return (
    <nav className="flex flex-wrap gap-2 border-b border-border" aria-label="Case tabs">
      {tabs.map((tab) => {
        const active = pathname === tab.href

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-t-md px-3 py-2 text-sm ${
              active
                ? 'border-b-2 border-primary text-foreground'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
