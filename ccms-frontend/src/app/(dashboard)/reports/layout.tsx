import { ReportsShell } from '@features/reports/components/ReportsShell'

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ReportsShell>{children}</ReportsShell>
}
