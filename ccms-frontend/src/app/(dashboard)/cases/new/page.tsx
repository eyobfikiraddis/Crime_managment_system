import { getTranslations } from 'next-intl/server'
import { CreateCaseWizard } from '@features/cases/components/CreateCaseWizard'
import { PermissionGuard } from '@shared/components/permission/PermissionGuard'
import { ForbiddenState } from '@shared/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Permission } from '@shared/constants/permissions'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('cases')
  return { title: t('create.pageTitle') }
}

export default async function NewCasePage() {
  const tErrors = await getTranslations('errors')

  const fallback = (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <ForbiddenState
        title={tErrors('pages.403.title')}
        description={tErrors('pages.403.description')}
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard">{tErrors('pages.403.action')}</Link>
          </Button>
        }
      />
    </div>
  )

  return (
    <PermissionGuard permission={Permission.CASES_WRITE} fallback={fallback}>
      <CreateCaseWizard />
    </PermissionGuard>
  )
}
