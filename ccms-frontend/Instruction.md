# CCMS Frontend — Phase 4: Evidence Module
## Execution Specification for AI Agent
### Year: 2026 | Runtime: Modern 2026 Ecosystem | Package Manager: pnpm | Target: Production-Grade Enterprise Frontend

---

# 1. Mission Overview

## 1.1 Current Project State

Phases 1 through 3 are complete. The following is fully operational:

- **Foundation & Infrastructure**: Project scaffold, design tokens, Tailwind v4, all three Zustand stores, Axios client with 401 refresh queue, React Query with all 12 key factories, App Shell (Sidebar, TopBar, Breadcrumb), middleware, all shared components, i18n (EN + AM)
- **Auth Module**: Login, logout, forgot-password, reset-password, idle session timeout, silent token refresh
- **Cases Module**: Cases list (filters, sorting, pagination, DataTable), multi-step case creation wizard, case detail layout (header card, interactive status badge, nine-tab navigation), case overview tab (metadata, summary panels, officers, recent activity), case timeline tab (30s polling, add-note, diff viewer, print), status transition drawer
- **Route coverage**: All dashboard skeleton routes render; `/403`, admin skeleton pages, and settings skeleton pages created
- **i18n completeness test**: Passes for `common`, `auth`, `navigation`, `errors`, `accessibility`, `cases` namespaces

## 1.2 Phase 4 Objective

Phase 4 delivers the **Evidence module** — the most technically complex feature in the CCMS. Evidence management sits at the intersection of file handling, chain-of-custody law, and forensic integrity. Every engineering and UX decision must reflect the weight of that context.

Evidence in CCMS is managed **within the context of a case**. There is no top-level `/evidence` route. All evidence UI lives inside `/cases/[caseId]/evidence/` — the tab skeleton placed in Phase 3 is replaced by the full implementation in this phase.

**Phase 4 delivers four tightly integrated sub-systems:**

1. **Evidence Tab** — Replaces the Phase 3 skeleton at `/cases/[caseId]/evidence`. Full DataTable with gallery toggle, filter bar, row actions, and context-sensitive empty state.
2. **Evidence Upload Flow** — A `SlideOverDrawer` containing a two-section form: metadata fields and a `FileUploadZone` wired to Cloudinary via the backend signature endpoint. Handles progress, retries, and failure gracefully.
3. **Evidence Detail Drawer** — An inline slide-over showing full evidence metadata, the chain of custody timeline, and forensic fields. Opens without navigating away from the list.
4. **Lightbox Viewer** — Full-screen image viewer for photo evidence with keyboard navigation, zoom, and metadata slide-in panel.

**Also in scope:**

- Evidence types, Zod schemas, service implementation, and all React Query hooks
- Full population of `messages/en/evidence.json` and `messages/am/evidence.json` (replacing the Phase 2 skeleton)
- Cloudinary upload integration via backend-signed upload (server provides upload signature; file goes directly to Cloudinary CDN; Cloudinary URL returned to backend for record creation)
- Chain of custody gap detection: amber dashed connector + warning badge when > 24 hours elapse between sequential custody events with no recorded transfer
- Evidence `evidenceId` detail route: `/cases/[caseId]/evidence/[evidenceId]/page.tsx` — renders a full-page detail view for non-image evidence that benefits from a dedicated page (e.g., forensic reports, weapons)

## 1.3 Package Manager

All commands use **pnpm**. No npm or yarn.

## 1.4 What Must Be Completed

**Evidence service (`src/services/domain/evidence.service.ts`):**
- Replace all stubs with real Axios calls
- All endpoints listed in Appendix C of the blueprint (`/api/v1/evidence` + photos — 16 endpoints)
- Cloudinary signature endpoint call
- Response validation via Zod

**Evidence types and schemas:**
- All TypeScript types: `Evidence`, `EvidenceListItem`, `EvidenceType`, `CustodyEvent`, `CustodyChain`, `PhotoEvidence`, `ForensicReport`, `EvidenceFilters`, `UploadEvidencePayload`
- All Zod schemas: evidence metadata form, upload validation, custody event schema, API response schemas
- Evidence type enum and variant mapping

**Evidence query hooks:**
- `useEvidenceList(caseId, filters)` — list with filter params
- `useEvidence(evidenceId)` — single evidence detail
- `useCustodyChain(evidenceId)` — full chain of custody for one evidence item
- `useUploadEvidence(caseId)` — create mutation with Cloudinary upload orchestration
- `useUpdateEvidence(evidenceId)` — update mutation
- `useDeleteEvidence(evidenceId)` — deletion mutation with `DestructiveConfirmDialog`
- `useRecordCustodyEvent(evidenceId)` — custody transfer mutation

**Evidence i18n messages:**
- Fully populate `messages/en/evidence.json` and `messages/am/evidence.json`

**Evidence tab (`/cases/[caseId]/evidence/page.tsx`):**
- Replace Phase 3 skeleton with full implementation
- `PageHeader`: "Evidence" title + evidence count + "Add Evidence" button (permission guarded)
- Filter bar: evidence type filter, collected-by officer search, date range, search by description
- Active filter chips
- DataTable view (default): all columns, sortable, kebab row actions
- Gallery view toggle: masonry grid of evidence cards for photo evidence
- Loading, empty, and error states

**Evidence upload drawer:**
- `SlideOverDrawer` triggered by "Add Evidence" button
- Section 1: Metadata (description, evidence type, collected-by officer, collected-at date, storage location, notes)
- Section 2: Media upload (conditional — only for evidence types that support files)
- Full Cloudinary upload flow: signature → upload with progress → record creation
- Retry on failure without losing metadata

**Evidence detail drawer:**
- Opens when clicking any non-photo evidence item; photo evidence opens the Lightbox
- Full metadata card
- Chain of custody timeline with gap detection
- Forensic report section (forensic role only)
- Vehicle/weapon additional fields section (conditional by evidence type)

**Evidence detail page (`/cases/[caseId]/evidence/[evidenceId]/page.tsx`):**
- Full-page detail view (Server Component rendering a Client Component)
- Used for evidence types that warrant a dedicated page

**Lightbox viewer:**
- Full-screen overlay for photo evidence
- Left/right navigation between photos in the case
- Keyboard: `←`/`→` navigate, `Esc` closes, `+`/`-` or scroll-wheel zooms
- Metadata panel: slides in from the right on button click
- Download button (permission guarded)
- Touch swipe support (mobile)

## 1.5 What Must NOT Be Implemented

- Evidence editing (full edit form) — add to backlog for Phase 5 hardening
- Bulk evidence operations (bulk delete, bulk custody transfer) — Phase 11
- Forensic report creation UI — Phase 11
- MSW mocking — still deferred
- Chain of custody PDF export — Phase 11

## 1.6 Handoff Standard

When Phase 4 finishes:
- Navigating to `/cases/[caseId]/evidence` shows the full evidence list (DataTable + gallery toggle)
- "Add Evidence" opens the upload drawer; completing it creates the evidence record and optionally uploads a file to Cloudinary
- Clicking an evidence row opens the detail drawer with chain of custody timeline
- Clicking a photo evidence card opens the Lightbox with keyboard and touch navigation
- `pnpm type-check` — zero errors
- `pnpm lint` — zero warnings
- `pnpm test` — all evidence tests pass
- i18n completeness test passes for the `evidence` namespace

---

# 2. Dependencies

No new packages are required. All dependencies are already installed:
- `axios` — HTTP calls including Cloudinary direct upload with `onUploadProgress`
- `@tanstack/react-query` — all query/mutation hooks
- `zod` — response and form validation
- `react-hook-form` + `@hookform/resolvers` — upload form
- `lucide-react` — all icons

Verify `date-fns` is installed (used for custody gap detection):
```bash
pnpm why date-fns
```

---

# 3. Type Definitions

## 3.1 `src/features/evidence/types/evidence.types.ts`

