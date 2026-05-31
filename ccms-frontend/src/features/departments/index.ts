// Types
export * from './types/department.types'

// Hooks
export {
  useDepartmentList,
  useDepartmentDetail,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useAssignHeadOfficer,
  useRemoveHeadOfficer,
  useDepartmentOfficers,
} from './hooks'

// Components (only those consumed outside the module)
export { DepartmentsList } from './components/DepartmentsList'
export { DepartmentDetail } from './components/DepartmentDetail'

// Utils
export {
  getDepartmentDisplayName,
  getHeadOfficerLabel,
  hasHeadOfficer,
  DEPT_OFFICER_ROLE_VARIANTS,
  DEPT_OFFICER_STATUS_VARIANTS,
} from './utils/departmentUtils'
