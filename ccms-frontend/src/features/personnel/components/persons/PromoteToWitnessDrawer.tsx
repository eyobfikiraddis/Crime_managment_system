'use client'

import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { FormField } from '@/shared/components/forms/FormField'
import { FormSection } from '@/shared/components/forms/FormSection'
import { cn } from '@/lib/utils'

import { promoteToWitnessSchema, type PromoteToWitnessValues } from '@features/personnel/schemas/person.schema'
import { usePromoteToWitness } from '@features/personnel/hooks/usePromoteToWitness'
import { PromoteToWitnessPayload } from '@features/personnel/types/personnel.types'

interface PromoteToWitnessDrawerProps {
  personId: string
  open: boolean
  onClose: () => void
}

export default function PromoteToWitnessDrawer({ personId, open, onClose }: PromoteToWitnessDrawerProps) {
  const t = useTranslations('personnel')
  const promoteMutation = usePromoteToWitness(personId)

  const form = useForm<PromoteToWitnessValues>({
    resolver: zodResolver(promoteToWitnessSchema) as any,
    defaultValues: {
      credibilityNotes: '',
      isProtected: false,
      protectionLevel: '',
    },
  })

  const { formState, control, reset, setValue } = form

  const isProtected = useWatch({
    control,
    name: 'isProtected',
  })

  useEffect(() => {
    if (open) {
      reset({
        credibilityNotes: '',
        isProtected: false,
        protectionLevel: '',
      })
    }
  }, [open, reset])

  // Clear protectionLevel when isProtected is toggled off
  useEffect(() => {
    if (!isProtected) {
      setValue('protectionLevel', '')
    }
  }, [isProtected, setValue])

  const onSubmit = async (values: PromoteToWitnessValues) => {
    try {
      const payload: PromoteToWitnessPayload = {
        isProtected: values.isProtected,
      }
      if (values.credibilityNotes) {
        payload.credibilityNotes = values.credibilityNotes
      }
      if (values.isProtected) {
        payload.protectionLevel = values.protectionLevel || null
      } else {
        payload.protectionLevel = null
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
      title={t('persons.promoteToWitness.drawerTitle')}
      description={t('persons.promoteToWitness.drawerDescription')}
      footer={
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4 w-full">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('persons.promoteToWitness.cancelButton')}
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={promoteMutation.isPending}
          >
            {t('persons.promoteToWitness.submitButton')}
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
            {t('persons.promoteToWitness.permanenceNotice')}
          </div>
        </div>

        <form className="space-y-4">
          <FormSection title={t('persons.promoteToWitness.section1Title')}>
            <FormField
              label={t('persons.promoteToWitness.credibilityNotesLabel')}
              error={formState.errors.credibilityNotes?.message}
            >
              <Textarea
                rows={4}
                {...form.register('credibilityNotes')}
                placeholder={t('persons.promoteToWitness.credibilityNotesPlaceholder')}
              />
            </FormField>
          </FormSection>

          <FormSection title={t('persons.promoteToWitness.section2Title')}>
            <FormField
              label={t('persons.promoteToWitness.isProtectedLabel')}
              error={formState.errors.isProtected?.message}
            >
              <Controller
                name="isProtected"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </FormField>

            <div
              className={cn(
                'overflow-hidden transition-[max-height] duration-150 ease-out md:col-span-2',
                isProtected ? 'max-h-40' : 'max-h-0'
              )}
            >
              <FormField
                label={t('persons.promoteToWitness.protectionLevelLabel')}
                required
                helperText={t('persons.promoteToWitness.protectionLevelHint')}
                error={formState.errors.protectionLevel?.message}
              >
                <Input
                  {...form.register('protectionLevel')}
                  placeholder={t('persons.promoteToWitness.protectionLevelPlaceholder')}
                />
              </FormField>
            </div>
          </FormSection>
        </form>
      </div>
    </SlideOverDrawer>
  )
}
