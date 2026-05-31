'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ReportsNavItem } from './ReportsNavItem'
import { PermissionGuard } from '@/shared/components/permission/PermissionGuard'
import { Permission } from '@/shared/constants/permissions'

interface ReportsShellProps {
  children: React.ReactNode
}

export function ReportsShell({ children }: ReportsShellProps) {
  const t = useTranslations('reports')
  const pathname = usePathname()

  const links = [
    { label: t('nav.cases'), href: '/reports/cases' },
    { label: t('nav.evidence'), href: '/reports/evidence' },
    { label: t('nav.arrests'), href: '/reports/arrests' },
    { label: t('nav.officers'), href: '/reports/officers' },
    { label: t('nav.legal'), href: '/reports/legal' },
  ]

  return (
    <div className="container mx-auto p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t('pageTitle')}
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Sticky Left Navigation Panel (200px wide) */}
        <aside className="w-full md:w-[200px] flex flex-col gap-1.5 md:sticky md:top-20 flex-shrink-0 bg-card/20 p-2 border border-border rounded-lg">
          {links.map((link) => (
            <ReportsNavItem
              key={link.href}
              label={link.label}
              href={link.href}
              active={pathname === link.href}
            />
          ))}

          {/* Department Reports is Admin+ only */}
          <PermissionGuard permission={Permission.ADMIN_MANAGE}>
            <ReportsNavItem
              label={t('nav.departments')}
              href="/reports/departments"
              active={pathname === '/reports/departments'}
            />
          </PermissionGuard>
        </aside>

        {/* Dynamic Report Content Panel */}
        <main className="flex-1 min-w-0 w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
