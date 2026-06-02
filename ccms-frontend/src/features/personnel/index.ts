// Types
export * from './types/personnel.types'

// Hooks
export {
  usePersonList,
  usePersonDetail,
  useCreatePerson,
  usePromoteToSuspect,
  usePromoteToVictim,
  usePromoteToWitness,
  usePersonCases,
  useOfficerList,
  useOfficerDetail,
  useCreateOfficer,
  useActivateOfficer,
  useDeactivateOfficer,
  useResetOfficerPassword,
  useOfficerCases,
  useDemotePersonRole,
} from './hooks'

// Components (export only those consumed outside the module)
export { PersonsList } from './components/persons/PersonsList'
export { PersonDetail } from './components/persons/PersonDetail'
export { OfficersList } from './components/officers/OfficersList'
export { OfficerDetail } from './components/officers/OfficerDetail'
export { DemotePersonRoleDialog } from './components/persons/DemotePersonRoleDialog'

// Utils
export {
  RISK_LEVEL_VARIANTS,
  OFFICER_STATUS_VARIANTS,
  OFFICER_ROLE_VARIANTS,
  PERSON_ROLE_VARIANTS,
  getFullName,
  getOfficerDisplayName,
  hasRole,
  getUnassignedRoles,
} from './utils/personnelUtils'
