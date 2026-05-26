'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from 'lucide-react'
import type { ZodIssue } from 'zod'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { useResetPassword } from '@/features/auth/hooks/useResetPassword'
import { resetPasswordSchema } from '@/features/auth/schemas/reset-password.schema'
import { ApiError } from '@/services/api/errors'
import { FieldError } from '@/shared/components/forms/FieldError'
import { cn } from '@/lib/utils'
import { PasswordStrengthIndicator } from '@/features/auth/components/PasswordStrengthIndicator'

interface ResetPasswordFormProps {
  token?: string
}

type ResetFormState = {
  password: string
  confirmPassword: string
}

type ResetFormErrors = Partial<Record<keyof ResetFormState, string>>

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const tAuth = useTranslations('auth')
  const tErrors = useTranslations('errors')
  const tA11y = useTranslations('accessibility')

  const resetMutation = useResetPassword()
  const apiError = resetMutation.error instanceof ApiError ? resetMutation.error : null

  const [values, setValues] = useState<ResetFormState>({ password: '', confirmPassword: '' })
  const [touched, setTouched] = useState<Record<keyof ResetFormState, boolean>>({
    password: false,
    confirmPassword: false,
  })
  const [errors, setErrors] = useState<ResetFormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [invalidToken, setInvalidToken] = useState(!token)
  const [countdown, setCountdown] = useState(3)

  const isFormValid = useMemo(() => resetPasswordSchema.safeParse(values).success, [values])

  useEffect(() => {
    if (!apiError) {
      return
    }

    if (apiError.isUnauthorized() || apiError.isNotFound() || apiError.statusCode === 400) {
      setInvalidToken(true)
    }
  }, [apiError])

  useEffect(() => {
    if (!resetMutation.isSuccess) {
      return
    }

    setCountdown(3)
    const intervalId = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [resetMutation.isSuccess])

  const bannerMessage = useMemo(() => {
    if (!apiError || invalidToken) {
      return null
    }

    if (apiError.isRateLimited()) {
      return tAuth('resetPassword.errors.rateLimited')
    }

    if (apiError.statusCode === 0) {
      return tAuth('resetPassword.errors.networkError')
    }

    if (apiError.isServerError()) {
      return tAuth('resetPassword.errors.serverError')
    }

    return tErrors('api.generic')
  }, [apiError, invalidToken, tAuth, tErrors])

  const getValidationMessage = (issue: ZodIssue) => {
    switch (issue.message) {
      case 'required':
        return tErrors('validation.required')
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
    return issues.reduce<ResetFormErrors>((acc, issue) => {
      const field = issue.path[0] as keyof ResetFormState | undefined
      if (!field || acc[field]) {
        return acc
      }
      acc[field] = getValidationMessage(issue)
      return acc
    }, {})
  }

  const validateValues = (nextValues: ResetFormState) => {
    const result = resetPasswordSchema.safeParse(nextValues)
    return result.success ? {} : collectErrors(result.error.issues)
  }

  const handleBlur = (field: keyof ResetFormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const nextErrors = validateValues(values)
    setErrors((prev) => ({ ...prev, [field]: nextErrors[field] }))
  }

  const handleChange = (field: keyof ResetFormState, value: string) => {
    if (apiError) {
      resetMutation.reset()
    }

    const nextValues = { ...values, [field]: value }
    setValues(nextValues)

    if (touched[field]) {
      const nextErrors = validateValues(nextValues)
      setErrors((prev) => ({ ...prev, [field]: nextErrors[field] }))
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!token) {
      setInvalidToken(true)
      return
    }

    const nextErrors = validateValues(values)
    if (Object.keys(nextErrors).length > 0) {
      setTouched({ password: true, confirmPassword: true })
      setErrors(nextErrors)
      return
    }

    resetMutation.mutate({
      token,
      password: values.password,
      confirmPassword: values.confirmPassword,
    })
  }

  if (invalidToken) {
    return (
      <div className="space-y-6 text-center">
        <AlertTriangle className="mx-auto size-12 text-warning" aria-hidden="true" />
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">
            {tAuth('resetPassword.invalidTokenTitle')}
          </h1>
          <p className="text-sm text-foreground-muted">
            {tAuth('resetPassword.invalidTokenDescription')}
          </p>
        </div>
        <Button asChild>
          <Link href="/forgot-password">{tAuth('resetPassword.invalidTokenAction')}</Link>
        </Button>
      </div>
    )
  }

  if (resetMutation.isSuccess) {
    return (
      <div className="space-y-6 text-center" aria-live="polite">
        <CheckCircle className="mx-auto size-12 text-success" aria-hidden="true" />
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">
            {tAuth('resetPassword.successTitle')}
          </h1>
          <p className="text-sm text-foreground-muted">
            {tAuth('resetPassword.successDescription')}
          </p>
        </div>
        <p className="text-xs font-mono text-foreground-muted">
          {tAuth('resetPassword.redirectCountdown', { seconds: countdown })}
        </p>
        <Button variant="outline" asChild>
          <Link href="/login">{tAuth('resetPassword.backToLogin')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-foreground">{tAuth('resetPassword.heading')}</h1>
        <p className="text-sm text-foreground-muted">{tAuth('resetPassword.subheading')}</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label htmlFor="new-password" className="text-sm font-medium">
            {tAuth('resetPassword.newPasswordLabel')}
          </label>
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
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => handleChange('password', event.target.value)}
              onBlur={() => handleBlur('password')}
              placeholder={tAuth('resetPassword.newPasswordPlaceholder')}
              aria-label={tA11y('auth.newPassword')}
              aria-invalid={Boolean(errors.password)}
              disabled={resetMutation.isPending}
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
                disabled={resetMutation.isPending}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {errors.password && <FieldError message={errors.password} />}
        </div>

        <PasswordStrengthIndicator password={values.password} />

        <div className="space-y-1">
          <label htmlFor="confirm-password" className="text-sm font-medium">
            {tAuth('resetPassword.confirmPasswordLabel')}
          </label>
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
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={(event) => handleChange('confirmPassword', event.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              placeholder={tAuth('resetPassword.confirmPasswordPlaceholder')}
              aria-label={tA11y('auth.confirmPassword')}
              aria-invalid={Boolean(errors.confirmPassword)}
              disabled={resetMutation.isPending}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label={
                  showConfirmPassword
                    ? tA11y('auth.hidePassword')
                    : tA11y('auth.showPassword')
                }
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                disabled={resetMutation.isPending}
              >
                {showConfirmPassword ? <EyeOff /> : <Eye />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {errors.confirmPassword && <FieldError message={errors.confirmPassword} />}
        </div>

        {bannerMessage ? (
          <Alert variant="destructive" className="auth-error-banner">
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertDescription>{bannerMessage}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="submit"
          className="w-full justify-center gap-2"
          disabled={!isFormValid || resetMutation.isPending}
        >
          {resetMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {resetMutation.isPending
            ? tAuth('resetPassword.submittingButton')
            : tAuth('resetPassword.submitButton')}
        </Button>
      </form>

      <Link
        href="/login"
        className="text-sm text-foreground-muted transition-colors hover:text-foreground"
      >
        {tAuth('resetPassword.backToLogin')}
      </Link>
    </div>
  )
}
