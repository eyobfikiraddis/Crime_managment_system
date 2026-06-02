// Types
export * from './types/legal.types'

// Hooks
export {
  useCourtCaseByCase,
  useCourtCaseList,
  useCreateCourtCase,
  useUpdateCourtCase,
  useChargeList,
  useCreateCharge,
  useUpdateCharge,
  useDropCharge,
  useRecordSentence,
  useEditSentence,
  useAppealCharge,
  useBulkDropCharges,
} from './hooks'

// Components
export { LegalTab } from './components/LegalTab'
export { CourtCasesList } from './components/CourtCasesList'
export { BulkDropChargesDialog } from './components/BulkDropChargesDialog'
export { EditSentenceDrawer } from './components/EditSentenceDrawer'
export { AppealChargeDrawer } from './components/AppealChargeDrawer'

// Utils
export {
  CHARGE_STATUS_VARIANTS,
  COURT_CASE_STATUS_VARIANTS,
  isChargeTerminal,
  getAvailableChargeStatuses,
  formatDurationMonths,
  formatFineAmount,
} from './utils/chargeUtils'
