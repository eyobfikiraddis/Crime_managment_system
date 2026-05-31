import { apiClient } from '@services/api/client'
import {
  investigatorDashboardSchema,
  deptHeadDashboardSchema,
  adminDashboardSchema,
  legalDashboardSchema,
} from '@features/dashboard/schemas/dashboard-api.schema'
import type {
  InvestigatorDashboardData,
  DeptHeadDashboardData,
  AdminDashboardData,
  LegalDashboardData,
} from '@features/dashboard/types/dashboard.types'

/**
 * GET /api/v1/dashboard/investigator
 * Returns aggregate operational data for the currently authenticated investigator.
 * Backend scopes all data to the calling officer (no officerId param needed).
 */
export async function getInvestigatorDashboard(): Promise<InvestigatorDashboardData> {
  const raw = await apiClient.get('/api/v1/dashboard/investigator')
  return investigatorDashboardSchema.parse(raw)
}

/**
 * GET /api/v1/dashboard/dept-head
 * Returns department-scoped aggregate data for the authenticated department head.
 * Backend automatically scopes to the caller's department.
 */
export async function getDeptHeadDashboard(): Promise<DeptHeadDashboardData> {
  const raw = await apiClient.get('/api/v1/dashboard/dept-head')
  return deptHeadDashboardSchema.parse(raw)
}

/**
 * GET /api/v1/dashboard/admin
 * Returns system-wide aggregate data for admin/superadmin roles.
 */
export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const raw = await apiClient.get('/api/v1/dashboard/admin')
  return adminDashboardSchema.parse(raw)
}

/**
 * GET /api/v1/dashboard/legal
 * Returns court-and-charges aggregate data for the authenticated legal officer.
 */
export async function getLegalDashboard(): Promise<LegalDashboardData> {
  const raw = await apiClient.get('/api/v1/dashboard/legal')
  return legalDashboardSchema.parse(raw)
}
