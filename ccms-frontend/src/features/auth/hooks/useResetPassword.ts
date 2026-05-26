import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { resetPassword } from '@/services/domain/auth.service'
import type { ResetPasswordPayload } from '@/shared/types/auth.types'

export function useResetPassword() {
  const router = useRouter()
  const [isSuccess, setIsSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: (payload: ResetPasswordPayload) => resetPassword(payload),
    onSuccess: () => {
      setIsSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    },
  })

  return { ...mutation, isSuccess }
}
