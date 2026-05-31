import { z } from 'zod'

const locationRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  region: z.string().nullable(),
})

const headOfficerRefSchema = z.object({
  id: z.string().uuid(),
  badgeNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
})

// ─── Department List Item ─────────────────────────────────────────────────────
export const departmentListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string().nullable(),
  location: locationRefSchema.nullable(),
  headOfficer: headOfficerRefSchema.nullable(),
  officerCount: z.number(),
  activeCaseCount: z.number(),
  createdAt: z.string(),
})

// ─── Department Detail ────────────────────────────────────────────────────────
export const departmentDetailSchema = departmentListItemSchema.extend({
  description: z.string().nullable(),
  updatedAt: z.string(),
})

// ─── Paginated Departments ────────────────────────────────────────────────────
export const paginatedDepartmentsSchema = z.object({
  data: z.array(departmentListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})

// ─── Department Officer Summary ───────────────────────────────────────────────
export const departmentOfficerSummarySchema = z.object({
  id: z.string().uuid(),
  badgeNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.string(),
  status: z.string(),
  joinedAt: z.string(),
})

export const departmentOfficersResponseSchema = z.object({
  data: z.array(departmentOfficerSummarySchema),
  total: z.number(),
})
