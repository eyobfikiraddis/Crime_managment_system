import { z } from 'zod'
import { EvidenceType } from '../types/evidence.types'

// Step 1 of the upload flow — metadata
export const evidenceMetadataSchema = z.object({
  description: z
    .string()
    .min(5, { message: 'Description must be at least 5 characters.' })
    .max(1000),
  evidenceType: z.nativeEnum(EvidenceType, {
    message: 'Evidence type is required.',
  }),
  collectedById: z.string().min(1, { message: 'Collected-by officer is required.' }),
  collectedAt: z.string().min(1, { message: 'Collection date is required.' }),
  storageLocation: z
    .string()
    .min(2, { message: 'Storage location is required.' })
    .max(200),
  notes: z.string().max(2000).optional(),
})

export type EvidenceMetadataValues = z.infer<typeof evidenceMetadataSchema>

// Client-side file validation (used before upload, not submitted to API)
export const evidenceFileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 50 * 1024 * 1024, {
      message: 'File must be no larger than 50 MB.',
    })
    .refine(
      (file) =>
        [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/tiff',
          'application/pdf',
          'audio/mpeg',
          'audio/wav',
          'video/mp4',
          'video/quicktime',
        ].includes(file.type),
      { message: 'File type not supported.' },
    ),
})