```typescript
// ─── Evidence Type enum ────────────────────────────────────────────────────
export const EvidenceType = {
  DIGITAL: 'DIGITAL',                  // Screenshots, files, logs
  CRIME_SCENE_PHOTO: 'CRIME_SCENE_PHOTO',
  PHYSICAL: 'PHYSICAL',                // Physical objects
  DOCUMENT: 'DOCUMENT',               // Papers, records
  BIOLOGICAL: 'BIOLOGICAL',           // DNA, blood, hair
  FORENSIC_REPORT: 'FORENSIC_REPORT', // Lab reports
  WEAPON: 'WEAPON',
  VEHICLE: 'VEHICLE',
  WITNESS_STATEMENT: 'WITNESS_STATEMENT',
  AUDIO: 'AUDIO',
  VIDEO: 'VIDEO',
  OTHER: 'OTHER',
} as const
export type EvidenceType = (typeof EvidenceType)[keyof typeof EvidenceType]

// Evidence types that support file/media uploads
export const MEDIA_EVIDENCE_TYPES: EvidenceType[] = [
  EvidenceType.CRIME_SCENE_PHOTO,
  EvidenceType.DIGITAL,
  EvidenceType.DOCUMENT,
  EvidenceType.AUDIO,
  EvidenceType.VIDEO,
]

// Evidence types that display in the gallery view
export const GALLERY_EVIDENCE_TYPES: EvidenceType[] = [
  EvidenceType.CRIME_SCENE_PHOTO,
]

// ─── Custody event ─────────────────────────────────────────────────────────
export const CustodyEventType = {
  COLLECTED: 'COLLECTED',
  TRANSFERRED: 'TRANSFERRED',
  EXAMINED: 'EXAMINED',
  STORED: 'STORED',
  PRESENTED_IN_COURT: 'PRESENTED_IN_COURT',
  RETURNED: 'RETURNED',
  DESTROYED: 'DESTROYED',
} as const
export type CustodyEventType = (typeof CustodyEventType)[keyof typeof CustodyEventType]

export interface CustodyOfficer {
  id: string
  badgeNumber: string
  firstName: string
  lastName: string
  departmentName: string
}

export interface CustodyEvent {
  id: string
  eventType: CustodyEventType
  fromOfficer: CustodyOfficer | null   // null on initial collection
  toOfficer: CustodyOfficer
  location: string
  reason: string | null
  notes: string | null
  timestamp: string                    // ISO 8601
  isImmutable: true                    // Always true — emphasise in UI
}

// A gap is detected when two consecutive events are more than 24 hours apart
export interface CustodyGap {
  afterEventId: string
  gapHours: number
}

export interface CustodyChain {
  events: CustodyEvent[]
  gaps: CustodyGap[]                   // Computed server-side or client-side
  isIntact: boolean                    // true if no gaps
}

// ─── Forensic report ───────────────────────────────────────────────────────
export interface ForensicReport {
  id: string
  reportNumber: string
  submittedBy: CustodyOfficer
  labName: string
  findings: string
  conclusion: string
  submittedAt: string
}

// ─── Vehicle / weapon extras ───────────────────────────────────────────────
export interface VehicleDetails {
  make: string
  model: string
  year: number | null
  licensePlate: string
  color: string
  vin: string | null
}

export interface WeaponDetails {
  weaponType: string
  make: string
  model: string
  serialNumber: string | null
  caliber: string | null
}

// ─── Core evidence entity ──────────────────────────────────────────────────
export interface EvidenceListItem {
  id: string
  evidenceNumber: string               // e.g. "EVD-2026-00042"
  caseId: string
  evidenceType: EvidenceType
  description: string
  collectedBy: CustodyOfficer
  collectedAt: string                  // ISO 8601
  storageLocation: string
  custodyStatus: CustodyEventType      // Most recent custody event type
  hasMedia: boolean
  mediaUrl: string | null              // Cloudinary URL (null if no file)
  thumbnailUrl: string | null          // Cloudinary thumbnail transformation URL
  createdAt: string
}

export interface Evidence extends EvidenceListItem {
  notes: string | null
  custodyChain: CustodyChain
  forensicReport: ForensicReport | null
  vehicleDetails: VehicleDetails | null
  weaponDetails: WeaponDetails | null
}

// ─── Filters ───────────────────────────────────────────────────────────────
export interface EvidenceFilters {
  search?: string
  evidenceType?: EvidenceType[]
  collectedById?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
  sortField?: 'evidenceNumber' | 'collectedAt' | 'evidenceType' | 'custodyStatus'
  sortDirection?: 'asc' | 'desc'
}

// ─── Upload ────────────────────────────────────────────────────────────────
export interface CloudinarySignature {
  signature: string
  timestamp: number
  cloudName: string
  apiKey: string
  uploadPreset: string
  folder: string
}

export interface UploadEvidencePayload {
  description: string
  evidenceType: EvidenceType
  collectedById: string
  collectedAt: string
  storageLocation: string
  notes?: string
  cloudinaryUrl?: string              // Populated after successful Cloudinary upload
  cloudinaryPublicId?: string
}

export interface RecordCustodyEventPayload {
  eventType: CustodyEventType
  toOfficerId: string
  location: string
  reason?: string
  notes?: string
}
```

## 3.2 Barrel (`src/features/evidence/types/index.ts`)

Re-export all types.

---

# 4. Zod Schemas

## 4.1 `src/features/evidence/schemas/upload-evidence.schema.ts`

```typescript
import { z } from 'zod'
import { EvidenceType } from '../types/evidence.types'

// Step 1 of the upload flow — metadata
export const evidenceMetadataSchema = z.object({
  description: z
    .string()
    .min(5, { message: 'Description must be at least 5 characters.' })
    .max(1000),
  evidenceType: z.nativeEnum(EvidenceType, {
    required_error: 'Evidence type is required.',
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
    .refine(
      (f) => f.size <= 50 * 1024 * 1024,
      { message: 'File must be no larger than 50 MB.' },
    )
    .refine(
      (f) =>
        [
          'image/jpeg', 'image/png', 'image/webp', 'image/tiff',
          'application/pdf',
          'audio/mpeg', 'audio/wav',
          'video/mp4', 'video/quicktime',
        ].includes(f.type),
      { message: 'File type not supported.' },
    ),
})
```

## 4.2 `src/features/evidence/schemas/custody-event.schema.ts`

```typescript
import { z } from 'zod'
import { CustodyEventType } from '../types/evidence.types'

export const recordCustodyEventSchema = z.object({
  eventType: z.nativeEnum(CustodyEventType, {
    required_error: 'Event type is required.',
  }),
  toOfficerId: z.string().min(1, { message: 'Receiving officer is required.' }),
  location: z.string().min(2, { message: 'Location is required.' }).max(200),
  reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
})

export type RecordCustodyEventValues = z.infer<typeof recordCustodyEventSchema>
```

## 4.3 `src/features/evidence/schemas/evidence-api.schema.ts`

```typescript
import { z } from 'zod'
import { EvidenceType, CustodyEventType } from '../types/evidence.types'

const custodyOfficerSchema = z.object({
  id: z.string().uuid(),
  badgeNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  departmentName: z.string(),
})

const custodyEventSchema = z.object({
  id: z.string().uuid(),
  eventType: z.nativeEnum(CustodyEventType),
  fromOfficer: custodyOfficerSchema.nullable(),
  toOfficer: custodyOfficerSchema,
  location: z.string(),
  reason: z.string().nullable(),
  notes: z.string().nullable(),
  timestamp: z.string(),
  isImmutable: z.literal(true),
})

export const evidenceListItemSchema = z.object({
  id: z.string().uuid(),
  evidenceNumber: z.string(),
  caseId: z.string().uuid(),
  evidenceType: z.nativeEnum(EvidenceType),
  description: z.string(),
  collectedBy: custodyOfficerSchema,
  collectedAt: z.string(),
  storageLocation: z.string(),
  custodyStatus: z.nativeEnum(CustodyEventType),
  hasMedia: z.boolean(),
  mediaUrl: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  createdAt: z.string(),
})

export const evidenceDetailSchema = evidenceListItemSchema.extend({
  notes: z.string().nullable(),
  custodyChain: z.object({
    events: z.array(custodyEventSchema),
    gaps: z.array(
      z.object({ afterEventId: z.string(), gapHours: z.number() }),
    ),
    isIntact: z.boolean(),
  }),
  forensicReport: z
    .object({
      id: z.string().uuid(),
      reportNumber: z.string(),
      submittedBy: custodyOfficerSchema,
      labName: z.string(),
      findings: z.string(),
      conclusion: z.string(),
      submittedAt: z.string(),
    })
    .nullable(),
  vehicleDetails: z
    .object({
      make: z.string(), model: z.string(), year: z.number().nullable(),
      licensePlate: z.string(), color: z.string(), vin: z.string().nullable(),
    })
    .nullable(),
  weaponDetails: z
    .object({
      weaponType: z.string(), make: z.string(), model: z.string(),
      serialNumber: z.string().nullable(), caliber: z.string().nullable(),
    })
    .nullable(),
})

export const paginatedEvidenceSchema = z.object({
  data: z.array(evidenceListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})

export const cloudinarySignatureSchema = z.object({
  signature: z.string(),
  timestamp: z.number(),
  cloudName: z.string(),
  apiKey: z.string(),
  uploadPreset: z.string(),
  folder: z.string(),
})
```

## 4.4 `src/features/evidence/schemas/evidence-filters.schema.ts`

```typescript
import { z } from 'zod'
import { EvidenceType } from '../types/evidence.types'

export const evidenceFiltersSchema = z.object({
  search: z.string().optional(),
  evidenceType: z.array(z.nativeEnum(EvidenceType)).optional(),
  collectedById: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(10).max(100).optional().default(25),
  sortField: z
    .enum(['evidenceNumber', 'collectedAt', 'evidenceType', 'custodyStatus'])
    .optional()
    .default('collectedAt'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
})
```

---

# 5. Evidence Service Implementation

## 5.1 `src/services/domain/evidence.service.ts`

Replace all stubs. Every response is validated with the corresponding Zod schema before being returned.

```typescript
import { apiClient } from '@services/api/client'
import axios from 'axios'
import {
  paginatedEvidenceSchema,
  evidenceDetailSchema,
  cloudinarySignatureSchema,
} from '@features/evidence/schemas/evidence-api.schema'
import type {
  EvidenceListItem,
  Evidence,
  EvidenceFilters,
  UploadEvidencePayload,
  RecordCustodyEventPayload,
  CloudinarySignature,
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
  const p = new URLSearchParams()
  if (filters.search) p.set('search', filters.search)
  if (filters.evidenceType?.length) p.set('evidenceType', filters.evidenceType.join(','))
  if (filters.collectedById) p.set('collectedById', filters.collectedById)
  if (filters.dateFrom) p.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) p.set('dateTo', filters.dateTo)
  p.set('page', String(filters.page ?? 1))
  p.set('pageSize', String(filters.pageSize ?? 25))
  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortDirection) p.set('sortDirection', filters.sortDirection)
  return p.toString()
}
```

---

# 6. Query Key Factory Update

## 6.1 `src/services/query/keys/evidenceKeys.ts`

```typescript
export const evidenceKeys = {
  all: ['evidence'] as const,

  // All evidence for a case
  caseEvidence: (caseId: string) => [...evidenceKeys.all, 'case', caseId] as const,
  caseEvidenceList: (caseId: string, filters: Record<string, unknown>) =>
    [...evidenceKeys.caseEvidence(caseId), 'list', filters] as const,

  // Single evidence item
  details: () => [...evidenceKeys.all, 'detail'] as const,
  detail: (evidenceId: string) => [...evidenceKeys.details(), evidenceId] as const,

  // Custody chain
  custodyChain: (evidenceId: string) =>
    [...evidenceKeys.detail(evidenceId), 'custody'] as const,
}
```

---

# 7. React Query Hooks

Create all hooks in `src/features/evidence/hooks/`.

## 7.1 `useEvidenceList.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getCaseEvidence } from '@services/domain/evidence.service'
import { evidenceKeys } from '@services/query/keys/evidenceKeys'
import type { EvidenceFilters } from '../types/evidence.types'

