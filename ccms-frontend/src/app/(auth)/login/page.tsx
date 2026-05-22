"use client"

import type { Metadata } from 'next'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { login as loginService } from '@/services/domain/auth.service'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useNotificationStore } from '@/shared/stores/notification.store'

export const metadata: Metadata = {
  title: 'Login',
}

type PageProps = {
  params: Record<string, string>
  searchParams: Record<string, string | string[] | undefined>
}

export default function LoginPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  const router = useRouter()
  const setSession = useAuthStore((s) => s.setSession)
  const notify = useNotificationStore((s) => s.addToast)

  const [badge, setBadge] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const session = await loginService({ badgeNumber: badge, password })
      setSession(session.officer, session.officer.permissions ?? [], session.sessionId)
      notify({ message: 'Signed in', variant: 'success' })
      router.push('/dashboard')
    } catch (err: any) {
      notify({ message: err?.message ?? 'Login failed', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">CCMS Login</h1>
        <p className="text-sm text-foreground-muted">Sign in to continue.</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Badge number"
          aria-label="Badge number"
          value={badge}
          onChange={(e) => setBadge(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Password"
          aria-label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}
