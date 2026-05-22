import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { AppShell } from '@/shared/layouts/AppShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = (await cookies()).get('ccms_session')

  if (!session) {
    redirect('/login')
  }

  return <AppShell>{children}</AppShell>
}
