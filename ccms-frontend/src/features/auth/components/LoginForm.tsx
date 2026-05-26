'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { AlertCircle, ArrowRight, BadgeCheck, Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import type { ZodIssue } from 'zod'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { loginSchema } from '@/features/auth/schemas/login.schema'
import { ApiError } from '@/services/api/errors'
import { FieldError } from '@/shared/components/forms/FieldError'
import { cn } from '@/lib/utils'

interface LoginFormProps {
  callbackUrl?: string
}

type LoginFormState = {
  badgeNumber: string
  password: string
}

type LoginFormErrors = Partial<Record<keyof LoginFormState, string>>

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const tAuth = useTranslations('auth')
  const tErrors = useTranslations('errors')
  const tA11y = useTranslations('accessibility')

  const loginMutation = useLogin()
  const { reset: resetLoginMutation } = loginMutation
  const apiError = loginMutation.error instanceof ApiError ? loginMutation.error : null

  const [values, setValues] = useState<LoginFormState>({ badgeNumber: '', password: '' })
  const [touched, setTouched] = useState<Record<keyof LoginFormState, boolean>>({
    badgeNumber: false,
    password: false,
  })
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [shake, setShake] = useState(false)
  const [successFlash, setSuccessFlash] = useState(false)
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null)

  const isFormValid = useMemo(() => loginSchema.safeParse(values).success, [values])
  const isRateLimited = rateLimitSeconds !== null
  const isSubmitting = loginMutation.isPending || isRateLimited

  useEffect(() => {
    if (!apiError) {
      return
    }

    setShake(true)
    const timer = window.setTimeout(() => setShake(false), 320)
    return () => window.clearTimeout(timer)
  }, [apiError])

  useEffect(() => {
    if (!loginMutation.isSuccess) {
      return
    }

    setSuccessFlash(true)
    const timer = window.setTimeout(() => setSuccessFlash(false), 200)
    return () => window.clearTimeout(timer)
  }, [loginMutation.isSuccess])

  useEffect(() => {
    if (apiError?.isRateLimited()) {
      const retryAfter = apiError.retryAfterSeconds ?? 5 * 60
      setRateLimitSeconds(retryAfter)
      return
    }

    setRateLimitSeconds(null)
  }, [apiError])

  useEffect(() => {
    if (rateLimitSeconds === null) {
      return
    }

    if (rateLimitSeconds <= 0) {
      setRateLimitSeconds(null)
      resetLoginMutation()
      return
    }

    const intervalId = window.setInterval(() => {
      setRateLimitSeconds((prev) => (prev ? prev - 1 : prev))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [rateLimitSeconds, resetLoginMutation])

  const bannerMessage = useMemo(() => {
    if (!apiError) {
      return null
    }

    if (apiError.isUnauthorized()) {
      return tAuth('login.errors.invalidCredentials')
    }

    if (apiError.isForbidden()) {
      return tAuth('login.errors.inactiveAccount')
    }

    if (apiError.isRateLimited()) {
      const minutes = Math.max(1, Math.ceil((rateLimitSeconds ?? 0) / 60))
      return tAuth('login.errors.rateLimited', { minutes })
    }

    if (apiError.statusCode === 0) {
      return tAuth('login.errors.networkError')
    }

    if (apiError.isServerError()) {
      return tAuth('login.errors.serverError')
    }

    return tErrors('api.generic')
  }, [apiError, rateLimitSeconds, tAuth, tErrors])

  const formatCountdown = (secondsTotal: number) => {
    const minutes = Math.floor(secondsTotal / 60)
    const seconds = secondsTotal % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getValidationMessage = (issue: ZodIssue) => {
    switch (issue.message) {
      case 'required':
        return tErrors('validation.required')
      case 'email':
        return tErrors('validation.email')
      case 'badgeNumberFormat':
        return tErrors('validation.badgeNumberFormat')
      case 'uppercase':
        return tErrors('validation.uppercase')
      case 'number':
        return tErrors('validation.number')
      case 'special':
        return tErrors('validation.special')
      case 'passwordMismatch':
        return tErrors('validation.passwordMismatch')
      case 'minLength':
        return tErrors('validation.minLength', {
          count: 'minimum' in issue ? Number(issue.minimum) : 8,
        })
      default:
        return tErrors('api.validationFailed')
    }
  }

  const collectErrors = (issues: ZodIssue[]) => {
    return issues.reduce<LoginFormErrors>((acc, issue) => {
      const field = issue.path[0] as keyof LoginFormState | undefined
      if (!field || acc[field]) {
        return acc
      }
      acc[field] = getValidationMessage(issue)
      return acc
    }, {})
  }

  const validateValues = (nextValues: LoginFormState) => {
    const result = loginSchema.safeParse(nextValues)
    return result.success ? {} : collectErrors(result.error.issues)
  }

  const handleBlur = (field: keyof LoginFormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const nextErrors = validateValues(values)
    setErrors((prev) => ({ ...prev, [field]: nextErrors[field] }))
  }

  const handleChange = (field: keyof LoginFormState, value: string) => {
    if (apiError) {
      resetLoginMutation()
    }

    const nextValue = field === 'badgeNumber' ? value.toUpperCase() : value
    const nextValues = { ...values, [field]: nextValue }
    setValues(nextValues)

    if (touched[field]) {
      const nextErrors = validateValues(nextValues)
      setErrors((prev) => ({ ...prev, [field]: nextErrors[field] }))
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateValues(values)

    if (Object.keys(nextErrors).length > 0) {
      setTouched({ badgeNumber: true, password: true })
      setErrors(nextErrors)
      return
    }

    loginMutation.mutate({
      badgeNumber: values.badgeNumber,
      password: values.password,
      rememberMe,
       ...(callbackUrl && { redirectTo: callbackUrl }),
    })
  }

  return (
    <div className={cn('space-y-6', shake && 'auth-shake')}>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-foreground">{tAuth('login.heading')}</h1>
        <p className="text-sm text-foreground-muted">{tAuth('login.subheading')}</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label htmlFor="badge-number" className="text-sm font-medium">
            {tAuth('login.badgeNumberLabel')}
          </label>
          <InputGroup className="h-10">
            <InputGroupAddon
              className={cn(
                'text-muted-foreground transition-colors',
                'group-focus-within/input-group:text-primary',
                'group-has-[[data-slot][aria-invalid=true]]/input-group:text-destructive',
              )}
            >
              <BadgeCheck aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="badge-number"
              autoComplete="username"
              value={values.badgeNumber}
              onChange={(event) => handleChange('badgeNumber', event.target.value)}
              onBlur={() => handleBlur('badgeNumber')}
              placeholder={tAuth('login.badgeNumberPlaceholder')}
              aria-label={tA11y('auth.badgeNumber')}
              aria-invalid={Boolean(errors.badgeNumber)}
              disabled={isSubmitting}
              className="uppercase"
            />
          </InputGroup>
          {errors.badgeNumber && <FieldError message={errors.badgeNumber} />}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              {tAuth('login.passwordLabel')}
            </label>
          </div>
          <InputGroup className="h-10">
            <InputGroupAddon
              className={cn(
                'text-muted-foreground transition-colors',
                'group-focus-within/input-group:text-primary',
                'group-has-[[data-slot][aria-invalid=true]]/input-group:text-destructive',
              )}
            >
              <Lock aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={values.password}
              onChange={(event) => handleChange('password', event.target.value)}
              onBlur={() => handleBlur('password')}
              placeholder={tAuth('login.passwordPlaceholder')}
              aria-label={tA11y('auth.password')}
              aria-invalid={Boolean(errors.password)}
              disabled={isSubmitting}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label={
                  showPassword ? tA11y('auth.hidePassword') : tA11y('auth.showPassword')
                }
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
            {errors.password && <FieldError message={errors.password} />}
        </div>

        <div className="flex items-center justify-between">
          <label htmlFor="remember-me" className="flex items-center gap-2 text-xs">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
              disabled={isSubmitting}
              aria-label={tA11y('auth.rememberMe')}
            />
            <span className="text-foreground-muted">{tAuth('login.rememberMe')}</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary transition-colors hover:text-primary-hover"
          >
            {tAuth('login.forgotPassword')}
          </Link>
        </div>

        {bannerMessage ? (
          <Alert
            variant="destructive"
            className="auth-error-banner overflow-hidden border-destructive/50"
          >
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
              <span>{bannerMessage}</span>
              {rateLimitSeconds !== null ? (
                <span className="font-mono text-xs" aria-live="polite">
                  {formatCountdown(rateLimitSeconds)}
                </span>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="submit"
          className={cn('w-full justify-center gap-2', successFlash && 'auth-success-flash')}
          disabled={!isFormValid || isSubmitting}
        >
          {loginMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          {loginMutation.isPending
            ? tAuth('login.submittingButton')
            : tAuth('login.submitButton')}
        </Button>
      </form>

      <p className="text-center text-xs text-foreground-muted">{tAuth('login.noAccount')}</p>
    </div>
  )
}
