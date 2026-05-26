export type PasswordStrength = 'weak' | 'fair' | 'strong' | 'veryStrong'

export type PasswordRequirements = {
  minLength: boolean
  uppercase: boolean
  digit: boolean
  special: boolean
}

export type PasswordStrengthResult = {
  strength: PasswordStrength
  score: number
  requirements: PasswordRequirements
}

export function analysePasswordStrength(password: string): PasswordStrengthResult {
  const requirements: PasswordRequirements = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    digit: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{}|;':\",.<>/?]/.test(password),
  }

  const score = Object.values(requirements).filter(Boolean).length
  const strength: PasswordStrength =
    score <= 1 ? 'weak' : score === 2 ? 'fair' : score === 3 ? 'strong' : 'veryStrong'

  return { strength, score, requirements }
}
