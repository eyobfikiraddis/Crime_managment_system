'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { FormField } from '@/shared/components/forms/FormField'
import { StatusBadge } from '@/shared/components/display/StatusBadge'
import { Skeleton } from '@/shared/components/feedback/Skeleton'

import { CHARGE_STATUS_VARIANTS } from '../utils/chargeUtils'
import { useAppealCharge } from '../hooks/useAppealCharge'
import type { ChargeListItem } from '../types/legal.types'

interface AppealChargeDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chargeId: string
  courtCaseId: string
  caseId: string
  charge: ChargeListItem | null
}

const appealSchema = z.object({
  notes: z.string().max(2000).optional(),
})

type AppealValues = z.infer<typeof appealSchema>

export function AppealChargeDrawer({
  open,
  onOpenChange,
  chargeId,
  courtCaseId,
  caseId,
  charge,
}: AppealChargeDrawerProps) {
  const t = useTranslations('legal')
  const [discardOpen, setDiscardOpen] = useState(false)
  const appealMutation = useAppealCharge(chargeId, courtCaseId, caseId)

  const form = useForm<AppealValues>({
    resolver: zodResolver(appealSchema),
    defaultValues: {
      notes: '',
    },
  })

  const { formState, reset } = form

  useEffect(() => {
    if (open) {
      reset({
        notes: '',
      })
    }
  }, [open, reset])

  const handleCloseRequest = () => {
    if (formState.isDirty) {
      setDiscardOpen(true)
      return
    }
    onOpenChange(false)
  }

  const onSubmit = async (values: AppealValues) => {
    try {
      await appealMutation.mutateAsync({
        ...(values.notes ? { notes: values.notes } : {}),
      })
      onOpenChange(false)
      reset()
    } catch (err) {
      // Handled by hook notification
    }
  }

  if (!open) return null

  if (!charge) {
    return (
      <SlideOverDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={t('charges.appeal.drawerTitle')}
      >
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-20 w-full" />
        </div>
      </SlideOverDrawer>
    )
  }

  return (
    <>
      <SlideOverDrawer
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            handleCloseRequest()
          }
        }}
        title={t('charges.appeal.drawerTitle')}
        description={t('charges.appeal.drawerDescription')}
        footer={
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4 w-full">
            <Button type="button" variant="outline" onClick={handleCloseRequest}>
              {t('charges.appeal.cancelButton')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-warning text-warning hover:bg-warning/10"
              onClick={form.handleSubmit(onSubmit)}
              disabled={appealMutation.isPending}
            >
              {t('charges.appeal.submitButton')}
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              {t('charges.appeal.contextTitle')}
            </h3>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <span className="text-xs text-foreground-muted block">
                  {t('charges.columns.suspect')}
                </span>
                <span className="font-medium text-foreground">
                  {charge.suspect.firstName} {charge.suspect.lastName}
                </span>
              </div>
              <div>
                <span className="text-xs text-foreground-muted block">
                  {t('charges.columns.crimeType')}
                </span>
                <span className="font-medium text-foreground">
                  {charge.crimeType.name}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs text-foreground-muted block mb-1">
                  {t('charges.columns.status')}
                </span>
                <StatusBadge
                  status={t(`charges.status.${charge.status}`)}
                  variant={CHARGE_STATUS_VARIANTS[charge.status] ?? 'muted'}
                  className="w-[120px] text-center"
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-md border border-warning bg-warning/10 p-4 text-xs text-warning">
            <AlertTriangle className="mt-0.5 size-4 flex-shrink-0" />
            <div className="space-y-2">
              <span className="font-semibold block text-sm">
                {t('charges.appeal.warningTitle')}
              </span>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('charges.appeal.consequenceStatus', { status: t(`charges.status.${charge.status}`) })}</li>
                <li>{t('charges.appeal.consequenceAudit')}</li>
                <li>{t('charges.appeal.consequenceSentence')}</li>
              </ul>
              <span className="block mt-2 font-medium">
                {t('charges.appeal.irreversibleNotice')}
              </span>
            </div>
          </div>

          <FormField
            label={t('charges.appeal.notesLabel')}
            error={formState.errors.notes?.message}
          >
            <Textarea
              rows={4}
              {...form.register('notes')}
              placeholder={t('charges.appeal.notesPlaceholder')}
            />
          </FormField>
        </form>
      </SlideOverDrawer>

      {discardOpen ? (
        <ConfirmDialog
          open={discardOpen}
          onOpenChange={setDiscardOpen}
          title={t('charges.appeal.discardTitle')}
          description={t('charges.appeal.discardDescription')}
          confirmLabel={t('charges.appeal.discardConfirm')}
          cancelLabel={t('charges.appeal.discardCancel')}
          onConfirm={() => {
            setDiscardOpen(false)
            reset()
            onOpenChange(false)
          }}
        />
      ) : null}
    </>
  )
}

export default AppealChargeDrawer