export function useEvidenceList(caseId: string, filters: EvidenceFilters) {
  return useQuery({
    queryKey: evidenceKeys.caseEvidenceList(caseId, filters as Record<string, unknown>),
    queryFn: () => getCaseEvidence(caseId, filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
    enabled: Boolean(caseId),
  })
}
```

## 7.2 `useEvidence.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getEvidence } from '@services/domain/evidence.service'
import { evidenceKeys } from '@services/query/keys/evidenceKeys'

export function useEvidence(evidenceId: string) {
  return useQuery({
    queryKey: evidenceKeys.detail(evidenceId),
    queryFn: () => getEvidence(evidenceId),
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(evidenceId),
  })
}
```

## 7.3 `useUploadEvidence.ts`

This hook orchestrates the three-step Cloudinary upload flow. It maintains internal upload state that the UI consumes for the progress bar.

```typescript
'use client'
import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import {
  getCloudinarySignature,
  uploadFileToCloudinary,
  createEvidence,
} from '@services/domain/evidence.service'
import { evidenceKeys } from '@services/query/keys/evidenceKeys'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { EvidenceMetadataValues } from '../schemas/upload-evidence.schema'
import type { MEDIA_EVIDENCE_TYPES } from '../types/evidence.types'

type UploadPhase =
  | 'idle'
  | 'signing'         // Fetching Cloudinary signature
  | 'uploading'       // Sending file to Cloudinary
  | 'recording'       // POSTing metadata to backend
  | 'success'
  | 'error'

interface UploadState {
  phase: UploadPhase
  progress: number    // 0–100, only relevant during 'uploading'
  error: string | null
}

export function useUploadEvidence(caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('evidence')

  const [uploadState, setUploadState] = useState<UploadState>({
    phase: 'idle',
    progress: 0,
    error: null,
  })

  const reset = useCallback(() => {
    setUploadState({ phase: 'idle', progress: 0, error: null })
  }, [])

  const upload = useCallback(
    async (metadata: EvidenceMetadataValues, file: File | null) => {
      setUploadState({ phase: 'idle', progress: 0, error: null })

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

        // ── Step 3: Create record on backend ───────────────────────────────
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
        const message =
          err instanceof ApiError
            ? err.message
            : t('upload.errorMessage')

        setUploadState({ phase: 'error', progress: 0, error: message })
        // Do NOT close the drawer on error — user must be able to retry
      }
    },
    [caseId, queryClient, addToast, t],
  )

  return { upload, uploadState, reset, isPending: uploadState.phase !== 'idle' && uploadState.phase !== 'success' && uploadState.phase !== 'error' }
}
```

## 7.4 `useDeleteEvidence.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { deleteEvidence } from '@services/domain/evidence.service'
import { evidenceKeys } from '@services/query/keys/evidenceKeys'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'

export function useDeleteEvidence(caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('evidence')

  return useMutation({
    mutationFn: (evidenceId: string) => deleteEvidence(evidenceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: evidenceKeys.caseEvidence(caseId) })
      void queryClient.invalidateQueries({ queryKey: caseKeys.summary(caseId) })
      addToast({ message: t('delete.successMessage'), variant: 'success' })
    },
  })
}
```

## 7.5 `useRecordCustodyEvent.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { recordCustodyEvent } from '@services/domain/evidence.service'
import { evidenceKeys } from '@services/query/keys/evidenceKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import type { RecordCustodyEventPayload } from '../types/evidence.types'

