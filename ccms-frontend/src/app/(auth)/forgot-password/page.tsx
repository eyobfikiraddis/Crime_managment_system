import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'

import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm'

export async function generateMetadata(): Promise<Metadata> {
  const tAuth = await getTranslations('auth')
  return { title: tAuth('forgotPassword.pageTitle') }
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
