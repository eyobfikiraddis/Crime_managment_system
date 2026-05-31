// ─── Embedded Location reference ─────────────────────────────────────────────
// Returned inline on department responses — not the full Location entity
export interface LocationRef {
  id: string
  name: string
  region: string | null
}

// ─── Embedded Head Officer reference ─────────────────────────────────────────
// Returned inline on department responses — not the full Officer entity
export interface HeadOfficerRef {
  id: string
  badgeNumber: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
}

// ─── Department List Item (for DataTable) ────────────────────────────────────
export interface DepartmentListItem {
  id: string
  name: string
  code: string | null              // Short code e.g. "CID", "HOM", "FORNS"
  location: LocationRef | null
  headOfficer: HeadOfficerRef | null
  officerCount: number             // Total officer accounts in this department
  activeCaseCount: number          // Cases with status Open or Under Investigation
  createdAt: string                // ISO 8601
}

// ─── Department Detail ────────────────────────────────────────────────────────
export interface Department extends DepartmentListItem {
  description: string | null
  updatedAt: string
}

// ─── Department Officer Summary (for compact officers table on detail page) ──
// Uses string for role/status to avoid importing from @features/personnel
// Values are identical to OfficerRole and OfficerStatus enums from personnel module
export interface DepartmentOfficerSummary {
  id: string
  badgeNumber: string
  firstName: string
  lastName: string
  role: string                     // Matches OfficerRole enum values
  status: string                   // Matches OfficerStatus enum values
  joinedAt: string                 // When this officer's account was created in this department
}

// ─── Department Filters ───────────────────────────────────────────────────────
export interface DepartmentFilters {
  search?: string | undefined                  // Searches name and code
  locationId?: string | undefined
  hasHeadOfficer?: boolean | undefined
  page?: number | undefined
  pageSize?: number | undefined
  sortField?: 'name' | 'officerCount' | 'activeCaseCount' | 'createdAt' | undefined
  sortDirection?: 'asc' | 'desc' | undefined
}

// ─── Department Payloads ──────────────────────────────────────────────────────
export interface CreateDepartmentPayload {
  name: string
  code?: string | undefined
  locationId?: string | undefined
  description?: string | undefined
}

export interface UpdateDepartmentPayload {
  name?: string | undefined
  code?: string | null | undefined
  locationId?: string | null | undefined
  description?: string | null | undefined
}

export interface AssignHeadOfficerPayload {
  officerId: string
}