export function useRecordCustodyEvent(evidenceId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('evidence')

  return useMutation({
    mutationFn: (payload: RecordCustodyEventPayload) =>
      recordCustodyEvent(evidenceId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(evidenceKeys.detail(evidenceId), updated)
      void queryClient.invalidateQueries({
        queryKey: evidenceKeys.custodyChain(evidenceId),
      })
      addToast({ message: t('custody.eventRecordedMessage'), variant: 'success' })
    },
  })
}
```

## 7.6 Hook barrel (`src/features/evidence/hooks/index.ts`)

Export all hooks.

---

# 8. Internationalisation — Evidence Messages

## 8.1 `messages/en/evidence.json` — Full population

```json
{
  "pageTitle": "Evidence",
  "tab": {
    "heading": "Evidence",
    "entityCount": "{count} item(s)",
    "addEvidence": "Add Evidence",
    "viewToggle": {
      "table": "Table view",
      "gallery": "Gallery view"
    },
    "filters": {
      "search": "Search by description...",
      "type": "Evidence Type",
      "collectedBy": "Collected By",
      "dateRange": "Date Range",
      "clearAll": "Clear all filters"
    },
    "loading": "Loading evidence...",
    "empty": "No evidence recorded for this case.",
    "emptyDescription": "Add the first evidence item using the button above.",
    "emptyFiltered": "No evidence matches your filters.",
    "columns": {
      "evidenceNumber": "Evidence No.",
      "description": "Description",
      "type": "Type",
      "collectedBy": "Collected By",
      "collectedAt": "Collected",
      "storageLocation": "Location",
      "custodyStatus": "Custody",
      "actions": "Actions"
    },
    "rowActions": {
      "view": "View Details",
      "recordCustody": "Record Custody Event",
      "delete": "Delete Evidence"
    }
  },
  "types": {
    "DIGITAL": "Digital",
    "CRIME_SCENE_PHOTO": "Crime Scene Photo",
    "PHYSICAL": "Physical Object",
    "DOCUMENT": "Document",
    "BIOLOGICAL": "Biological Sample",
    "FORENSIC_REPORT": "Forensic Report",
    "WEAPON": "Weapon",
    "VEHICLE": "Vehicle",
    "WITNESS_STATEMENT": "Witness Statement",
    "AUDIO": "Audio Recording",
    "VIDEO": "Video Recording",
    "OTHER": "Other"
  },
  "custodyStatus": {
    "COLLECTED": "Collected",
    "TRANSFERRED": "Transferred",
    "EXAMINED": "Examined",
    "STORED": "Stored",
    "PRESENTED_IN_COURT": "In Court",
    "RETURNED": "Returned",
    "DESTROYED": "Destroyed"
  },
  "upload": {
    "drawerTitle": "Add Evidence",
    "drawerDescription": "Record a new evidence item for this case.",
    "section1Title": "Evidence Details",
    "section2Title": "File Upload",
    "section2Description": "Attach a file to this evidence item. Supported: images, PDF, audio, video. Maximum 50 MB.",
    "descriptionLabel": "Description",
    "descriptionPlaceholder": "Describe the evidence item in detail...",
    "typeLabel": "Evidence Type",
    "typePlaceholder": "Select evidence type...",
    "collectedByLabel": "Collected By",
    "collectedByPlaceholder": "Search officers...",
    "collectedAtLabel": "Date & Time Collected",
    "storageLocationLabel": "Storage Location",
    "storageLocationPlaceholder": "e.g. Evidence Locker 4B, Bole Division",
    "notesLabel": "Notes (optional)",
    "notesPlaceholder": "Any additional notes about this evidence item...",
    "fileLabel": "Attach File",
    "fileDragPrompt": "Drag a file here or click to browse",
    "fileSizeLimit": "Maximum 50 MB",
    "fileReplacePrompt": "Click to replace",
    "uploadPhase": {
      "signing": "Preparing upload...",
      "uploading": "Uploading file: {progress}%",
      "recording": "Saving evidence record...",
      "success": "Evidence added successfully.",
      "error": "Upload failed. See error above."
    },
    "submitButton": "Add Evidence",
    "retryButton": "Retry",
    "cancelButton": "Cancel",
    "successMessage": "Evidence item added successfully.",
    "errorMessage": "Failed to add evidence. Please try again."
  },
  "detail": {
    "drawerTitle": "Evidence Details",
    "evidenceNumber": "Evidence Number",
    "type": "Type",
    "description": "Description",
    "collectedBy": "Collected By",
    "collectedAt": "Date Collected",
    "storageLocation": "Storage Location",
    "notes": "Notes",
    "mediaSection": "Attached File",
    "viewFullImage": "View full image",
    "downloadFile": "Download",
    "noMedia": "No file attached.",
    "forensicSection": "Forensic Report",
    "forensicReportNumber": "Report Number",
    "forensicLab": "Laboratory",
    "forensicSubmittedBy": "Submitted By",
    "forensicSubmittedAt": "Submitted",
    "forensicFindings": "Findings",
    "forensicConclusion": "Conclusion",
    "noForensicReport": "No forensic report has been submitted.",
    "vehicleSection": "Vehicle Details",
    "weaponSection": "Weapon Details",
    "recordCustodyButton": "Record Custody Event"
  },
  "custody": {
    "sectionTitle": "Chain of Custody",
    "intactBadge": "Chain Intact",
    "brokenBadge": "Custody Gap Detected",
    "gapWarning": "A custody gap of {hours} hour(s) was detected after this event.",
    "immutableTooltip": "This custody record cannot be modified or deleted.",
    "eventTypes": {
      "COLLECTED": "Collected",
      "TRANSFERRED": "Transferred",
      "EXAMINED": "Examined",
      "STORED": "Stored",
      "PRESENTED_IN_COURT": "Presented in Court",
      "RETURNED": "Returned",
      "DESTROYED": "Destroyed"
    },
    "from": "From",
    "to": "To",
    "location": "Location",
    "reason": "Reason",
    "empty": "No custody events recorded.",
    "recordDrawerTitle": "Record Custody Event",
    "recordDrawerDescription": "Record a new transfer or examination event for this evidence item.",
    "eventTypeLabel": "Event Type",
    "toOfficerLabel": "Receiving Officer",
    "toOfficerPlaceholder": "Search officers...",
    "locationLabel": "Location",
    "locationPlaceholder": "e.g. Forensic Lab 2, Federal Police HQ",
    "reasonLabel": "Reason / Notes (optional)",
    "submitButton": "Record Event",
    "eventRecordedMessage": "Custody event recorded successfully."
  },
  "gallery": {
    "empty": "No photos for this case.",
    "emptyDescription": "Add photo evidence using the 'Add Evidence' button.",
    "hover": {
      "view": "View",
      "details": "Details"
    }
  },
  "lightbox": {
    "closeLabel": "Close lightbox",
    "prevLabel": "Previous photo",
    "nextLabel": "Next photo",
    "openMetadata": "Show metadata",
    "closeMetadata": "Hide metadata",
    "downloadLabel": "Download photo",
    "photoCount": "{current} of {total}",
    "zoomIn": "Zoom in",
    "zoomOut": "Zoom out",
    "resetZoom": "Reset zoom"
  },
  "delete": {
    "confirmTitle": "Delete evidence item?",
    "confirmDescription": "This will permanently delete evidence item {evidenceNumber} and remove it from the chain of custody. This action cannot be undone.",
    "confirmPhrase": "delete {evidenceNumber}",
    "successMessage": "Evidence item deleted successfully."
  }
}
```

## 8.2 `messages/am/evidence.json` — Full Amharic equivalent

Every key in `en/evidence.json` must appear with the identical key path. Selected translations:

```json
{
  "pageTitle": "ማስረጃ",
  "tab": {
    "heading": "ማስረጃ",
    "entityCount": "{count} ንጥሎች",
    "addEvidence": "ማስረጃ ጨምር",
    "viewToggle": {
      "table": "ሰንጠረዥ እይታ",
      "gallery": "ጋለሪ እይታ"
    },
    "filters": {
      "search": "በመግለጫ ፈልግ...",
      "type": "የማስረጃ ዓይነት",
      "collectedBy": "የሰበሰበው",
      "dateRange": "የቀን ክልል",
      "clearAll": "ሁሉም ማጣሪያዎች አጽዳ"
    },
    "loading": "ማስረጃ እየጫነ ነው...",
    "empty": "ለዚህ ጉዳይ ምንም ማስረጃ አልተመዘገበም።",
    "emptyDescription": "ከላይ ያለውን አዝራር በመጠቀም የመጀመሪያ ማስረጃ ይጨምሩ።",
    "emptyFiltered": "ምንም ማስረጃ ከማጣሪያዎ ጋር አይዛመድም።",
    "columns": {
      "evidenceNumber": "ማስረጃ ቁ.",
      "description": "መግለጫ",
      "type": "ዓይነት",
      "collectedBy": "የሰበሰበው",
      "collectedAt": "የተሰበሰበ",
      "storageLocation": "ቦታ",
      "custodyStatus": "ጥበቃ",
      "actions": "ድርጊቶች"
    },
    "rowActions": {
      "view": "ዝርዝሮች ተመልከት",
      "recordCustody": "የጥበቃ ክስተት መዝግብ",
      "delete": "ማስረጃ ሰርዝ"
    }
  },
  "types": {
    "DIGITAL": "ዲጂታል",
    "CRIME_SCENE_PHOTO": "የወንጀል ቦታ ፎቶ",
    "PHYSICAL": "አካላዊ ዕቃ",
    "DOCUMENT": "ሰነድ",
    "BIOLOGICAL": "ባዮሎጂካዊ ናሙና",
    "FORENSIC_REPORT": "የፎረንሲክ ሪፖርት",
    "WEAPON": "መሳሪያ",
    "VEHICLE": "ተሸከርካሪ",
    "WITNESS_STATEMENT": "የምስክር ቃል",
    "AUDIO": "የድምጽ መቅጃ",
    "VIDEO": "የቪዲዮ መቅጃ",
    "OTHER": "ሌላ"
  },
  "custodyStatus": {
    "COLLECTED": "ተሰብስቧል",
    "TRANSFERRED": "ተዛውሯል",
    "EXAMINED": "ተፈትሷል",
    "STORED": "ተቀምጧል",
    "PRESENTED_IN_COURT": "ለፍርድ ቤት ቀርቧል",
    "RETURNED": "ተመልሷል",
    "DESTROYED": "ወድሟል"
  },
  "upload": {
    "drawerTitle": "ማስረጃ ጨምር",
    "drawerDescription": "ለዚህ ጉዳይ አዲስ ማስረጃ ይመዝገቡ።",
    "section1Title": "የማስረጃ ዝርዝሮች",
    "section2Title": "ፋይል ስቀል",
    "section2Description": "ለዚህ ማስረጃ ፋይል ያያይዙ። ተቀባይ: ምስሎች፣ PDF፣ ድምጽ፣ ቪዲዮ። ከፍተኛ 50 MB።",
    "descriptionLabel": "መግለጫ",
    "descriptionPlaceholder": "የማስረጃ ንጥሉን በዝርዝር ያብራሩ...",
    "typeLabel": "የማስረጃ ዓይነት",
    "typePlaceholder": "የማስረጃ ዓይነት ምረጥ...",
    "collectedByLabel": "የሰበሰበው",
    "collectedByPlaceholder": "መኮንን ፈልግ...",
    "collectedAtLabel": "የተሰበሰበ ቀን እና ሰዓት",
    "storageLocationLabel": "የማቆያ ቦታ",
    "storageLocationPlaceholder": "ለምሳሌ ማስረጃ ሎከር 4B፣ ቦሌ ዲቪዥን",
    "notesLabel": "ማስታወሻ (አማራጭ)",
    "notesPlaceholder": "ስለ ማስረጃ ንጥሉ ተጨማሪ ማስታወሻ...",
    "fileLabel": "ፋይል ያያይዙ",
    "fileDragPrompt": "ፋይል ወደ ዚህ ጎትቱ ወይም ክፈቱ",
    "fileSizeLimit": "ከፍተኛ 50 MB",
    "fileReplacePrompt": "ለመቀየር ጠቅ ያድርጉ",
    "uploadPhase": {
      "signing": "ስቀላ እያዘጋጀ ነው...",
      "uploading": "ፋይል እየስቀለ ነው: {progress}%",
      "recording": "የማስረጃ መዝገብ እያስቀመጠ ነው...",
      "success": "ማስረጃ በተሳካ ሁኔታ ተጨምሯል።",
      "error": "ስቀላ አልተሳካም። ላይ ያለውን ስህተት ተመልከቱ።"
    },
    "submitButton": "ማስረጃ ጨምር",
    "retryButton": "እንደገና ሞክር",
    "cancelButton": "ሰርዝ",
    "successMessage": "ማስረጃ ንጥሉ በተሳካ ሁኔታ ተጨምሯል።",
    "errorMessage": "ማስረጃ ለመጨመር አልተሳካም። እንደገና ይሞክሩ።"
  },
  "detail": {
    "drawerTitle": "የማስረጃ ዝርዝሮች",
    "evidenceNumber": "የማስረጃ ቁጥር",
    "type": "ዓይነት",
    "description": "መግለጫ",
    "collectedBy": "የሰበሰበው",
    "collectedAt": "የተሰበሰበ ቀን",
    "storageLocation": "የማቆያ ቦታ",
    "notes": "ማስታወሻ",
    "mediaSection": "የተያያዘ ፋይል",
    "viewFullImage": "ሙሉ ምስል ተመልከት",
    "downloadFile": "አውርድ",
    "noMedia": "ምንም ፋይል አልተያያዘም።",
    "forensicSection": "የፎረንሲክ ሪፖርት",
    "forensicReportNumber": "ሪፖርት ቁጥር",
    "forensicLab": "ላቦራቶሪ",
    "forensicSubmittedBy": "ያቀረበው",
    "forensicSubmittedAt": "የቀረበ",
    "forensicFindings": "ግኝቶች",
    "forensicConclusion": "መደምደሚያ",
    "noForensicReport": "ምንም የፎረንሲክ ሪፖርት አልቀረበም።",
    "vehicleSection": "የተሸከርካሪ ዝርዝሮች",
    "weaponSection": "የመሳሪያ ዝርዝሮች",
    "recordCustodyButton": "የጥበቃ ክስተት መዝግብ"
  },
  "custody": {
    "sectionTitle": "የጥበቃ ሰንሰለት",
    "intactBadge": "ሰንሰለት ሙሉ ነው",
    "brokenBadge": "ክፍተት ተገኝቷል",
    "gapWarning": "ከዚህ ክስተት በኋላ {hours} ሰዓት ክፍተት ተገኝቷል።",
    "immutableTooltip": "ይህ የጥበቃ መዝገብ ሊቀየር ወይም ሊሰረዝ አይችልም።",
    "eventTypes": {
      "COLLECTED": "ተሰብስቧል",
      "TRANSFERRED": "ተዛውሯል",
      "EXAMINED": "ተፈትሷል",
      "STORED": "ተቀምጧል",
      "PRESENTED_IN_COURT": "ለፍርድ ቤት ቀርቧል",
      "RETURNED": "ተመልሷል",
      "DESTROYED": "ወድሟል"
    },
    "from": "ከ",
    "to": "ወደ",
    "location": "ቦታ",
    "reason": "ምክንያት",
    "empty": "ምንም የጥበቃ ክስተቶች አልተመዘገቡም።",
    "recordDrawerTitle": "የጥበቃ ክስተት መዝግብ",
    "recordDrawerDescription": "ለዚህ ማስረጃ አዲስ ዝውውር ወይም ምርምር ክስተት ይመዝገቡ።",
    "eventTypeLabel": "ክስተት ዓይነት",
    "toOfficerLabel": "ተቀባይ መኮንን",
    "toOfficerPlaceholder": "መኮንን ፈልግ...",
    "locationLabel": "ቦታ",
    "locationPlaceholder": "ለምሳሌ ፎረንሲክ ላብ 2፣ የፌዴራል ፖሊስ ዋና መምሪያ",
    "reasonLabel": "ምክንያት / ማስታወሻ (አማራጭ)",
    "submitButton": "ክስተት መዝግብ",
    "eventRecordedMessage": "የጥበቃ ክስተት በተሳካ ሁኔታ ተመዝግቧል።"
  },
  "gallery": {
    "empty": "ለዚህ ጉዳይ ምንም ፎቶ የለም።",
    "emptyDescription": "ፎቶ ማስረጃ ለመጨመር 'ማስረጃ ጨምር' አዝራሩን ይጠቀሙ።",
    "hover": {
      "view": "ተመልከት",
      "details": "ዝርዝሮች"
    }
  },
  "lightbox": {
    "closeLabel": "ቀጥታ ዝጋ",
    "prevLabel": "ቀዳሚ ፎቶ",
    "nextLabel": "ቀጣዩ ፎቶ",
    "openMetadata": "ዘዴዳ አሳይ",
    "closeMetadata": "ዘዴዳ ደብቅ",
    "downloadLabel": "ፎቶ አውርድ",
    "photoCount": "{total} ከ {current}",
    "zoomIn": "አበሳቁ",
    "zoomOut": "አንቃ",
    "resetZoom": "ዙም ዳግም ጀምር"
  },
  "delete": {
    "confirmTitle": "ማስረጃ ንጥሉን ሰርዝ?",
    "confirmDescription": "ማስረጃ ቁጥር {evidenceNumber} ቋሚ ሆኖ ይሰረዛል። ይህ ድርጊት ሊቀለበስ አይችልም።",
    "confirmPhrase": "{evidenceNumber} ሰርዝ",
    "successMessage": "ማስረጃ ንጥሉ በተሳካ ሁኔታ ተሰርዟል።"
  }
}
```

---

# 9. UI Implementation — Evidence Tab

## 9.1 Route: `src/app/(dashboard)/cases/[caseId]/evidence/page.tsx`

Replace Phase 3 skeleton. Server Component rendering `<EvidenceTab caseId={params.caseId} />`.

```typescript
import { getTranslations } from 'next-intl/server'
import { EvidenceTab } from '@features/evidence/components/EvidenceTab'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('evidence')
  return { title: t('pageTitle') }
}

