import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const metadata: Metadata = {
  title: 'Set New Password',
}

type PageProps = {
  params: Record<string, string>
  searchParams: Record<string, string | string[] | undefined>
}

export default function ResetPasswordPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Set New Password</h1>
        <p className="text-sm text-foreground-muted">Choose a new password below.</p>
      </div>
      <form className="space-y-4">
        <Input type="password" placeholder="New password" aria-label="New password" />
        <Input type="password" placeholder="Confirm password" aria-label="Confirm password" />
        <Button type="submit" className="w-full">
          Update password
        </Button>
      </form>
    </div>
  )
}
