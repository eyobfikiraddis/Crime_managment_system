import { AuthShell } from '@/shared/layouts/AuthShell'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>
}
