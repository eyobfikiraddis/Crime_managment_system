import type { AxiosError } from 'axios'

import { apiErrorSchema } from '@/shared/schemas/api-error.schema'

export class ApiError extends Error {
  statusCode: number
  code?: string
  fieldErrors?: Record<string, string[]>
  requestId?: string
  retryAfterSeconds?: number

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    fieldErrors?: Record<string, string[]>,
    requestId?: string,
    retryAfterSeconds?: number,
  ) {
    super(message)
    this.statusCode = statusCode
    if (code !== undefined) this.code = code
    if (fieldErrors !== undefined) this.fieldErrors = fieldErrors
    if (requestId !== undefined) this.requestId = requestId
    if (retryAfterSeconds !== undefined) this.retryAfterSeconds = retryAfterSeconds
  }

  static fromAxiosError(error: AxiosError) {
    const statusCode = error.response?.status ?? 0
    const parsed = apiErrorSchema.safeParse(error.response?.data)
    const payload = parsed.success ? parsed.data : {}
    const message = payload.message ?? error.message ?? 'Request failed'
    const retryAfterRaw = error.response?.headers?.['retry-after']
    const retryAfterSeconds = retryAfterRaw ? Number(retryAfterRaw) : undefined
    const parsedRetryAfter = Number.isFinite(retryAfterSeconds)
      ? retryAfterSeconds
      : undefined

    return new ApiError(
      message,
      statusCode,
      payload.code as string | undefined,
      (payload.fieldErrors as Record<string, string[]>) ?? undefined,
      payload.requestId as string | undefined,
      parsedRetryAfter,
    )
  }

  isValidationError() {
    return this.statusCode === 422
  }

  isForbidden() {
    return this.statusCode === 403
  }

  isUnauthorized() {
    return this.statusCode === 401
  }

  isNotFound() {
    return this.statusCode === 404
  }

  isRateLimited() {
    return this.statusCode === 429
  }

  isServerError() {
    return this.statusCode >= 500
  }

  getFieldErrors() {
    if (!this.isValidationError() || !this.fieldErrors) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(this.fieldErrors)
        .filter(([, messages]) => messages.length > 0)
        .map(([field, messages]) => [field, messages[0]]),
    )
  }
}
