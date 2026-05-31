'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { FormField } from '@/shared/components/forms/FormField'
import { FormSection } from '@/shared/components/forms/FormSection'

import { promoteToVictimSchema, type PromoteToVictimValues } from '@features/personnel/schemas/person.schema'
import { usePromoteToVictim } from '@features/personnel/hooks/usePromoteToVictim'
import { PromoteToVictimPayload } from '@features/personnel/types/personnel.types'

interface PromoteToVictimDrawerProps {
  personId: string
  open: boolean
  onClose: () => void
}

export default function PromoteToVictimDrawer({ personId, open, onClose }: PromoteToVictimDrawerProps) {
  const t = useTranslations('personnel')
  const promoteMutation = usePromoteToVictim(personId)

  const form = useForm<PromoteToVictimValues>({
    resolver: zodResolver(promoteToVictimSchema),
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

  const onSubmit = async (values: PromoteToVictimValues) => {
    try {
      const payload: PromoteToVictimPayload = {}
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
      title={t('persons.promoteToVictim.drawerTitle')}
      description={t('persons.promoteToVictim.drawerDescription')}
      footer={
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4 w-full">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('persons.promoteToVictim.cancelButton')}
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={promoteMutation.isPending}
          >
            {t('persons.promoteToVictim.submitButton')}
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
            {t('persons.promoteToVictim.permanenceNotice')}
          </div>
        </div>

        <form className="space-y-4">
          <FormSection title={t('persons.promoteToVictim.section1Title')}>
            <FormField
              label={t('persons.promoteToVictim.notesLabel')}
              error={formState.errors.notes?.message}
            >
              <Textarea
                rows={5}
                {...form.register('notes')}
                placeholder={t('persons.promoteToVictim.notesPlaceholder')}
              />
            </FormField>
          </FormSection>
        </form>
      </div>
    </SlideOverDrawer>
  )
}