export default function CaseEvidencePage({
  params,
}: {
  params: { caseId: string }
}) {
  return <EvidenceTab caseId={params.caseId} />
}
```

## 9.2 EvidenceTab Component (`src/features/evidence/components/EvidenceTab.tsx`)

Client Component. Manages view mode (table vs gallery), filter state, and drawer state.

### 9.2.1 View mode toggle

```tsx
type ViewMode = 'table' | 'gallery'
const [viewMode, setViewMode] = useState<ViewMode>('table')
```

Two icon buttons in the PageHeader actions slot: `LayoutList` (table) and `LayoutGrid` (gallery). Active button has `var(--color-primary)` styling.

### 9.2.2 Filter state (URL-driven)

Use `nuqs` for all filter params:

```typescript
const [filters, setFilters] = useQueryStates({
  search: parseAsString.withDefault(''),
  evidenceType: parseAsArrayOf(parseAsString).withDefault([]),
  collectedById: parseAsString.withDefault(''),
  dateFrom: parseAsString.withDefault(''),
  dateTo: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(25),
  sortField: parseAsString.withDefault('collectedAt'),
  sortDirection: parseAsString.withDefault('desc'),
})
```

### 9.2.3 PageHeader

```tsx
<PageHeader
  title={t('tab.heading')}
  description={`${data?.total ?? 0} ${t('tab.entityCount', { count: data?.total ?? 0 })}`}
  actions={
    <div className="flex items-center gap-2">
      {/* View mode toggle */}
      <ViewModeToggle value={viewMode} onChange={setViewMode} />
      {/* Add evidence — guarded */}
      <PermissionGuard permission={Permission.EVIDENCE_MANAGE}>
        <Button onClick={() => setUploadDrawerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('tab.addEvidence')}
        </Button>
      </PermissionGuard>
    </div>
  }
/>
```

### 9.2.4 DataTable columns

| Column | Cell | Sortable | Width |
|--------|------|----------|-------|
| `evidenceNumber` | Monospace, primary colour, clickable | Yes | 130px |
| `description` | Truncated 80 chars, tooltip for full | No | 240px |
| `evidenceType` | Type badge (see variant map below) | Yes | 150px |
| `collectedBy` | `firstName lastName (badgeNumber)` | No | 170px |
| `collectedAt` | Formatted `dd MMM yyyy HH:mm` | Yes | 130px |
| `storageLocation` | Truncated text | No | 140px |
| `custodyStatus` | Custody status badge | Yes | 120px |
| `actions` | Kebab menu | No | 48px |

**Evidence type → badge variant:**
```typescript
const EVIDENCE_TYPE_VARIANTS: Record<EvidenceType, string> = {
  CRIME_SCENE_PHOTO: 'accent',
  DIGITAL: 'primary',
  PHYSICAL: 'muted',
  DOCUMENT: 'muted',
  BIOLOGICAL: 'warning',
  FORENSIC_REPORT: 'success',
  WEAPON: 'destructive',
  VEHICLE: 'warning',
  WITNESS_STATEMENT: 'primary',
  AUDIO: 'accent',
  VIDEO: 'accent',
  OTHER: 'muted',
}
```

**Row click behaviour:**
- Photo evidence (`CRIME_SCENE_PHOTO`) → opens Lightbox
- All other types → opens `EvidenceDetailDrawer`

**Row kebab actions:**
- `View Details` → opens detail drawer (all types)
- `Record Custody Event` — `PermissionGuard` requiring `evidence:manage`
- Separator
- `Delete` (destructive) — `PermissionGuard` requiring `evidence:manage`; opens `DestructiveConfirmDialog` with `confirmPhrase`

---

# 10. UI Implementation — Evidence Upload Drawer

## 10.1 `EvidenceUploadDrawer.tsx` (`src/features/evidence/components/EvidenceUploadDrawer.tsx`)

Client Component. Wraps `SlideOverDrawer`.

### 10.1.1 Two-section form layout

```
EvidenceUploadDrawer (480px, SlideOverDrawer)
──────────────────────────────────────────────
 ┌── Section 1: Evidence Details ────────────┐
 │  Description *           [Textarea]       │
 │  Evidence Type *         [Select]         │
 │  Collected By *          [SearchableSelect]│
 │  Date & Time Collected * [DatePicker]     │
 │  Storage Location *      [Input]          │
 │  Notes                   [Textarea]       │
 └────────────────────────────────────────────┘

 ┌── Section 2: File Upload ──────────────────┐  ← Conditionally rendered
 │  ┌──────────────────────────────────────┐ │     Only when evidenceType ∈ MEDIA_EVIDENCE_TYPES
 │  │  🗂  Drag a file here                │ │
 │  │     or click to browse               │ │
 │  │     Max 50 MB                        │ │
 │  └──────────────────────────────────────┘ │
 │  [thumbnail preview once file selected]   │
 │  [████████░░░░ 67%   Uploading...]       │  ← Progress bar during upload
 └────────────────────────────────────────────┘

 ────────────────────────────────────────────
 [Cancel]                      [Add Evidence]
```

### 10.1.2 Conditional media section

Watch the `evidenceType` field value via `useWatch`. When the selected type is in `MEDIA_EVIDENCE_TYPES`, the file upload section appears with a smooth height-based expand animation (200ms). When switching to a non-media type, the section collapses and the selected file is cleared.

```typescript
const selectedType = watch('evidenceType')
const showFileUpload = MEDIA_EVIDENCE_TYPES.includes(selectedType as EvidenceType)
```

### 10.1.3 File selection and preview

The `FileUploadZone` renders a drop target. On file selection:
1. Validate MIME type and size client-side (Zod `evidenceFileSchema`)
2. If valid: show a thumbnail preview (`<img src={objectUrl} />` for images; a file icon + name for non-images)
3. If invalid: show an inline error below the drop zone (no toast)

`objectUrl` is created with `URL.createObjectURL(file)` and revoked in a `useEffect` cleanup.

### 10.1.4 Upload progress states

The `useUploadEvidence` hook returns `uploadState.phase` and `uploadState.progress`. Map these to UI:

| Phase | Upload button | Progress bar | Message |
|-------|--------------|--------------|---------|
| `idle` | "Add Evidence" enabled | Hidden | — |
| `signing` | Disabled + spinner | Shown at 0%, indeterminate pulse | `t('upload.uploadPhase.signing')` |
| `uploading` | Disabled + spinner | Shown, `progress`% filled | `t('upload.uploadPhase.uploading', { progress })` |
| `recording` | Disabled + spinner | Shown at 100% | `t('upload.uploadPhase.recording')` |
| `success` | — (drawer closes) | — | Toast shown by hook |
| `error` | "Retry" button | Hidden | Inline error card with `uploadState.error` text |

**Progress bar design:** Full-width, `height: 4px`, `var(--color-primary)` fill, rounded. Animated fill transition (150ms). The indeterminate pulse (signing/recording phases) uses a CSS shimmer animation.

### 10.1.5 Retry behaviour

On error, render an `<ErrorState>` card inside the drawer showing `uploadState.error`. Render a "Retry" button. On click: call `reset()` from the hook, then re-submit the form. **Do not close the drawer on error** — the officer's metadata must be preserved.

### 10.1.6 Dirty state guard

If the form has been touched (`formState.isDirty`) and the officer attempts to close the drawer, render a `ConfirmDialog`: "Discard evidence? You have unsaved changes." On confirm, close the drawer. On cancel, keep it open.

### 10.1.7 Submit logic

```typescript
const onSubmit = async (values: EvidenceMetadataValues) => {
  await upload(values, selectedFile)
  // hook handles success/error state
  if (uploadState.phase === 'success') {
    onClose()          // close the drawer
    form.reset()       // clear the form
    setSelectedFile(null)
  }
}
```

---

# 11. UI Implementation — Evidence Detail Drawer

## 11.1 `EvidenceDetailDrawer.tsx` (`src/features/evidence/components/EvidenceDetailDrawer.tsx`)

Client Component. Wraps `SlideOverDrawer`. Opened by clicking any non-photo evidence item.

Uses `useEvidence(evidenceId)` to fetch full detail including the custody chain.

### 11.1.1 Layout

```
EvidenceDetailDrawer (480px, SlideOverDrawer)
──────────────────────────────────────────────
 Evidence Details                    EVD-2026-00042

 ┌── Metadata ────────────────────────────────┐
 │  Evidence Type   [Crime Scene Photo badge] │
 │  Description     Full text                 │
 │  Collected By    Insp. Dawit (BD-00142)    │
 │  Collected At    14 Jun 2026 09:15 UTC     │
 │  Storage         Evidence Locker 4B         │
 │  Custody Status  [Stored badge]            │
 │  Notes           Any notes here            │
 └────────────────────────────────────────────┘

 ┌── Attached File ──────────────────────────┐
 │  [Thumbnail / File icon]  filename.pdf    │
 │  [View full image]  [Download]            │
 └────────────────────────────────────────────┘

 ┌── Chain of Custody ────────────────────────┐  ← CustodyChainTimeline component
 │  [Chain Intact ✓] or [Gap Detected ⚠]     │
 │  ...custody events...                      │
 └────────────────────────────────────────────┘

 ┌── Forensic Report ─────────────────────────┐  ← PermissionGuard: forensic/admin only
 │  ...                                       │
 └────────────────────────────────────────────┘

 ┌── Vehicle / Weapon Details ────────────────┐  ← Conditional: only if type is VEHICLE/WEAPON
 │  ...                                       │
 └────────────────────────────────────────────┘

 ────────────────────────────────────────────
 [Record Custody Event]              [Close]
