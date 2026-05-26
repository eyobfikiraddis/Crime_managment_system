import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { forgotPassword } from '@/services/domain/auth.service'
import { ApiError } from '@/services/api/errors'

export function useForgotPassword() {
  const [successEmail, setSuccessEmail] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (email: string) => forgotPassword(email),
    onSuccess: (_response, email) => {
      setSuccessEmail(email)
    },
    onError: (error, email) => {
      if (error instanceof ApiError && error.isNotFound()) {
        setSuccessEmail(email)
      }
    },
  })

  return { ...mutation, successEmail }
}
