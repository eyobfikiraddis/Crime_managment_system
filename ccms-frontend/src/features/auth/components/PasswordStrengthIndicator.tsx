'use client'

import { CheckCircle, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'
import { analysePasswordStrength } from '@/features/auth/utils/password-strength'

interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const tAuth = useTranslations('auth')
  const { strength, score, requirements } = analysePasswordStrength(password)

  const strengthLabel = {
    weak: tAuth('resetPassword.passwordStrength.weak'),
    fair: tAuth('resetPassword.passwordStrength.fair'),
    strong: tAuth('resetPassword.passwordStrength.strong'),
    veryStrong: tAuth('resetPassword.passwordStrength.veryStrong'),
  }[strength]

  const activeSegments = Math.max(1, score)
  const activeColorClass =
    strength === 'weak'
      ? 'bg-destructive'
      : strength === 'fair'
        ? 'bg-warning'
        : 'bg-success'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground-muted">
          {tAuth('resetPassword.passwordStrength.label')}
        </span>
        <span className="font-semibold text-foreground">{strengthLabel}</span>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {Array.from({ length: 4 }, (_, index) => (
          <span
            key={`strength-${index}`}
            className={cn(
              'h-1.5 rounded-full bg-muted transition-colors duration-150',
              index < activeSegments && activeColorClass,
            )}
          />
        ))}
      </div>
      <div className="space-y-2 text-xs">
        <p className="text-foreground-muted">{tAuth('resetPassword.requirements.title')}</p>
        <RequirementItem
          met={requirements.minLength}
          label={tAuth('resetPassword.requirements.minLength')}
        />
        <RequirementItem
          met={requirements.uppercase}
          label={tAuth('resetPassword.requirements.uppercase')}
        />
        <RequirementItem
          met={requirements.digit}
          label={tAuth('resetPassword.requirements.number')}
        />
        <RequirementItem
          met={requirements.special}
          label={tAuth('resetPassword.requirements.special')}
        />
      </div>
    </div>
  )
}

interface RequirementItemProps {
  met: boolean
  label: string
}

function RequirementItem({ met, label }: RequirementItemProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative inline-flex size-4 items-center justify-center">
        <XCircle
          className={cn(
            'absolute size-4 text-muted-foreground transition-opacity duration-150',
            met && 'opacity-0',
          )}
          aria-hidden="true"
        />
        <CheckCircle
          className={cn(
            'absolute size-4 text-success transition-opacity duration-150',
            met ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden="true"
        />
      </span>
      <span className={cn('transition-colors duration-150', met ? 'text-foreground' : 'text-foreground-muted')}>
        {label}
      </span>
    </div>
  )
}
