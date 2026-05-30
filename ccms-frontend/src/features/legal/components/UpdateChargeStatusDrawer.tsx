'use client'

import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { AlertTriangle, Lock } from 'lucide-react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { DatePicker } from '@/shared/components/forms/DatePicker'
import { FormField } from '@/shared/components/forms/FormField'
import { StatusBadge } from '@/shared/components/display/StatusBadge'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { cn } from '@/lib/utils'

import { updateChargeStatusSchema } from '../schemas/charge.schema'
import { recordSentenceSchema } from '../schemas/sentence.schema'
import {
  ChargeStatus,
  SENTENCE_TYPES_WITH_DURATION,
  SENTENCE_TYPES_WITH_FINE,
  SentenceType,
  type ChargeListItem,
} from '../types/legal.types'
import { useUpdateCharge } from '../hooks/useUpdateCharge'
import { useRecordSentence } from '../hooks/useRecordSentence'
import { CHARGE_STATUS_VARIANTS, getAvailableChargeStatuses, isChargeTerminal } from '../utils/chargeUtils'

interface UpdateChargeStatusDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chargeId: string
  courtCaseId: string
  caseId: string
  charge: ChargeListItem | null
}

const convictSchema = recordSentenceSchema.extend({
  status: z.literal(ChargeStatus.CONVICTED),
})

const updateSchema = updateChargeStatusSchema

const combinedSchema = z.union([updateSchema, convictSchema])

type UpdateChargeStatusValues = {
  status?: ChargeStatus
  sentenceType?: SentenceType
  durationMonths?: number | null
  fineAmountETB?: number | null
  notes?: string | null
  issuedAt?: string
  issuedByJudge?: string | null
}