```

"Record Custody Event" button opens the `RecordCustodyEventDrawer` (nested within this drawer is not ideal — instead close this drawer and open the custody event drawer).

Loading state: show a `<Skeleton>` version of the metadata section and chain timeline while `useEvidence` is loading.

---

# 12. UI Implementation — Chain of Custody Timeline

## 12.1 `CustodyChainTimeline.tsx` (`src/features/evidence/components/CustodyChainTimeline.tsx`)

Client Component. Receives `custodyChain: CustodyChain` as a prop.

### 12.1.1 Integrity header

At the top of the custody section, render an integrity status badge:
- **`isIntact: true`**: `<Badge variant="success">` + `<CheckCircle2>` icon + `t('custody.intactBadge')`
- **`isIntact: false`**: `<Badge variant="warning">` + `<AlertTriangle>` icon + `t('custody.brokenBadge')`

### 12.1.2 Event cards

Each custody event renders as a card. Structure:

```
  ●───────────────────────────────────────────────────────── 🔒
  │
  │ [📤] Transferred                      14 Jun 2026 09:23 UTC
  │      From: Insp. Dawit Bekele (BD-00142) · Bole Division
  │      To:   Foren. Sara Haile (BD-00089) · Forensic Lab Unit
  │
  │      Location: Federal Police Forensic Laboratory, Addis Ababa
  │      Reason:   Sent for ballistics analysis
  │
  ●──── ⚠ CUSTODY GAP: 26 hours ─────────────────────────── (amber dashed)
  │
  │ [🔬] Examined                         15 Jun 2026 11:45 UTC
  │      ...
```

**Gap connector:** When a `CustodyGap` exists after an event, replace the solid `TimelineConnector` with an amber dashed variant:
```tsx
<TimelineConnector gapDetected={true} />
// Plus: amber badge with gapWarning text
```

**Event-type icon mapping:**
```typescript
const CUSTODY_EVENT_ICONS: Record<CustodyEventType, LucideIcon> = {
  COLLECTED: PackagePlus,
  TRANSFERRED: ArrowRightLeft,
  EXAMINED: FlaskConical,
  STORED: Archive,
  PRESENTED_IN_COURT: Gavel,
  RETURNED: Undo2,
  DESTROYED: Trash2,
}
```

**Immutability indicator:** `<Lock className="h-3 w-3 text-[var(--color-muted)]" />` at the far right of each event card. Tooltip: `t('custody.immutableTooltip')`.

**Empty state:** When `events.length === 0`, render `<EmptyState>` with the custody empty message.

---

# 13. UI Implementation — Gallery View

## 13.1 `EvidenceGallery.tsx` (`src/features/evidence/components/EvidenceGallery.tsx`)

Client Component. Renders when `viewMode === 'gallery'`. Shows only evidence items where `evidenceType === 'CRIME_SCENE_PHOTO'`. If no photos exist, shows the gallery-specific `<EmptyState>`.

### 13.1.1 Grid layout

CSS Grid, `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))`, `gap: 12px`. On mobile: `minmax(140px, 1fr)`.

### 13.1.2 Gallery card anatomy

```
┌──────────────────────────────┐
│                              │
│   [Cloudinary thumbnail     │  ← aspect-ratio: 4/3, object-fit: cover
│    160×120 rendered]        │
│                              │
├──────────────────────────────┤
│ [Crime Scene Photo]          │  ← Type badge
│ EVD-2026-00042               │  ← Evidence number, monospace xs
│ 14 Jun 2026                  │  ← Date, muted xs
└──────────────────────────────┘
```

**Hover state:** On hover, a translucent overlay slides in from the bottom of the image area (50% opacity dark gradient). Two icon buttons appear: `Eye` (View) and `Info` (Details). Transition: 150ms ease-out. Respects `prefers-reduced-motion` — buttons are always visible when reduced motion is preferred.

**Click behaviour:**
- Clicking the image or the `Eye` button → opens Lightbox at that photo's index
- Clicking the `Info` button → opens `EvidenceDetailDrawer` for that evidence item

**Cloudinary URL transformation:** Use the Cloudinary transformation API to request a 320×240 thumbnail:
```typescript
function getThumbnailUrl(originalUrl: string): string {
  // Insert /c_fill,w_320,h_240,q_auto,f_auto/ before /upload/
  return originalUrl.replace('/upload/', '/upload/c_fill,w_320,h_240,q_auto,f_auto/')
}
```

Never render full-resolution images in the gallery. Always use the thumbnail transformation URL.

---

# 14. UI Implementation — Lightbox Viewer

## 14.1 `EvidenceLightbox.tsx` (`src/features/evidence/components/EvidenceLightbox.tsx`)

Client Component. Full-screen overlay modal. Renders above all other UI (`z-index: 9999`).

### 14.1.1 Props

```typescript
interface EvidenceLightboxProps {
  photos: EvidenceListItem[]       // Only CRIME_SCENE_PHOTO items
  initialIndex: number             // Which photo to start at
  open: boolean
  onClose: () => void
}
```

### 14.1.2 Visual structure

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [✕ Close]                                          3 of 14   [⇓ Download]   │  ← TopBar
│                                                                              │
│    [◀]          [   Full-resolution image centred   ]          [▶]          │
│                                                                              │
│                       [+ Zoom In]  [− Zoom Out]                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
   ↑
   When [ℹ Metadata] button is clicked, a panel slides in from the right:
   ┌──────────────────────────┐
   │ Evidence: EVD-2026-00042 │
   │ Type: Crime Scene Photo  │
   │ Collected: 14 Jun 2026   │
   │ By: Insp. Dawit Bekele  │
   │ Location: Bole Road      │
   │ Storage: Locker 4B       │
   └──────────────────────────┘
```

### 14.1.3 Keyboard handling

```typescript
useEffect(() => {
  if (!open) return
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') navigatePrev()
    if (e.key === 'ArrowRight') navigateNext()
    if (e.key === 'Escape') onClose()
    if (e.key === '+' || e.key === '=') zoomIn()
    if (e.key === '-') zoomOut()
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [open, navigatePrev, navigateNext, onClose])
```

Trap focus inside the lightbox while open. On close, return focus to the element that triggered opening.

### 14.1.4 Zoom

```typescript
const [scale, setScale] = useState(1)
const MIN_SCALE = 0.5
const MAX_SCALE = 4

const zoomIn = () => setScale((s) => Math.min(s + 0.25, MAX_SCALE))
const zoomOut = () => setScale((s) => Math.max(s - 0.25, MIN_SCALE))
const resetZoom = () => setScale(1)
```

Apply zoom with `transform: scale(scale)` and `transition: transform 150ms ease-out`. The image is wrapped in an `overflow: hidden` container so zoomed-out images don't overflow. Dragging the image while zoomed in is achieved via pointer events on the image container.

Scroll-wheel zoom:
```typescript
const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  if (e.deltaY < 0) zoomIn()
  else zoomOut()
}
```

### 14.1.5 Touch swipe (mobile)

```typescript
const touchStartX = useRef<number>(0)
const onTouchStart = (e: React.TouchEvent) => {
  touchStartX.current = e.touches[0]?.clientX ?? 0
}
const onTouchEnd = (e: React.TouchEvent) => {
  const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current
  if (delta < -50) navigateNext()
  if (delta > 50) navigatePrev()
}
```

### 14.1.6 Metadata panel

A slide-in panel from the right edge of the lightbox. State: `metadataPanelOpen: boolean`. When open, the image area shrinks by the panel width (320px) with a CSS transition. The panel shows key evidence metadata fields. Toggle button: `Info` icon in the topbar.

### 14.1.7 Download button

```typescript
const handleDownload = async () => {
  const url = photos[currentIndex]?.mediaUrl
  if (!url) return
  const a = document.createElement('a')
  a.href = url
  a.download = `${photos[currentIndex]?.evidenceNumber ?? 'evidence'}.jpg`
  a.click()
}
```

Wrap in `PermissionGuard` requiring `evidence:manage`.

### 14.1.8 Background and transitions

Background: `rgba(0, 0, 0, 0.95)` — near-black, not token-based (lightbox is intentionally outside the normal dark-mode palette). Navigation arrows: `rgba(255,255,255,0.15)` background, `rgba(255,255,255,0.8)` icon. Image navigation transition: the outgoing image fades out, the incoming image fades in (100ms each). Respects `prefers-reduced-motion` — instant swap when reduced motion is preferred.

---

# 15. Evidence Detail Page Route

## 15.1 `src/app/(dashboard)/cases/[caseId]/evidence/[evidenceId]/page.tsx`

This route serves as a dedicated full-page view for evidence items that warrant their own page (e.g., large forensic reports, weapon detail). It is also the canonical URL for deep-linking to a specific evidence item.

```typescript
import { getTranslations } from 'next-intl/server'
import { EvidenceDetailPage } from '@features/evidence/components/EvidenceDetailPage'

export default function EvidenceDetailRoute({
  params,
}: {
  params: { caseId: string; evidenceId: string }
}) {
  return (
    <EvidenceDetailPage caseId={params.caseId} evidenceId={params.evidenceId} />
  )
}
```

`EvidenceDetailPage` is a Client Component that uses `useEvidence(evidenceId)` and renders the full metadata, chain of custody, and all applicable sections (forensic report, vehicle/weapon details) in a full-width page layout with a `<PageHeader>` including a back link to the evidence tab.

---

