import { getTranslations } from 'next-intl/server'

import { AuthShell } from '@/shared/layouts/AuthShell'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const tCommon = await getTranslations('common')

  return (
    <AuthShell
      brandLabel={tCommon('systemName')}
      brandName={tCommon('systemFullName')}
      classification={tCommon('classification')}
    >
      {children}
    </AuthShell>
  )
}
