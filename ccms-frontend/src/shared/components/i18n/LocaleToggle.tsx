'use client'

import { useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { localeFlags, localeNames, locales, type Locale } from '@/config/i18n'

export function LocaleToggle() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('accessibility')
  const currentLocale = useLocale() as Locale

  const displayLabel = useMemo(() => {
    if (currentLocale === 'am') return 'አማ'
    return 'EN'
  }, [currentLocale])

  const handleSelect = (nextLocale: Locale) => {
    if (nextLocale === currentLocale) return

    startTransition(async () => {
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: nextLocale }),
      })
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('localeToggle.label')}
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground',
            'transition-colors hover:border-primary hover:text-foreground',
            isPending && 'opacity-70',
          )}
        >
          <span aria-hidden="true">{localeFlags[currentLocale]}</span>
          <span>{displayLabel}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem key={locale} onClick={() => handleSelect(locale)}>
            <span className="mr-2" aria-hidden="true">
              {localeFlags[locale]}
            </span>
            <span>{localeNames[locale]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
