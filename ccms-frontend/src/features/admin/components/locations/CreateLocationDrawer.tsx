'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { FormField } from '@/shared/components/forms/FormField'

import { createLocationSchema, type CreateLocationValues } from '../../schemas/location.schema'
import { useCreateLocation } from '../../hooks/useCreateLocation'

interface CreateLocationDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateLocationDrawer({ open, onOpenChange }: CreateLocationDrawerProps) {
  const t = useTranslations('admin')
  const [discardOpen, setDiscardOpen] = useState(false)
  const createMutation = useCreateLocation()

  const form = useForm<CreateLocationValues>({
    resolver: zodResolver(createLocationSchema),
    defaultValues: {
      name: '',
      region: '',
      country: 'Ethiopia',
    },
  })

  const { formState, reset } = form

  useEffect(() => {
    if (open) {
      reset({
        name: '',
        region: '',
        country: 'Ethiopia',
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

  const onSubmit = async (values: CreateLocationValues) => {
    try {
      await createMutation.mutateAsync({
        name: values.name,
        region: values.region || undefined,
        country: values.country,
      })
      onOpenChange(false)
      reset()
    } catch (err) {
      // Handled by hook toast
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
        title={t('locations.create.drawerTitle')}
        description={t('locations.create.drawerDescription')}
        footer={
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4 w-full">
            <Button type="button" variant="outline" onClick={handleCloseRequest}>
              {t('locations.create.cancelButton')}
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={createMutation.isPending}
            >
              {t('locations.create.submitButton')}
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <FormField
            label={t('locations.create.nameLabel')}
            required
            error={formState.errors.name?.message}
          >
            <Input
              {...form.register('name')}
              placeholder={t('locations.create.namePlaceholder')}
            />
          </FormField>

          <FormField
            label={t('locations.create.regionLabel')}
            error={formState.errors.region?.message}
          >
            <Input
              {...form.register('region')}
              placeholder={t('locations.create.regionPlaceholder')}
            />
          </FormField>

          <FormField
            label={t('locations.create.countryLabel')}
            required
            error={formState.errors.country?.message}
          >
            <Input
              {...form.register('country')}
              placeholder={t('locations.create.countryPlaceholder')}
            />
          </FormField>
        </form>
      </SlideOverDrawer>

      {discardOpen ? (
        <ConfirmDialog
          open={discardOpen}
          onOpenChange={setDiscardOpen}
          title="Discard location record?"
          description="Your unsaved data will be lost."
          confirmLabel="Discard"
          cancelLabel="Cancel"
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
