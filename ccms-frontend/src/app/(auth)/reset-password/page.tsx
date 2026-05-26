import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'

import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm'

export async function generateMetadata(): Promise<Metadata> {
  const tAuth = await getTranslations('auth')
  return { title: tAuth('resetPassword.pageTitle') }
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const tokenParam = resolvedSearchParams.token
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam

  return <ResetPasswordForm token={token ?? ""} />
}
