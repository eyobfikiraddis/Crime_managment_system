'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { AlertCircle, CheckCircle, Loader2, Mail } from 'lucide-react'
import type { ZodIssue } from 'zod'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { useForgotPassword } from '@/features/auth/hooks/useForgotPassword'
import { forgotPasswordSchema } from '@/features/auth/schemas/forgot-password.schema'
import { ApiError } from '@/services/api/errors'
import { FieldError } from '@/shared/components/forms/FieldError'
import { cn } from '@/lib/utils'

export function ForgotPasswordForm() {
  const tAuth = useTranslations('auth')
  const tErrors = useTranslations('errors')
  const tA11y = useTranslations('accessibility')

  const forgotMutation = useForgotPassword()
  const apiError = forgotMutation.error instanceof ApiError ? forgotMutation.error : null
  const successEmail = forgotMutation.successEmail
  const isSuccess = Boolean(successEmail)

  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const isFormValid = useMemo(() => forgotPasswordSchema.safeParse({ email }).success, [email])

  const bannerMessage = useMemo(() => {
    if (!apiError) {
      return null
    }

    if (apiError.isRateLimited()) {
      return tAuth('forgotPassword.errors.rateLimited')
    }

    if (apiError.statusCode === 0) {
      return tAuth('forgotPassword.errors.networkError')
    }

    if (apiError.isServerError()) {
      return tAuth('forgotPassword.errors.serverError')
    }

    return tErrors('api.generic')
  }, [apiError, tAuth, tErrors])

  const getValidationMessage = (issue: ZodIssue) => {
    switch (issue.message) {
      case 'required':
        return tErrors('validation.required')
      case 'email':
        return tErrors('validation.email')
      default:
        return tErrors('api.validationFailed')
    }
  }

  const validateEmail = (nextEmail: string) => {
    const result = forgotPasswordSchema.safeParse({ email: nextEmail })
    if (result.success) {
      return undefined
    }

    const issue = result.error.issues[0]
    return issue ? getValidationMessage(issue) : tErrors('api.validationFailed')
  }

  const handleBlur = () => {
    setTouched(true)
    setError(validateEmail(email))
  }

  const handleChange = (value: string) => {
    if (apiError) {
      forgotMutation.reset()
    }

    setEmail(value)
    if (touched) {
      setError(validateEmail(value))
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextError = validateEmail(email)

    if (nextError) {
      setTouched(true)
      setError(nextError)
      return
    }

    forgotMutation.mutate(email)
  }

  return (
    <div className="relative min-h-[320px]">
      <div
        className={cn(
          'space-y-6 transition-opacity duration-200',
          isSuccess && 'pointer-events-none opacity-0',
        )}
        aria-hidden={isSuccess}
      >
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">{tAuth('forgotPassword.heading')}</h1>
          <p className="text-sm text-foreground-muted">{tAuth('forgotPassword.subheading')}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label htmlFor="forgot-email" className="text-sm font-medium">
              {tAuth('forgotPassword.emailLabel')}
            </label>
            <InputGroup className="h-10">
              <InputGroupAddon
                className={cn(
                  'text-muted-foreground transition-colors',
                  'group-focus-within/input-group:text-primary',
                  'group-has-[[data-slot][aria-invalid=true]]/input-group:text-destructive',
                )}
              >
                <Mail aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => handleChange(event.target.value)}
                onBlur={handleBlur}
                placeholder={tAuth('forgotPassword.emailPlaceholder')}
                aria-label={tA11y('auth.email')}
                aria-invalid={Boolean(error)}
                disabled={forgotMutation.isPending}
              />
            </InputGroup>
            <FieldError message={error ?? ""} />
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
            disabled={!isFormValid || forgotMutation.isPending}
          >
            {forgotMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {forgotMutation.isPending
              ? tAuth('forgotPassword.submittingButton')
              : tAuth('forgotPassword.submitButton')}
          </Button>
        </form>

        <Link
          href="/login"
          className="text-sm text-foreground-muted transition-colors hover:text-foreground"
        >
          {tAuth('forgotPassword.backToLogin')}
        </Link>
      </div>

      <div
        className={cn(
          'absolute inset-0 flex flex-col items-center justify-center gap-4 text-center transition-opacity duration-200',
          isSuccess ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-live="polite"
        aria-hidden={!isSuccess}
      >
        <CheckCircle className="size-12 text-success" aria-hidden="true" />
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">
            {tAuth('forgotPassword.successTitle')}
          </h1>
          <p className="text-sm text-foreground-muted">
            {tAuth('forgotPassword.successDescription', { email: successEmail ?? '' })}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/login">{tAuth('forgotPassword.backToLogin')}</Link>
        </Button>
      </div>
    </div>
  )
}
