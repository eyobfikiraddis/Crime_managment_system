'use client'

import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { FormField } from '@/shared/components/forms/FormField'
import { FormSection } from '@/shared/components/forms/FormSection'

import { promoteToSuspectSchema, type PromoteToSuspectValues } from '@features/personnel/schemas/person.schema'
import { RiskLevel, PromoteToSuspectPayload } from '@features/personnel/types/personnel.types'
import { usePromoteToSuspect } from '@features/personnel/hooks/usePromoteToSuspect'

interface PromoteToSuspectDrawerProps {
  personId: string
  open: boolean
  onClose: () => void
}

export default function PromoteToSuspectDrawer({ personId, open, onClose }: PromoteToSuspectDrawerProps) {
  const t = useTranslations('personnel')
  const promoteMutation = usePromoteToSuspect(personId)

  const form = useForm<PromoteToSuspectValues>({
    resolver: zodResolver(promoteToSuspectSchema),
    defaultValues: {
      riskLevel: undefined as any,
      notes: '',
    },
  })

  const { formState, reset } = form

  useEffect(() => {
    if (open) {
      reset({
        riskLevel: undefined as any,
        notes: '',
      })
    }
  }, [open, reset])

  const onSubmit = async (values: PromoteToSuspectValues) => {
    try {
      const payload: PromoteToSuspectPayload = {
        riskLevel: values.riskLevel,
      }
      if (values.notes) {
        payload.notes = values.notes
      }
      await promoteMutation.mutateAsync(payload)
      onClose()
      reset()
    } catch (err) {
      // Handled by hook
    }
  }

  return (
    <SlideOverDrawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
      title={t('persons.promoteToSuspect.drawerTitle')}
      description={t('persons.promoteToSuspect.drawerDescription')}
      footer={
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4 w-full">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('persons.promoteToSuspect.cancelButton')}
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={promoteMutation.isPending}
          >
            {t('persons.promoteToSuspect.submitButton')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Permanence Warning Alert */}
        <div
          className="flex gap-2.5 rounded-md p-3 text-xs font-medium border border-[var(--color-warning)]"
          style={{ background: 'rgba(245, 158, 11, 0.08)' }}
        >
          <AlertTriangle className="size-4 shrink-0 text-warning" />
          <div className="text-warning">
            {t('persons.promoteToSuspect.permanenceNotice')}
          </div>
        </div>

        <form className="space-y-4">
          <FormSection title={t('persons.promoteToSuspect.section1Title')}>
            <FormField
              label={t('persons.promoteToSuspect.riskLevelLabel')}
              required
              helperText={t('persons.promoteToSuspect.riskLevelHint')}
              error={formState.errors.riskLevel?.message}
            >
              <Controller
                name="riskLevel"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('persons.promoteToSuspect.riskLevelLabel')} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(RiskLevel).map((risk) => (
                        <SelectItem key={risk} value={risk}>
                          {t(`persons.riskLevel.${risk}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField
              label={t('persons.promoteToSuspect.notesLabel')}
              error={formState.errors.notes?.message}
            >
              <Textarea
                rows={5}
                {...form.register('notes')}
                placeholder={t('persons.promoteToSuspect.notesPlaceholder')}
              />
            </FormField>
          </FormSection>
        </form>
      </div>
    </SlideOverDrawer>
  )
}
