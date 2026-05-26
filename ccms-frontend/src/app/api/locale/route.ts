import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { defaultLocale, locales, type Locale } from '@/config/i18n'

export async function POST(request: NextRequest) {
  const { locale } = (await request.json()) as { locale?: string }
  const validLocale: Locale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale

  const response = NextResponse.json({ locale: validLocale })
  response.cookies.set('ccms_locale', validLocale, {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
  return response
}
