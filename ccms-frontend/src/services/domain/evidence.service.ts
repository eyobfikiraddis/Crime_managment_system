import axios from 'axios'
import { apiClient } from '@services/api/client'
import {
  paginatedEvidenceSchema,
  evidenceDetailSchema,
  cloudinarySignatureSchema,
  custodyChainSchema,
} from '@features/evidence/schemas/evidence-api.schema'
import type {
  EvidenceListItem,
  Evidence,
  EvidenceFilters,
  UploadEvidencePayload,
  RecordCustodyEventPayload,
  CloudinarySignature,
  CustodyChain,
} from '@features/evidence/types/evidence.types'
import type { PaginatedResponse } from '@shared/types/api.types'

// ─── List ──────────────────────────────────────────────────────────────────
export async function getCaseEvidence(
  caseId: string,
  filters: EvidenceFilters,
): Promise<PaginatedResponse<EvidenceListItem>> {
  const params = buildEvidenceParams(filters)
  const raw = await apiClient.get(`/api/v1/cases/${caseId}/evidence?${params}`)
  return paginatedEvidenceSchema.parse(raw)
}

// ─── Detail ────────────────────────────────────────────────────────────────
export async function getEvidence(evidenceId: string): Promise<Evidence> {
  const raw = await apiClient.get(`/api/v1/evidence/${evidenceId}`)
  return evidenceDetailSchema.parse(raw)
}

// ─── Custody chain ─────────────────────────────────────────────────────────
export async function getCustodyChain(evidenceId: string): Promise<CustodyChain> {
  const raw = await apiClient.get(`/api/v1/evidence/${evidenceId}/custody`)
  return custodyChainSchema.parse(raw)
}

// ─── Cloudinary upload — three-step orchestration ─────────────────────────

// Step 1: Get a signed upload signature from the backend
export async function getCloudinarySignature(
  caseId: string,
): Promise<CloudinarySignature> {
  const raw = await apiClient.post(`/api/v1/cases/${caseId}/evidence/upload-signature`)
  return cloudinarySignatureSchema.parse(raw)
}

// Step 2: Upload the file directly to Cloudinary
// onProgress receives a 0–100 number
export async function uploadFileToCloudinary(
  file: File,
  signature: CloudinarySignature,
  onProgress: (percent: number) => void,
): Promise<{ secureUrl: string; publicId: string }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('signature', signature.signature)
  formData.append('timestamp', String(signature.timestamp))
  formData.append('api_key', signature.apiKey)
  formData.append('upload_preset', signature.uploadPreset)
  formData.append('folder', signature.folder)

  // Direct call to Cloudinary — NOT via apiClient (different base URL)
  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/auto/upload`,
    formData,
    {
      onUploadProgress: (evt) => {
        if (evt.total) {
          onProgress(Math.round((evt.loaded * 100) / evt.total))
        }
      },
    },
  )

  return {
    secureUrl: response.data.secure_url as string,
    publicId: response.data.public_id as string,
  }
}

// Step 3: Create the evidence record on the backend (includes Cloudinary URL)
export async function createEvidence(
  caseId: string,
  payload: UploadEvidencePayload,
): Promise<Evidence> {
  const raw = await apiClient.post(`/api/v1/cases/${caseId}/evidence`, payload)
  return evidenceDetailSchema.parse(raw)
}

// ─── Update ────────────────────────────────────────────────────────────────
export async function updateEvidence(
  evidenceId: string,
  payload: Partial<UploadEvidencePayload>,
): Promise<Evidence> {
  const raw = await apiClient.patch(`/api/v1/evidence/${evidenceId}`, payload)
  return evidenceDetailSchema.parse(raw)
}

// ─── Delete ────────────────────────────────────────────────────────────────
export async function deleteEvidence(evidenceId: string): Promise<void> {
  await apiClient.delete(`/api/v1/evidence/${evidenceId}`)
}

// ─── Custody ───────────────────────────────────────────────────────────────
export async function recordCustodyEvent(
  evidenceId: string,
  payload: RecordCustodyEventPayload,
): Promise<Evidence> {
  const raw = await apiClient.post(
    `/api/v1/evidence/${evidenceId}/custody-events`,
    payload,
  )
  return evidenceDetailSchema.parse(raw)
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function buildEvidenceParams(filters: EvidenceFilters): string {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.evidenceType?.length) params.set('evidenceType', filters.evidenceType.join(','))
  if (filters.collectedById) params.set('collectedById', filters.collectedById)
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  params.set('page', String(filters.page ?? 1))
  params.set('pageSize', String(filters.pageSize ?? 25))
  if (filters.sortField) params.set('sortField', filters.sortField)
  if (filters.sortDirection) params.set('sortDirection', filters.sortDirection)
  return params.toString()
}
