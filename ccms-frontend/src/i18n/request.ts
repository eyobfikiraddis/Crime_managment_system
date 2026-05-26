import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

import { defaultLocale, type Locale, locales } from '@/config/i18n'

const NAMESPACES = [
  'common',
  'auth',
  'navigation',
  'errors',
  'accessibility',
  'cases',
  'evidence',
  'personnel',
  'departments',
  'legal',
  'reports',
  'dashboard',
  'admin',
  'settings',
  'audit',
] as const

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const rawLocale = cookieStore.get('ccms_locale')?.value
  const locale: Locale =
    rawLocale && locales.includes(rawLocale as Locale)
      ? (rawLocale as Locale)
      : defaultLocale

  const messages: Record<string, unknown> = {}
  for (const ns of NAMESPACES) {
    messages[ns] = (await import(`../../messages/${locale}/${ns}.json`)).default
  }

  return { locale, messages }
})
