import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'

import { LoginForm } from '@/features/auth/components/LoginForm'

export async function generateMetadata(): Promise<Metadata> {
  const tAuth = await getTranslations('auth')
  return { title: tAuth('login.pageTitle') }
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function LoginPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const callbackParam = resolvedSearchParams.callbackUrl
  const callbackUrl = Array.isArray(callbackParam) ? callbackParam[0] : callbackParam

  return <LoginForm callbackUrl={callbackUrl ?? ""} />
}