export function UpdateChargeStatusDrawer({
  open,
  onOpenChange,
  chargeId,
  courtCaseId,
  caseId,
  charge,
}: UpdateChargeStatusDrawerProps) {
  const t = useTranslations('legal')

  const updateChargeMutation = useUpdateCharge(chargeId, courtCaseId, caseId)
  const recordSentenceMutation = useRecordSentence(chargeId, courtCaseId, caseId)

  const form = useForm<UpdateChargeStatusValues>({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      status: undefined as any,
      sentenceType: undefined as any,
      durationMonths: null,
      fineAmountETB: null,
      notes: '',
      issuedAt: '',
      issuedByJudge: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        status: undefined as any,
        sentenceType: undefined as any,
        durationMonths: null,
        fineAmountETB: null,
        notes: '',
        issuedAt: '',
        issuedByJudge: '',
      })
    }
  }, [form, open])

  const selectedStatus = useWatch({
    control: form.control,
    name: 'status',
  })

  const selectedSentenceType = useWatch({
    control: form.control,
    name: 'sentenceType',
  })

  useEffect(() => {
    if (selectedStatus !== ChargeStatus.CONVICTED) {
      form.setValue('sentenceType', undefined as any)
      form.setValue('durationMonths', null)
      form.setValue('fineAmountETB', null)
      form.setValue('notes', '')
      form.setValue('issuedAt', '')
      form.setValue('issuedByJudge', '')
    }
  }, [form, selectedStatus])

  useEffect(() => {
    if (!SENTENCE_TYPES_WITH_DURATION.includes(selectedSentenceType as SentenceType)) {
      form.setValue('durationMonths', null)
    }
    if (!SENTENCE_TYPES_WITH_FINE.includes(selectedSentenceType as SentenceType)) {
      form.setValue('fineAmountETB', null)
    }
  }, [form, selectedSentenceType])

  if (!open) return null

  if (!charge) {
    return (
      <SlideOverDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={t('charges.update.drawerTitle')}
      >
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-20 w-full" />
        </div>
      </SlideOverDrawer>
    )
  }

  const terminal = isChargeTerminal(charge.status)
  const availableStatuses = getAvailableChargeStatuses(charge.status)
  const showSentenceFields = selectedStatus === ChargeStatus.CONVICTED

  const onSubmit = async (values: UpdateChargeStatusValues) => {
    if (!chargeId) return
    if (values.status === ChargeStatus.CONVICTED) {
      await recordSentenceMutation.mutateAsync({
        sentenceType: values.sentenceType as SentenceType,
        durationMonths: values.durationMonths ?? null,
        fineAmountETB: values.fineAmountETB ?? null,
        notes: values.notes ? values.notes : null,
        issuedAt: values.issuedAt ?? '',
        issuedByJudge: values.issuedByJudge ? values.issuedByJudge : null,
      })
      onOpenChange(false)
      return
    }

    await updateChargeMutation.mutateAsync({
      status: values.status as Exclude<ChargeStatus, 'CONVICTED'>,
    })
    onOpenChange(false)
  }

  if (terminal) {
    return (
      <SlideOverDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={t('charges.update.drawerTitle')}
        footer={
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('charges.update.cancelButton')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-md border border-border bg-card p-4">
            <Lock className="mt-0.5 size-4 text-foreground-muted" />
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                {t('charges.update.terminalNotice')}
              </p>
              <StatusBadge
                status={t(`charges.status.${charge.status}`)}
                variant={CHARGE_STATUS_VARIANTS[charge.status] ?? 'muted'}
                className="w-[120px] text-center"
              />
            </div>
          </div>
        </div>
      </SlideOverDrawer>
    )
  }

  return (
    <SlideOverDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={t('charges.update.drawerTitle')}
      description={t('charges.update.drawerDescription')}
      footer={
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('charges.update.cancelButton')}
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={updateChargeMutation.isPending || recordSentenceMutation.isPending}
          >
            {selectedStatus === ChargeStatus.CONVICTED
              ? t('charges.update.convictButton')
              : t('charges.update.submitButton')}
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <span className="text-xs font-semibold text-foreground-muted block mb-2">
            {t('charges.update.currentStatusLabel')}
          </span>
          <div className="space-y-2 text-sm">
            <StatusBadge
              status={t(`charges.status.${charge.status}`)}
              variant={CHARGE_STATUS_VARIANTS[charge.status] ?? 'muted'}
              className="w-[120px] text-center"
            />
            <p className="text-sm text-foreground">
              {charge.suspect.firstName} {charge.suspect.lastName}
            </p>
            <p className="text-sm text-foreground-muted">
              {charge.crimeType.name}
            </p>
          </div>
        </div>

        <FormField
          label={t('charges.update.newStatusLabel')}
          required
          error={form.formState.errors.status?.message}
        >
          <Controller
            name="status"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('charges.update.newStatusPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`charges.status.${status}`)}
                    </SelectItem>
                  ))}
                  {availableStatuses.length > 0 ? <SelectSeparator /> : null}
                  <SelectItem value={ChargeStatus.CONVICTED} className="text-destructive">
                    {t('charges.status.CONVICTED')}
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <div
          className={cn(
            'overflow-hidden transition-[max-height] duration-150 ease-out',
            showSentenceFields ? 'max-h-[900px]' : 'max-h-0',
          )}
        >
          {showSentenceFields ? (
            <div className="space-y-4 rounded-md border border-warning bg-warning/10 p-3">
              <div className="flex items-start gap-2 text-warning text-xs">
                <AlertTriangle className="mt-0.5 size-3" />
                <span>{t('charges.update.convictNotice')}</span>
              </div>

              <FormField
                label={t('charges.sentence.sentenceTypeLabel')}
                required
                error={form.formState.errors.sentenceType?.message}
              >
                <Controller
                  name="sentenceType"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('charges.sentence.sentenceTypeLabel')} />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(SentenceType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`charges.sentenceType.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <div
                className={cn(
                  'overflow-hidden transition-[max-height] duration-150 ease-out',
                  SENTENCE_TYPES_WITH_DURATION.includes(selectedSentenceType as SentenceType)
                    ? 'max-h-40'
                    : 'max-h-0',
                )}
              >
                <FormField
                  label={t('charges.sentence.durationMonthsLabel')}
                  error={form.formState.errors.durationMonths?.message as string | undefined}
                >
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    {...form.register('durationMonths', {
                      setValueAs: (value) => (value === '' ? null : Number(value)),
                    })}
                    placeholder={t('charges.sentence.durationMonthsPlaceholder')}
                  />
                </FormField>
                <p className="text-xs text-foreground-muted">
                  {t('charges.sentence.durationMonthsHint')}
                </p>
              </div>

              <div
                className={cn(
                  'overflow-hidden transition-[max-height] duration-150 ease-out',
                  SENTENCE_TYPES_WITH_FINE.includes(selectedSentenceType as SentenceType)
                    ? 'max-h-40'
                    : 'max-h-0',
                )}
              >
                <FormField
                  label={t('charges.sentence.fineAmountLabel')}
                  error={form.formState.errors.fineAmountETB?.message as string | undefined}
                >
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...form.register('fineAmountETB', {
                      setValueAs: (value) => (value === '' ? null : Number(value)),
                    })}
                    placeholder={t('charges.sentence.fineAmountPlaceholder')}
                  />
                </FormField>
              </div>

              <FormField
                label={t('charges.sentence.issuedAtLabel')}
                required
                error={form.formState.errors.issuedAt?.message as string | undefined}
              >
                <Controller
                  name="issuedAt"
                  control={form.control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date) =>
                        field.onChange(date ? date.toISOString().slice(0, 10) : '')
                      }
                      placeholder={t('charges.sentence.issuedAtLabel')}
                    />
                  )}
                />
              </FormField>

              <FormField
                label={t('charges.sentence.issuedByJudgeLabel')}
                error={form.formState.errors.issuedByJudge?.message as string | undefined}
              >
                <Input
                  {...form.register('issuedByJudge')}
                  placeholder={t('charges.sentence.issuedByJudgePlaceholder')}
                />
              </FormField>

              <FormField
                label={t('charges.sentence.notesLabel')}
                error={form.formState.errors.notes?.message as string | undefined}
              >
                <Textarea
                  rows={3}
                  {...form.register('notes')}
                  placeholder={t('charges.sentence.notesPlaceholder')}
                />
              </FormField>
            </div>
          ) : null}
        </div>
      </form>
    </SlideOverDrawer>
  )
}
