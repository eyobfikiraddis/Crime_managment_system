import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const metadata: Metadata = {
  title: 'Forgot Password',
}

type PageProps = {
  params: Record<string, string>
  searchParams: Record<string, string | string[] | undefined>
}

export default function ForgotPasswordPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Reset Password</h1>
        <p className="text-sm text-foreground-muted">We will send a reset link to your email.</p>
      </div>
      <form className="space-y-4">
        <Input type="email" placeholder="Email address" aria-label="Email address" />
        <Button type="submit" className="w-full">
          Send reset link
        </Button>
      </form>
    </div>
  )
}
