'use client'

import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import {
  createEvidence,
  getCloudinarySignature,
  uploadFileToCloudinary,
} from '@services/domain/evidence.service'
import { evidenceKeys } from '@services/query/keys/evidenceKeys'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { EvidenceMetadataValues } from '../schemas/upload-evidence.schema'

const IDLE_STATE = { phase: 'idle', progress: 0, error: null } as const

type UploadPhase =
  | 'idle'
  | 'signing'
  | 'uploading'
  | 'recording'
  | 'success'
  | 'error'

interface UploadState {
  phase: UploadPhase
  progress: number
  error: string | null
}

export function useUploadEvidence(caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('evidence')

  const [uploadState, setUploadState] = useState<UploadState>(IDLE_STATE)

  const reset = useCallback(() => {
    setUploadState(IDLE_STATE)
  }, [])

  const upload = useCallback(
    async (metadata: EvidenceMetadataValues, file: File | null) => {
      setUploadState(IDLE_STATE)

      let cloudinaryUrl: string | undefined
      let cloudinaryPublicId: string | undefined

      try {
        // ── Step 1: Get signature (if file provided) ───────────────────────
        if (file) {
          setUploadState({ phase: 'signing', progress: 0, error: null })
          const sig = await getCloudinarySignature(caseId)

          // ── Step 2: Upload to Cloudinary ───────────────────────────────
          setUploadState({ phase: 'uploading', progress: 0, error: null })
          const result = await uploadFileToCloudinary(file, sig, (percent) => {
            setUploadState({ phase: 'uploading', progress: percent, error: null })
          })
          cloudinaryUrl = result.secureUrl
          cloudinaryPublicId = result.publicId
        }

        // ── Step 3: Create record on backend ─────────────────────────────
        setUploadState({ phase: 'recording', progress: 100, error: null })
        await createEvidence(caseId, {
          ...metadata,
          cloudinaryUrl,
          cloudinaryPublicId,
        })

        setUploadState({ phase: 'success', progress: 100, error: null })

        // Invalidate both the evidence list and the case summary
        void queryClient.invalidateQueries({ queryKey: evidenceKeys.caseEvidence(caseId) })
        void queryClient.invalidateQueries({ queryKey: caseKeys.summary(caseId) })

        addToast({ message: t('upload.successMessage'), variant: 'success' })
      } catch (err: unknown) {
        const message = err instanceof ApiError ? err.message : t('upload.errorMessage')
        setUploadState({ phase: 'error', progress: 0, error: message })
      }
    },
    [addToast, caseId, queryClient, t],
  )

  const isPending =
    uploadState.phase !== 'idle' &&
    uploadState.phase !== 'success' &&
    uploadState.phase !== 'error'

  return { upload, uploadState, reset, isPending }
}
