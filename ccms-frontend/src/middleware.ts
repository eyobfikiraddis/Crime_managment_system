import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { defaultLocale, locales, type Locale } from '@/config/i18n'

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password']
const ADMIN_ROUTES = ['/admin']
const API_ROUTES = ['/api/locale']

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    API_ROUTES.some((route) => pathname.startsWith(route)) ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const localeCookie = request.cookies.get('ccms_locale')?.value
  const resolvedLocale: Locale =
    localeCookie && locales.includes(localeCookie as Locale)
      ? (localeCookie as Locale)
      : detectLocaleFromHeader(request) ?? defaultLocale
  const shouldSetLocale = !localeCookie || !locales.includes(localeCookie as Locale)

  const applyLocaleCookie = (response: NextResponse) => {
    if (shouldSetLocale) {
      response.cookies.set('ccms_locale', resolvedLocale, {
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
      })
    }
    return response
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route))
  const sessionToken = request.cookies.get('ccms_session')?.value

  if (!sessionToken && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`)
    return applyLocaleCookie(NextResponse.redirect(loginUrl))
  }

  if (sessionToken && isPublicRoute) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    dashboardUrl.search = ''
    return applyLocaleCookie(NextResponse.redirect(dashboardUrl))
  }

  if (sessionToken && isAdminRoute) {
    const role = request.cookies.get('ccms_role')?.value

    if (role !== 'admin' && role !== 'superadmin') {
      const forbiddenUrl = request.nextUrl.clone()
      forbiddenUrl.pathname = '/403'
      forbiddenUrl.search = ''
      return applyLocaleCookie(NextResponse.redirect(forbiddenUrl))
    }
  }

  return applyLocaleCookie(NextResponse.next())
}

function detectLocaleFromHeader(request: NextRequest): Locale | null {
  const acceptLanguage = request.headers.get('accept-language') ?? ''
  if (acceptLanguage.includes('am')) return 'am'
  return null
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
