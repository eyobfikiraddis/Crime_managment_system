'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { useAuthStore } from '@/shared/stores/auth.store'
import { useUiStore } from '@/shared/stores/ui.store'

import { Breadcrumb } from './Breadcrumb'

export function TopBar() {
  const router = useRouter()
  const clearSession = useAuthStore((state) => state.clearSession)
  const toggleCommandPalette = useUiStore((state) => state.toggleCommandPalette)
  const isMobile = useMediaQuery('(max-width: 1024px)')

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
    clearSession()
    router.push('/login')
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
          <Button type="button" variant="ghost" size="icon" aria-label="Open menu" onClick={openSidebar}>
            <Menu className="size-4" />
          </Button>
        ) : null}
        <Breadcrumb />
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" className="gap-2" onClick={toggleCommandPalette}>
          <Command className="size-4" />
          <span className="hidden text-xs text-foreground-muted md:inline">Ctrl+K</span>
        </Button>
        <span className="flex items-center gap-1 text-xs text-foreground-muted">
          <Signal className="size-3 text-success" aria-hidden="true" />
          Online
        </span>
        <Button type="button" variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label="Account menu">
              <UserCircle className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/settings/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/password">Password</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
