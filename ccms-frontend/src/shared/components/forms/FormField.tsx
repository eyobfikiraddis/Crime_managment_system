import type { ReactNode } from 'react'
import { Children, cloneElement, isValidElement, useId } from 'react'

import { FieldError } from './FieldError'

interface FormFieldProps {
  label: string
  required?: boolean | undefined
  helperText?: string | undefined
  error?: string | undefined
  children: ReactNode
}

export function FormField({ label, required, helperText, error, children }: FormFieldProps) {
  const fieldId = useId()
  const errorId = `${fieldId}-error`
  const helperId = `${fieldId}-helper`

  const describedBy = [helperText ? helperId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ')

  const content = Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child
    }

    return cloneElement(child as any, {
      id: fieldId,
      'aria-invalid': Boolean(error),
      'aria-describedby': describedBy || undefined,
    } as any)
  })

  return (
    <div className="space-y-1">
      <label htmlFor={fieldId} className="text-sm font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      {content}
      {helperText ? (
        <p id={helperId} className="text-xs text-foreground-muted">
          {helperText}
        </p>
      ) : null}
      <div id={errorId}>
        <FieldError message={error ?? ''} />
      </div>
    </div>
  )
}
