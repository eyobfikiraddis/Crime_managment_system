'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { hasMinRole } from '@/shared/permissions'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useUiStore } from '@/shared/stores/ui.store'

import { navigationSections } from './navigation.config'

const MOBILE_BREAKPOINT = '(max-width: 1024px)'

export function Sidebar() {
  const pathname = usePathname()
  const role = useAuthStore((state) => state.role)
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT)
  const [mobileOpen, setMobileOpen] = useState(false)
  const tCommon = useTranslations('common')
  const tNav = useTranslations('navigation')
  const tA11y = useTranslations('accessibility')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handler = () => setMobileOpen(true)
    window.addEventListener('ccms:sidebar-open', handler)
    return () => window.removeEventListener('ccms:sidebar-open', handler)
  }, [])

  const sections = useMemo(() => {
    return navigationSections
      .filter((section) => {
        if (!section.minRole) {
          return true
        }
        return role ? hasMinRole(role, section.minRole) : false
      })
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (!item.minRole) {
            return true
          }
          return role ? hasMinRole(role, item.minRole) : false
        }),
      }))
  }, [role])

  const navigationContent = (
    <div className="flex h-full flex-col gap-6 px-4 py-6">
      <div className="text-xs font-semibold uppercase text-foreground-muted">
        {tCommon('systemName')}
      </div>
      <nav className="flex flex-1 flex-col gap-6" aria-label={tA11y('navigation.primary')}>
        {sections.map((section) => (
          <div key={section.label} className="space-y-2">
            {!sidebarCollapsed ? (
              <p className="text-xs font-semibold uppercase text-foreground-muted">
                {tNav(section.label)}
              </p>
            ) : null}
            <div className="flex flex-col gap-1" role="menu">
              {section.items.map((item) => {
                const active = pathname.startsWith(item.href)
                const content = (
                  <Link
                    data-nav-item
                    href={item.href}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-card text-foreground'
                        : 'text-foreground-muted hover:bg-card hover:text-foreground'
                    }`}
                  >
                    <item.icon className="size-4" aria-hidden="true" />
                    {!sidebarCollapsed ? <span>{tNav(item.label)}</span> : null}
                  </Link>
                )

                if (sidebarCollapsed) {
                  return (
                    <Tooltip key={item.href} delayDuration={0}>
                      <TooltipTrigger asChild>{content}</TooltipTrigger>
                      <TooltipContent side="right">{tNav(item.label)}</TooltipContent>
                    </Tooltip>
                  )
                }

                return <div key={item.href}>{content}</div>
              })}
            </div>
          </div>
        ))}
      </nav>
      {!isMobile ? (
        <Button
          type="button"
          variant="ghost"
          className="justify-start gap-2"
          onClick={toggleSidebar}
          aria-label={
            sidebarCollapsed ? tNav('sidebar.expandLabel') : tNav('sidebar.collapseLabel')
          }
        >
          {sidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          {!sidebarCollapsed ? tNav('sidebar.collapseLabel') : null}
        </Button>
      ) : null}
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-full border-border bg-background p-0">
          {navigationContent}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <aside
      className={`border-r border-border bg-background ${
        sidebarCollapsed ? 'w-16' : 'w-60'
      } transition-[width]`}
    >
      {navigationContent}
    </aside>
  )
}
