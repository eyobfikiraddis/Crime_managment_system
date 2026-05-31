'use client'

import { useAuthStore } from '@/shared/stores/auth.store'
import { InvestigatorDashboard } from './investigator/InvestigatorDashboard'
import { DeptHeadDashboard } from './dept-head/DeptHeadDashboard'
import { AdminDashboard } from './admin/AdminDashboard'
import { LegalDashboard } from './legal/LegalDashboard'
import { EmptyState } from '@/shared/components/display/EmptyState'
import { useTranslations } from 'next-intl'

const INVESTIGATOR_ROLES = ['INVESTIGATOR', 'FORENSIC']
const DEPT_HEAD_ROLES = ['DEPT_HEAD']
const ADMIN_ROLES = ['ADMIN', 'SUPERADMIN']
const LEGAL_ROLES = ['LEGAL_OFFICER']

export function DashboardPage() {
  const { officer } = useAuthStore()
  const t = useTranslations('dashboard')
  const role = officer?.role ?? ''

  if (INVESTIGATOR_ROLES.includes(role)) return <InvestigatorDashboard />
  if (LEGAL_ROLES.includes(role))       return <LegalDashboard />
  if (DEPT_HEAD_ROLES.includes(role))   return <DeptHeadDashboard />
  if (ADMIN_ROLES.includes(role))       return <AdminDashboard />

  return (
    <div className="flex h-[calc(100vh-120px)] items-center justify-center p-4">
      <EmptyState
        title={t('fallback.title')}
        description={t('fallback.description')}
      />
    </div>
  )
}
