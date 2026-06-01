import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { downloadAuditCsv } from '@services/domain/audit.service'
import { useNotificationStore } from '@shared/stores/notification.store'
import { buildAuditCsvFilename } from '../utils/auditUtils'
import type { AuditExportParams } from '../types/audit.types'

export function useDownloadAuditCsv() {
  const { addToast } = useNotificationStore()
  const t = useTranslations('audit')

  const surfaceToEndpoint = (
    surface: AuditExportParams['surface'],
    entityId: string,
  ): string => {
    switch (surface) {
      case 'case':    return `cases/${entityId}/timeline`
      case 'officer': return `personnel/officers/${entityId}/audit`
      case 'person':  return `personnel/persons/${entityId}/audit`
      case 'global':  return 'audit'
    }
  }

  return useMutation({
    mutationFn: (params: AuditExportParams) =>
      downloadAuditCsv(
        surfaceToEndpoint(params.surface, params.entityId),
        params.filters,
        buildAuditCsvFilename(params.surface),
      ),
    onSuccess: () => {
      addToast({ message: t('export.csvSuccessMessage'), variant: 'success' })
    },
    onError: () => {
      addToast({ message: t('export.csvErrorMessage'), variant: 'error' })
    },
  })
}
