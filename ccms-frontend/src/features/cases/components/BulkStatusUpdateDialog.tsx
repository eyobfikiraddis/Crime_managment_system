'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useBulkUpdateCaseStatus } from '../hooks/useBulkUpdateCaseStatus'
import type { CaseStatus } from '../types/case.types'

interface BulkStatusUpdateDialogProps {
  open: boolean
  onClose: () => void
  caseIds: string[]
}

const STATUSES: CaseStatus[] = ['OPEN', 'UNDER_INVESTIGATION', 'REFERRED_TO_COURT', 'CLOSED', 'ARCHIVED']

export function BulkStatusUpdateDialog({ open, onClose, caseIds }: BulkStatusUpdateDialogProps) {
  const t = useTranslations('cases')
  const bulkUpdateMutation = useBulkUpdateCaseStatus()
  
  const [status, setStatus] = useState<CaseStatus | ''>('')
  const [reason, setReason] = useState('')

  const isArchived = status === 'ARCHIVED'
  const isReasonRequired = isArchived
  const isFormValid = status !== '' && (!isReasonRequired || reason.trim().length >= 5)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || !status) return

    bulkUpdateMutation.mutate(
      { caseIds, status, ...(reason ? { reason } : {}) },
      {
        onSuccess: () => {
          setStatus('')
          setReason('')
          onClose()
        },
      }
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <AlertDialogContent className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('bulk.statusUpdate.dialogTitle', { count: caseIds.length })}
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="bulk-status-select">
                {t('bulk.statusUpdate.newStatusLabel')} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as CaseStatus)}
              >
                <SelectTrigger id="bulk-status-select" className="w-full">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((st) => (
                    <SelectItem key={st} value={st}>
                      {t(`status.${st}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-status-reason">
                {t('bulk.statusUpdate.reasonLabel')} {isReasonRequired && <span className="text-destructive">*</span>}
              </Label>
              <Textarea
                id="bulk-status-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('bulk.statusUpdate.reasonPlaceholder')}
                className="min-h-[80px]"
              />
              {isReasonRequired && (
                <p className="text-xs text-foreground-muted">
                  Reason is required and must be at least 5 characters when archiving cases.
                </p>
              )}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel type="button" onClick={onClose} disabled={bulkUpdateMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="submit"
              disabled={!isFormValid || bulkUpdateMutation.isPending}
              className="gap-1.5"
            >
              {bulkUpdateMutation.isPending ? 'Updating...' : t('bulk.statusUpdate.submitButton', { count: caseIds.length })}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
export default BulkStatusUpdateDialog
