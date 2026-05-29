'use client'

import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { StatusBadge } from '@/shared/components/display/StatusBadge'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { FormField } from '@/shared/components/forms/FormField'
import { cn } from '@/lib/utils'

import { useArrest } from '../hooks/useArrest'
import { useUpdateArrest } from '../hooks/useUpdateArrest'
import { updateArrestSchema, type UpdateArrestValues } from '../schemas/update-arrest.schema'
import { BailStatus, DetentionStatus } from '../types/arrest.types'

interface UpdateArrestDrawerProps {
  caseId: string
  arrestId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type BadgeVariant = 'primary' | 'warning' | 'accent' | 'success' | 'muted' | 'destructive'

const DETENTION_STATUS_VARIANTS: Record<DetentionStatus, BadgeVariant> = {
  IN_CUSTODY: 'warning',
  RELEASED_ON_BAIL: 'accent',
  RELEASED: 'success',
  TRANSFERRED: 'primary',
}

const BAIL_STATUS_VARIANTS: Record<BailStatus, BadgeVariant> = {
  NOT_SET: 'muted',
  DENIED: 'destructive',
  GRANTED: 'success',
  POSTED: 'accent',
}

const BAIL_STATUSES_WITH_AMOUNT: BailStatus[] = [BailStatus.GRANTED, BailStatus.POSTED]

export function UpdateArrestDrawer({
  caseId,
  arrestId,
  open,
  onOpenChange,
}: UpdateArrestDrawerProps) {
  const t = useTranslations('arrests')
  const { data, isLoading } = useArrest(arrestId ?? '')
  const updateMutation = useUpdateArrest(arrestId ?? '', caseId)

  const form = useForm<UpdateArrestValues>({
    resolver: zodResolver(updateArrestSchema),
    defaultValues: {
      detentionStatus: undefined,
      bailStatus: undefined,
      bailAmount: null,
      notes: '',
    },
  })

  useEffect(() => {
    if (open && data) {
      form.reset({
        detentionStatus: data.detentionStatus,
        bailStatus: data.bailStatus,
        bailAmount: data.bailAmount ?? null,
        notes: '',
      })
    }
  }, [data, form, open])

  const selectedBailStatus = useWatch({
    control: form.control,
    name: 'bailStatus',
  })
  const showBailAmount = BAIL_STATUSES_WITH_AMOUNT.includes(selectedBailStatus as BailStatus)

  useEffect(() => {
    if (!showBailAmount) {
      form.setValue('bailAmount', null)
    }
  }, [form, showBailAmount])

  const onSubmit = (values: UpdateArrestValues) => {
    if (!arrestId) return
    updateMutation.mutate(values, {
      onSuccess: () => {
        onOpenChange(false)
      },
    })
  }

  return (
    <SlideOverDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={t('update.drawerTitle')}
      description={t('update.drawerDescription')}
      footer={
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('update.cancelButton')}
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={updateMutation.isPending || isLoading}
          >
            {t('update.submitButton')}
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : !data ? (
        <div className="text-sm text-foreground-muted">{t('tab.empty')}</div>
      ) : (
        <form className="space-y-4">
          <div className="rounded-lg bg-muted/40 p-4 border border-border">
            <span className="text-xs font-semibold text-foreground-muted block mb-2">
              {t('detail.detentionStatus')}
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge
                status={t(`detentionStatus.${data.detentionStatus}`)}
                variant={DETENTION_STATUS_VARIANTS[data.detentionStatus] ?? 'muted'}
              />
              <StatusBadge
                status={t(`bailStatus.${data.bailStatus}`)}
                variant={BAIL_STATUS_VARIANTS[data.bailStatus] ?? 'muted'}
              />
            </div>
          </div>

          <FormField
            label={t('update.detentionStatusLabel')}
            required
            error={form.formState.errors.detentionStatus?.message}
          >
            <Controller
              name="detentionStatus"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('update.detentionStatusLabel')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(DetentionStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`detentionStatus.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField
            label={t('update.bailStatusLabel')}
            required
            error={form.formState.errors.bailStatus?.message}
          >
            <Controller
              name="bailStatus"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('update.bailStatusLabel')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(BailStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`bailStatus.${status}`)}
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
              showBailAmount ? 'max-h-40' : 'max-h-0',
            )}
          >
            <FormField
              label={t('update.bailAmountLabel')}
              error={form.formState.errors.bailAmount?.message}
            >
              <Input
                type="number"
                min="0"
                step="0.01"
                {...form.register('bailAmount', {
                  setValueAs: (value) => (value === '' ? undefined : Number(value)),
                })}
                placeholder={t('update.bailAmountPlaceholder')}
              />
            </FormField>
          </div>

          <FormField
            label={t('update.notesLabel')}
            error={form.formState.errors.notes?.message}
          >
            <Textarea rows={4} {...form.register('notes')} placeholder={t('update.notesPlaceholder')} />
          </FormField>
        </form>
      )}
    </SlideOverDrawer>
  )
}
