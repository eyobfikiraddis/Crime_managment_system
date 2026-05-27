// ─── Evidence Type enum ────────────────────────────────────────────────────
export const EvidenceType = {
  DIGITAL: 'DIGITAL',
  CRIME_SCENE_PHOTO: 'CRIME_SCENE_PHOTO',
  PHYSICAL: 'PHYSICAL',
  DOCUMENT: 'DOCUMENT',
  BIOLOGICAL: 'BIOLOGICAL',
  FORENSIC_REPORT: 'FORENSIC_REPORT',
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
  fromOfficer: CustodyOfficer | null
  toOfficer: CustodyOfficer
  location: string
  reason: string | null
  notes: string | null
  timestamp: string
  isImmutable: true
}

// A gap is detected when two consecutive events are more than 24 hours apart
export interface CustodyGap {
  afterEventId: string
  gapHours: number
}

export interface CustodyChain {
  events: CustodyEvent[]
  gaps: CustodyGap[]
  isIntact: boolean
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
  evidenceNumber: string
  caseId: string
  evidenceType: EvidenceType
  description: string
  collectedBy: CustodyOfficer
  collectedAt: string
  storageLocation: string
  custodyStatus: CustodyEventType
  hasMedia: boolean
  mediaUrl: string | null
  thumbnailUrl: string | null
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
  search?: string | undefined
  evidenceType?: EvidenceType[] | undefined
  collectedById?: string | undefined
  dateFrom?: string | undefined
  dateTo?: string | undefined
  page?: number | undefined
  pageSize?: number | undefined
  sortField?: 'evidenceNumber' | 'collectedAt' | 'evidenceType' | 'custodyStatus' | undefined
  sortDirection?: 'asc' | 'desc' | undefined
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
  notes?: string | undefined
  cloudinaryUrl?: string | undefined
  cloudinaryPublicId?: string | undefined
}

export interface RecordCustodyEventPayload {
  eventType: CustodyEventType
  toOfficerId: string
  location: string
  reason?: string | undefined
  notes?: string | undefined
}