# 16. Record Custody Event Drawer

## 16.1 `RecordCustodyEventDrawer.tsx` (`src/features/evidence/components/RecordCustodyEventDrawer.tsx`)

A `SlideOverDrawer` (480px) containing the custody event form. Fields: Event Type (Select using `CustodyEventType` values), Receiving Officer (`SearchableSelect`), Location (Input), Reason/Notes (Textarea, optional).

Uses `useRecordCustodyEvent(evidenceId)`. On success: closes the drawer, invalidates the evidence detail query so the chain of custody timeline refreshes.

---

# 17. Modal Registry Update

Register the lightbox as a portal-rendered component. It does not use the `ModalRenderer` (it is not triggered by `uiStore.openModal` — it is driven by local component state in `EvidenceTab`). No changes to `ModalRenderer` are needed.

However, document in a comment inside `ModalRenderer.tsx` that the Lightbox is intentionally excluded from the registry due to its data requirements (it needs the photo array which is component-local).

---

# 18. caseKeys Update for Evidence Sub-Resource

Verify `caseKeys.evidence(caseId)` is present in `src/services/query/keys/caseKeys.ts` (it was defined in Phase 3). The `useUploadEvidence` hook invalidates `caseKeys.summary(caseId)` on success — this triggers the overview tab's Evidence count card to update.

---

# 19. Testing Requirements

## 19.1 Schema Tests (`src/features/evidence/schemas/upload-evidence.schema.test.ts`)

- Valid metadata passes
- Description shorter than 5 chars fails
- Missing `evidenceType` fails
- Missing `collectedById` fails
- File larger than 50 MB fails `evidenceFileSchema`
- Unsupported MIME type (e.g., `text/plain`) fails `evidenceFileSchema`
- Valid image MIME type (`image/jpeg`) passes
- Valid PDF MIME type passes

## 19.2 Schema Tests (`src/features/evidence/schemas/custody-event.schema.test.ts`)

- Valid custody event passes
- Missing `toOfficerId` fails
- Missing `location` fails
- Location shorter than 2 chars fails

## 19.3 Utility Tests (`src/features/evidence/utils/custody-gap.test.ts`)

If client-side gap detection is implemented as a utility:

```typescript
import { detectCustodyGaps } from '../utils/custody-gap'

test('detects gap of more than 24 hours', () => {
  const events = [
    { id: '1', timestamp: '2026-06-14T09:00:00Z', /* ... */ },
    { id: '2', timestamp: '2026-06-15T10:00:00Z', /* ... */ }, // 25h later
  ]
  const gaps = detectCustodyGaps(events)
  expect(gaps).toHaveLength(1)
  expect(gaps[0]?.afterEventId).toBe('1')
  expect(gaps[0]?.gapHours).toBeGreaterThan(24)
})

test('no gap when events are within 24 hours', () => {
  const events = [
    { id: '1', timestamp: '2026-06-14T09:00:00Z' },
    { id: '2', timestamp: '2026-06-14T18:00:00Z' }, // 9h later
  ]
  expect(detectCustodyGaps(events)).toHaveLength(0)
})
```

## 19.4 Hook Tests (`src/features/evidence/hooks/useUploadEvidence.test.ts`)

- Phase transitions: `idle` → `signing` → `uploading` → `recording` → `success`
- On Cloudinary upload failure: phase becomes `error`, `uploadState.error` is set
- On backend record creation failure: phase becomes `error`
- `reset()` returns phase to `idle`
- On success: `evidenceKeys.caseEvidence(caseId)` and `caseKeys.summary(caseId)` are invalidated

## 19.5 Component Tests (`src/features/evidence/components/EvidenceTab.test.tsx`)

- Renders DataTable when `viewMode === 'table'`
- Renders gallery grid when `viewMode === 'gallery'`
- "Add Evidence" button is absent when officer lacks `evidence:manage`
- Filter chip for evidence type appears when type filter is set
- Clearing a filter chip calls `setFilters` with type removed

## 19.6 Component Tests (`src/features/evidence/components/CustodyChainTimeline.test.tsx`)

- "Chain Intact" badge renders when `isIntact: true`
- "Custody Gap Detected" badge renders when `isIntact: false`
- Amber dashed connector appears between events that have a gap
- Padlock icon appears on every event card
- Empty state renders when `events` array is empty

## 19.7 Component Tests (`src/features/evidence/components/EvidenceLightbox.test.tsx`)

- `ArrowRight` keyboard event calls `navigateNext`
- `ArrowLeft` keyboard event calls `navigatePrev`
- `Escape` keyboard event calls `onClose`
- Photo counter renders "1 of 3" correctly
- Metadata panel renders when metadata button is clicked
- Download button is absent when officer lacks `evidence:manage`

## 19.8 E2E Tests (`tests/e2e/evidence.spec.ts`)

```typescript
import { test, expect } from '@playwright/test'

test.describe('Evidence module', () => {
  test('evidence tab shows DataTable for a case with evidence', async ({ page }) => {
    await page.route('**/api/v1/cases/case-001/evidence*', (route) =>
      route.fulfill({
        status: 200,
        json: {
          data: [
            {
              id: 'ev-001',
              evidenceNumber: 'EVD-2026-00001',
              caseId: 'case-001',
              evidenceType: 'PHYSICAL',
              description: 'Knife found at scene',
              collectedBy: { id: 'off-1', badgeNumber: 'BD-001', firstName: 'Dawit', lastName: 'Bekele', departmentName: 'Bole' },
              collectedAt: '2026-06-14T09:00:00Z',
              storageLocation: 'Locker 4B',
              custodyStatus: 'STORED',
              hasMedia: false,
              mediaUrl: null,
              thumbnailUrl: null,
              createdAt: '2026-06-14T09:00:00Z',
            },
          ],
          total: 1, page: 1, pageSize: 25, totalPages: 1,
        },
      }),
    )
    await page.goto('/cases/case-001/evidence')
    await expect(page.getByText('EVD-2026-00001')).toBeVisible()
    await expect(page.getByText('Knife found at scene')).toBeVisible()
  })

  test('gallery view toggle shows grid of photo evidence', async ({ page }) => {
    // Mock evidence list with CRIME_SCENE_PHOTO items
    await page.goto('/cases/case-001/evidence')
    await page.getByRole('button', { name: /gallery view/i }).click()
    await expect(page.locator('[data-testid="evidence-gallery"]')).toBeVisible()
  })

  test('switching language in evidence tab updates all labels', async ({ page }) => {
    await page.goto('/cases/case-001/evidence')
    await expect(page.getByText('Evidence No.')).toBeVisible()
    // Switch to Amharic
    await page.getByRole('button', { name: /EN/i }).click()
    await page.getByText('አማርኛ').click()
    await expect(page.getByText('ማስረጃ ቁ.')).toBeVisible()
  })
})
```

---

# 20. Step-by-Step Execution Order

**Step 1 — Create evidence types**
Create `src/features/evidence/types/evidence.types.ts` and barrel.
Run `pnpm type-check`. Zero errors.

**Step 2 — Create evidence schemas**
Create all four schema files. Run `pnpm type-check`. Zero errors.

**Step 3 — Implement evidence service**
Replace stubs in `src/services/domain/evidence.service.ts`.
Verify direct Cloudinary call uses `axios` not `apiClient` (different base URL, no auth headers).
Run `pnpm type-check`. Zero errors.

**Step 4 — Update evidenceKeys factory**
Confirm `src/services/query/keys/evidenceKeys.ts` has all keys.

**Step 5 — Create all React Query hooks**
Create all five hook files and the barrel.
Run `pnpm type-check`. Zero errors.

**Step 6 — Create evidence i18n messages**
Fully populate `messages/en/evidence.json` and `messages/am/evidence.json`.
Run `pnpm i18n:types` to regenerate TypeScript message types.
Run `pnpm test tests/integration/i18n-completeness.test.ts`. Must pass.

**Step 7 — Implement EvidenceTab**
Create `evidence-columns.tsx`, `EvidenceTab.tsx`.
Update `/cases/[caseId]/evidence/page.tsx` to replace the Phase 3 skeleton.
Run `pnpm dev`. Navigate to a case's evidence tab. Verify the table renders (empty state or data).

**Step 8 — Implement EvidenceUploadDrawer**
Create `EvidenceUploadDrawer.tsx`.
Wire the "Add Evidence" button in `EvidenceTab` to open the drawer.
Test the upload flow end-to-end with a real (or mocked) backend in dev.

**Step 9 — Implement CustodyChainTimeline**
Create `CustodyChainTimeline.tsx`.
Verify gap detection renders the amber dashed connector with the gap warning badge.
Verify the padlock icon appears on every event.

**Step 10 — Implement EvidenceDetailDrawer**
Create `EvidenceDetailDrawer.tsx`.
Wire it to open on row click for non-photo evidence.
Verify the chain of custody section renders inside the drawer.

**Step 11 — Implement RecordCustodyEventDrawer**
Create `RecordCustodyEventDrawer.tsx`.
Wire the "Record Custody Event" row action and the button in the detail drawer.
Verify submitting the form invalidates the detail query and the chain updates.

**Step 12 — Implement EvidenceGallery**
Create `EvidenceGallery.tsx`.
Wire the view-mode toggle in `EvidenceTab`.
Verify the grid renders only `CRIME_SCENE_PHOTO` items with Cloudinary thumbnail URLs.
Verify hover overlay reveals View and Details buttons.

**Step 13 — Implement EvidenceLightbox**
Create `EvidenceLightbox.tsx`.
Wire it to open when clicking a photo in the gallery (or using the View button hover overlay).
Test: arrow key navigation, Escape close, zoom in/out, metadata panel toggle.
Test on mobile viewport: touch swipe navigates.

**Step 14 — Implement EvidenceDetailPage**
Create `EvidenceDetailPage.tsx` (Client Component).
Update `src/app/(dashboard)/cases/[caseId]/evidence/[evidenceId]/page.tsx`.
Verify it renders all sections with correct loading states.

**Step 15 — Write all tests**
Write unit, component, and E2E tests from Section 19.
Run `pnpm test`. All must pass.

