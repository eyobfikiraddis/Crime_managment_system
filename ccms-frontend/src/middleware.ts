import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password']
const ADMIN_ROUTES = ['/admin']

const extractRole = (token: string) => {
  const [, payload] = token.split('.')
  if (!payload) {
    return null
  }

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = JSON.parse(atob(normalized)) as { role?: string }
    return json.role ?? null
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route))

  const sessionToken = request.cookies.get('ccms_session')?.value

  if (!sessionToken && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  if (sessionToken && isPublicRoute) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    dashboardUrl.search = ''
    return NextResponse.redirect(dashboardUrl)
  }

  if (sessionToken && isAdminRoute) {
    const role = extractRole(sessionToken)

    if (role !== 'admin' && role !== 'superadmin') {
      const forbiddenUrl = request.nextUrl.clone()
      forbiddenUrl.pathname = '/403'
      forbiddenUrl.search = ''
      return NextResponse.redirect(forbiddenUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
