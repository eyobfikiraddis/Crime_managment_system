'use client'

import { FileText, Users, Scale, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export function ReportsQuickLinksWidget() {
  const t = useTranslations('dashboard')

  const links = [
    {
      title: t('deptHead.quickLinksWidget.caseReport'),
      href: '/reports/cases',
      icon: FileText,
      description: 'Breakdowns, trends and case resolution metrics',
    },
    {
      title: t('deptHead.quickLinksWidget.officerReport'),
      href: '/reports/officers',
      icon: Users,
      description: 'Active case counts, evidence logging and activities',
    },
    {
      title: t('deptHead.quickLinksWidget.legalReport'),
      href: '/reports/legal',
      icon: Scale,
      description: 'Upcoming hearings schedules and conviction rates',
    },
  ]

  return (
    <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {t('deptHead.quickLinksWidget.title')}
        </h3>
        <Link
          href="/reports"
          className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
        >
          {t('deptHead.quickLinksWidget.viewAll')}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card-hover/20 hover:bg-card-hover/50 hover:border-border-hover transition-all duration-120 group"
            >
              <div className="rounded-md bg-primary/10 p-2 text-primary group-hover:bg-primary/20 transition-colors">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  {link.title}
                </span>
                <span className="text-[10px] text-foreground-muted line-clamp-1">
                  {link.description}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
