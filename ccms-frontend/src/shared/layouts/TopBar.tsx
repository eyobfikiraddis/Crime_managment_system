'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  Bell,
  Command,
  Menu,
  Signal,
  UserCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { useUiStore } from '@/shared/stores/ui.store'
import { LocaleToggle } from '@/shared/components/i18n/LocaleToggle'

import { Breadcrumb } from './Breadcrumb'

export function TopBar() {
  const toggleCommandPalette = useUiStore((state) => state.toggleCommandPalette)
  const openModal = useUiStore((state) => state.openModal)
  const isMobile = useMediaQuery('(max-width: 1024px)')
  const tCommon = useTranslations('common')
  const tNav = useTranslations('navigation')
  const tAuth = useTranslations('auth')
  const tA11y = useTranslations('accessibility')

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isCmd = event.metaKey || event.ctrlKey
      if (isCmd && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        toggleCommandPalette()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleCommandPalette])

  const handleLogout = () => {
    openModal('logout-confirm')
  }

  const openSidebar = () => {
    if (typeof window === 'undefined') {
      return
    }
    window.dispatchEvent(new CustomEvent('ccms:sidebar-open'))
  }

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <div className="flex items-center gap-3">
        {isMobile ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={tA11y('topbar.openMenu')}
            onClick={openSidebar}
          >
            <Menu className="size-4" />
          </Button>
        ) : null}
        <Breadcrumb />
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          className="gap-2"
          onClick={toggleCommandPalette}
          aria-label={tA11y('topbar.commandPalette')}
        >
          <Command className="size-4" />
          <span className="hidden text-xs text-foreground-muted md:inline">
            {tA11y('topbar.commandPaletteHint')}
          </span>
        </Button>
        <span className="flex items-center gap-1 text-xs text-foreground-muted">
          <Signal className="size-3 text-success" aria-hidden="true" />
          {tCommon('status.online')}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={tA11y('topbar.notifications')}
        >
          <Bell className="size-4" />
        </Button>
        <LocaleToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={tA11y('topbar.accountMenu')}
            >
              <UserCircle className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{tNav('sections.account')}</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/settings/profile">{tNav('items.profile')}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/password">{tNav('items.password')}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              {tAuth('logout.menuLabel')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