**Step 16 — Barrel exports**
Create `src/features/evidence/index.ts` and all sub-directory barrels.

**Step 17 — Final verification**
```bash
pnpm type-check   # Zero errors
pnpm lint         # Zero warnings
pnpm test         # All tests pass including i18n completeness
pnpm build        # Production build succeeds
```

---

# 21. Visual Design Standards for This Phase

## 21.1 Evidence table — forensic gravity

The evidence table must communicate the seriousness of its contents. Design decisions:

- **Evidence number column**: Monospace, `var(--color-primary)`. Styled identically to the case number in the cases list — creates a consistent visual language for identifiers across the system.
- **Custody status column**: Use `<StatusBadge>` with colour. `STORED` and `COLLECTED` use `muted`; `EXAMINED` uses `primary`; `PRESENTED_IN_COURT` uses `accent`; `TRANSFERRED` uses `warning`. The colour signals where evidence is in its journey.
- **Row hover**: Identical to the cases list — `var(--color-card-hover)` background, `cursor: pointer`. The entire row is the click target.

## 21.2 Upload drawer — confidence and control

The upload flow must make officers feel in control at every step, not anxious about data loss:

- **Progress bar design**: Thin (4px), bottom of the file section. The colour transitions from `var(--color-primary)` to `var(--color-success)` at 100%. An animated shimmer effect (`background-size: 200% 100%; animation: shimmer 1.5s infinite`) overlays the fill during `uploading` phase to indicate live progress.
- **Error state design**: An `<ErrorState>` card with a red `AlertCircle` icon, the error message text, and a prominent "Retry" button. The form fields above remain filled — the officer should not have to re-enter anything.
- **Phase label**: The text below the progress bar changes at each phase. Monospace font. `xs` size. Not alarming — calm and informative.

## 21.3 Chain of custody — legal weight and immutability

The custody chain is a legal record. Its visual design must signal that:

- **Connector line**: `2px`, `var(--color-border)`. Continuous — no gap between the dot and the line or between the line and the next dot.
- **Gap connector**: `2px`, `var(--color-warning)`, `dashed` (CSS: `border-left: 2px dashed var(--color-warning)` on the connector element). The gap warning badge (`AlertTriangle` + amber text) sits on the line itself, centred horizontally.
- **Padlock icon placement**: Top-right of each event card, outside the main text column. `12px`, `var(--color-muted)`. It should read as an institutional watermark — present but not distracting.
- **Timestamps**: ISO 8601 in `font-mono`, `text-xs`. The precision of the timestamp reinforces immutability. Do not use relative time in the custody chain — absolute time is required for legal purposes.
- **From → To**: Use an `ArrowRight` icon between officer names. Left side (From) uses `var(--color-foreground-muted)`; right side (To) uses `var(--color-foreground)`. This directionality helps readers trace the chain.

## 21.4 Gallery — forensic professionalism

The evidence gallery shows crime scene images. It must not feel like a photo app:

- **No rounded corners on thumbnails** — `border-radius: 0`. This distinguishes forensic images from consumer photo galleries.
- **Subtle border**: `1px solid var(--color-border)` on each gallery card. No box-shadow on the cards themselves — shadows are for modals.
- **Hover overlay**: `rgba(15, 23, 42, 0.7)` gradient from bottom. No animated effects on the overlay — it appears on hover with a simple opacity transition (100ms). Reduced motion: static overlay visible always.
- **Evidence number**: Always visible below the image even without hover — this is the identifier.

## 21.5 Lightbox — focus and clarity

The lightbox must make the image the absolute focus:

- **Navigation arrows**: Semi-transparent circle buttons on the left and right edges of the image area. They appear on mouse movement and hide after 2 seconds of inactivity (CSS opacity transition). Always visible on touch devices.
- **Zoom feedback**: A small zoom-level indicator (`100%`, `150%`) appears briefly in the bottom-right corner after zoom changes (2-second fade-out). Renders in `font-mono`, `xs`, `var(--color-foreground-muted)`.
- **Photo count**: Top-centre of the lightbox, `EN: "3 of 14"` / `AM: "14 ከ 3"`. Monospace. Always visible.
- **Image loading**: While the full-resolution image loads, show the thumbnail (already available from the gallery) blurred with a CSS filter: `filter: blur(8px)`. When the full image loads, crossfade from blurred to sharp (200ms). This eliminates the jarring "flash of empty" common in lightboxes.

---

# 22. Anti-Patterns Specific to This Phase

In addition to all previous phase anti-patterns:

**Upload violations:**
- Using `apiClient` to upload directly to Cloudinary — the Cloudinary endpoint uses a different base URL and does not accept CCMS auth cookies. Always use a plain `axios.post` for step 2.
- Starting the file upload before the metadata form is validated — validate first, upload second.
- Closing the drawer on upload error — always keep it open so metadata is preserved.
- Rendering the full-resolution Cloudinary URL in the gallery grid — always use the thumbnail transformation URL.

**Chain of custody violations:**
- Computing custody gaps client-side without the server providing them — if the backend includes `gaps` in the response, use that. If it does not, implement `detectCustodyGaps` as a pure utility function and test it thoroughly.
- Rendering the custody chain as a generic list — it must use `TimelineConnector` components that clearly distinguish intact vs gapped chains.
- Showing "edit" or "delete" controls on custody event cards — these records are immutable. No such controls must appear.

**Lightbox violations:**
- Using `window.open` or `<a target="_blank">` for the download — the browser may block this for Cloudinary CDN URLs. Use the programmatic anchor approach described in Section 14.1.7.
- Not revoking `ObjectURL` after thumbnail preview is unmounted — always revoke in a `useEffect` cleanup to prevent memory leaks.
- Not returning focus to the triggering element when the lightbox closes — this is both an accessibility requirement and a UX requirement.
- Loading full-resolution images for all photos in the gallery on mount — only load the image for the currently viewed index. Use `loading="lazy"` on gallery thumbnails.

**State violations:**
- Using `useEffect` to sync `evidenceType` field changes to detect `showFileUpload` — use `useWatch` from `react-hook-form` instead.
- Storing the currently open evidence ID in a Zustand store — keep it in local component state in `EvidenceTab`.

---

# 23. Final Verification Checklist

## 23.1 Evidence Tab

- [ ] `/cases/[caseId]/evidence` renders the full DataTable (not the Phase 3 skeleton)
- [ ] "Add Evidence" button is visible for officers with `evidence:manage` permission
- [ ] "Add Evidence" button is hidden for officers without `evidence:manage` permission
- [ ] Search filter updates the URL `search` param and refetches
- [ ] Evidence type filter chips appear and can be dismissed
- [ ] View mode toggle switches between DataTable and gallery grid
- [ ] Clicking a `CRIME_SCENE_PHOTO` row opens the Lightbox
- [ ] Clicking any other evidence row opens the detail drawer
- [ ] Kebab "Delete" row action opens `DestructiveConfirmDialog` with confirmPhrase
- [ ] Loading skeleton renders on first load
- [ ] Empty state renders when no evidence exists

## 23.2 Evidence Upload

- [ ] Opening the upload drawer shows a clean form
- [ ] Selecting a non-media evidence type hides the file upload section
- [ ] Selecting `CRIME_SCENE_PHOTO` shows the file upload section
- [ ] Selecting a file that exceeds 50 MB shows a validation error inline (no toast)
- [ ] Selecting a valid file shows a thumbnail preview (for images) or a file icon (for other types)
- [ ] Submitting with missing required fields shows inline validation errors
- [ ] During upload: button shows spinner, progress bar fills correctly, phase label updates
- [ ] On Cloudinary upload error: drawer stays open, error card appears, Retry button works
- [ ] On backend failure: drawer stays open, error card appears, Retry button works
- [ ] On success: drawer closes, evidence list refreshes, case summary count increments

## 23.3 Evidence Detail Drawer

- [ ] Opens on clicking non-photo evidence rows
- [ ] Shows all metadata fields
- [ ] Shows chain of custody timeline with correct event icons
- [ ] Shows gap warning (amber dashed connector + warning badge) when custody gap exists
- [ ] Shows "Chain Intact" badge when no gaps
- [ ] Padlock icon appears on every custody event card
- [ ] Forensic report section is hidden for investigators (visible for forensic/admin roles)
- [ ] "Record Custody Event" button opens the custody event drawer

## 23.4 Lightbox

- [ ] Opens when clicking a photo in the gallery
- [ ] Left/right arrows navigate between photos
- [ ] `←`/`→` keyboard keys navigate
- [ ] `Esc` closes the lightbox
- [ ] Photo count ("3 of 14") updates on navigation
- [ ] Zoom in/out works with `+`/`-` keys and scroll wheel
- [ ] Metadata panel slides in from the right
- [ ] Download button downloads the full-resolution file
- [ ] Touch swipe navigates on mobile viewport
- [ ] Focus is returned to the triggering element on close
- [ ] Blurred thumbnail placeholder appears while full image loads

## 23.5 Chain of Custody

- [ ] Integrity badge shows "Chain Intact" when no gaps
- [ ] Integrity badge shows "Custody Gap Detected" when gaps exist
- [ ] Gap connector is amber and dashed between gapped events
- [ ] Gap warning message shows correct hour count
- [ ] All timestamps are in ISO 8601 format (not relative time)
- [ ] All custody events have immutability padlock icons

## 23.6 i18n

- [ ] All evidence UI text is retrieved from message files
- [ ] Switching to Amharic updates all text in the evidence tab, upload drawer, detail drawer, lightbox
- [ ] i18n completeness test passes with zero missing keys in `evidence` namespace
- [ ] Evidence type names render in the selected locale
- [ ] Custody event type names render in the selected locale

## 23.7 Tooling

- [ ] `pnpm type-check` exits with zero errors
- [ ] `pnpm lint` exits with zero warnings
- [ ] `pnpm test` — all evidence tests pass
- [ ] `pnpm build` — production build succeeds without errors

---

*End of CCMS Phase 4 Instruction — Evidence Module*
*Prepared for AI Agent execution — 2026 production-grade engineering standards*
*Package manager: pnpm throughout*
*Next phase: Phase 5 will implement the Arrests and Interrogations sub-modules*