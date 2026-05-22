interface FieldErrorProps {
  message?: string
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) {
    return null
  }

  return (
    <p role="alert" aria-live="assertive" className="text-xs text-destructive">
      {message}
    </p>
  )
}
