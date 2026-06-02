'use client'

import { useEffect, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { DatePicker } from '@/shared/components/forms/DatePicker'
import { FormField } from '@/shared/components/forms/FormField'
import { cn } from '@/lib/utils'

import {
  SentenceType,
  SENTENCE_TYPES_WITH_DURATION,
  SENTENCE_TYPES_WITH_FINE,
  type Sentence,
} from '../types/legal.types'
import { useEditSentence } from '../hooks/useEditSentence'

interface EditSentenceDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chargeId: string
  courtCaseId: string
  caseId: string
  sentence: Sentence | null
}

const editSentenceSchema = z
  .object({
    sentenceType: z.nativeEnum(SentenceType, {
      message: 'Sentence type is required.',
    }),
    durationMonths: z.number().int().positive().max(999).nullable().optional(),
    fineAmountETB: z.number().positive().max(999_999_999).nullable().optional(),
    notes: z.string().max(3000).nullable().optional(),
    issuedAt: z.string().min(1, { message: 'Sentence date is required.' }),
    issuedByJudge: z.string().max(200).nullable().optional(),
    amendmentReason: z
      .string()
      .min(10, { message: 'Reason for amendment must be at least 10 characters.' }),
  })
  .superRefine((data, ctx) => {
    if (
      SENTENCE_TYPES_WITH_DURATION.includes(data.sentenceType) &&
      (data.durationMonths === null || data.durationMonths === undefined)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Duration is required for this sentence type.',
        path: ['durationMonths'],
      })
    }

    if (
      SENTENCE_TYPES_WITH_FINE.includes(data.sentenceType) &&
      (data.fineAmountETB === null || data.fineAmountETB === undefined)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Fine amount is required for a fine sentence.',
        path: ['fineAmountETB'],
      })
    }
  })

type EditSentenceValues = z.infer<typeof editSentenceSchema>

export function EditSentenceDrawer({
  open,
  onOpenChange,
  chargeId,
  courtCaseId,
  caseId,
  sentence,
}: EditSentenceDrawerProps) {
  const t = useTranslations('legal')
  const [discardOpen, setDiscardOpen] = useState(false)
  const editSentenceMutation = useEditSentence(chargeId, courtCaseId, caseId)

  const form = useForm<EditSentenceValues>({
    resolver: zodResolver(editSentenceSchema),
    defaultValues: {
      sentenceType: undefined as any,
      durationMonths: null,
      fineAmountETB: null,
      notes: '',
      issuedAt: '',
      issuedByJudge: '',
      amendmentReason: '',
    },
  })

  const { formState, reset } = form

  useEffect(() => {
    if (open && sentence) {
      reset({
        sentenceType: sentence.sentenceType,
        durationMonths: sentence.durationMonths,
        fineAmountETB: sentence.fineAmountETB,
        notes: sentence.notes || '',
        issuedAt: sentence.issuedAt ? new Date(sentence.issuedAt).toISOString().slice(0, 10) : '',
        issuedByJudge: sentence.issuedByJudge || '',
        amendmentReason: '',
      })
    }
  }, [open, sentence, reset])

  const selectedSentenceType = useWatch({
    control: form.control,
    name: 'sentenceType',
  })

  useEffect(() => {
    if (!SENTENCE_TYPES_WITH_DURATION.includes(selectedSentenceType as SentenceType)) {
      form.setValue('durationMonths', null)
    }
    if (!SENTENCE_TYPES_WITH_FINE.includes(selectedSentenceType as SentenceType)) {
      form.setValue('fineAmountETB', null)
    }
  }, [form, selectedSentenceType])

  const handleCloseRequest = () => {
    if (formState.isDirty) {
      setDiscardOpen(true)
      return
    }
    onOpenChange(false)
  }

  const onSubmit = async (values: EditSentenceValues) => {
    try {
      await editSentenceMutation.mutateAsync({
        sentenceType: values.sentenceType,
        durationMonths: values.durationMonths ?? null,
        fineAmountETB: values.fineAmountETB ?? null,
        notes: values.notes ? values.notes : null,
        issuedAt: values.issuedAt,
        issuedByJudge: values.issuedByJudge ? values.issuedByJudge : null,
        amendmentReason: values.amendmentReason,
      })
      onOpenChange(false)
      reset()
    } catch (err) {
      // Handled by hook notification
    }
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
        title={t('charges.editSentence.drawerTitle')}
        description={t('charges.editSentence.drawerDescription')}
        footer={
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4 w-full">
            <Button type="button" variant="outline" onClick={handleCloseRequest}>
              {t('charges.editSentence.cancelButton')}
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={editSentenceMutation.isPending}
            >
              {t('charges.editSentence.submitButton')}
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <div className="flex items-start gap-2 rounded-md border border-warning bg-warning/10 p-3 text-xs text-warning">
            <AlertTriangle className="mt-0.5 size-4 flex-shrink-0" />
            <span>{t('charges.editSentence.amendmentNotice')}</span>
          </div>

          <FormField
            label={t('charges.sentence.sentenceTypeLabel')}
            required
            error={formState.errors.sentenceType?.message}
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
              error={formState.errors.durationMonths?.message}
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
              error={formState.errors.fineAmountETB?.message}
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
            error={formState.errors.issuedAt?.message}
          >
            <Controller
              name="issuedAt"
              control={form.control}
              render={({ field }) => (
                <DatePicker
                  value={field.value ? new Date(field.value) : undefined}
                  onChange={(date) => field.onChange(date ? date.toISOString().slice(0, 10) : '')}
                  placeholder={t('charges.sentence.issuedAtLabel')}
                />
              )}
            />
          </FormField>

          <FormField
            label={t('charges.sentence.issuedByJudgeLabel')}
            error={formState.errors.issuedByJudge?.message}
          >
            <Input
              {...form.register('issuedByJudge')}
              placeholder={t('charges.sentence.issuedByJudgePlaceholder')}
            />
          </FormField>

          <FormField
            label={t('charges.sentence.notesLabel')}
            error={formState.errors.notes?.message}
          >
            <Textarea
              rows={3}
              {...form.register('notes')}
              placeholder={t('charges.sentence.notesPlaceholder')}
            />
          </FormField>

          <FormField
            label={t('charges.editSentence.amendmentReasonLabel')}
            required
            error={formState.errors.amendmentReason?.message}
            helperText={t('charges.editSentence.amendmentReasonHint')}
          >
            <Textarea
              rows={3}
              {...form.register('amendmentReason')}
              placeholder={t('charges.editSentence.amendmentReasonPlaceholder')}
            />
          </FormField>
        </form>
      </SlideOverDrawer>

      {discardOpen ? (
        <ConfirmDialog
          open={discardOpen}
          onOpenChange={setDiscardOpen}
          title={t('charges.editSentence.discardTitle')}
          description={t('charges.editSentence.discardDescription')}
          confirmLabel={t('charges.editSentence.discardConfirm')}
          cancelLabel={t('charges.editSentence.discardCancel')}
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

export default EditSentenceDrawer
