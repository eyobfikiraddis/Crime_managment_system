import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ForbiddenState } from '@/shared/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('errors')
  return { title: t('pages.403.title') }
}

export default async function ForbiddenPage() {
  const t = await getTranslations('errors')

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <ForbiddenState
          title={t('pages.403.title')}
          description={t('pages.403.description')}
          action={
            <Button asChild>
              <Link href="/dashboard">{t('pages.403.action')}</Link>
            </Button>
          }
        />
      </div>
    </div>
  )
}
