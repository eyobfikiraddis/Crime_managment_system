'use client'

import { useEffect, useState, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { FormField } from '@/shared/components/forms/FormField'
import { FormSection } from '@/shared/components/forms/FormSection'
import { SearchableSelect } from '@/shared/components/forms/SearchableSelect'

import { updateDepartmentSchema, type UpdateDepartmentValues } from '../schemas/department.schema'
import { useUpdateDepartment } from '../hooks/useUpdateDepartment'
import { useLocationList } from '@/features/admin/hooks/useLocationList'
import type { Department } from '../types/department.types'

interface UpdateDepartmentDrawerProps {
  open: boolean
  department: Department
  onClose: () => void
}

export function UpdateDepartmentDrawer({ open, department, onClose }: UpdateDepartmentDrawerProps) {
  const t = useTranslations('departments')
  const [discardOpen, setDiscardOpen] = useState(false)

  const updateMutation = useUpdateDepartment(department.id)

  const { data: locations, isLoading: isLocLoading } = useLocationList({
    pageSize: 100,
    sortField: 'name',
    sortDirection: 'asc',
  })

  const locationOptions = useMemo(() => {
    return (
      locations?.data.map((loc) => ({
        value: loc.id,
        label: loc.region ? `${loc.name}, ${loc.region}` : loc.name,
      })) ?? []
    )
  }, [locations])

  const form = useForm<UpdateDepartmentValues>({
    resolver: zodResolver(updateDepartmentSchema),
    defaultValues: {
      name: department.name,
      code: department.code || '',
      locationId: department.location?.id || '',
      description: department.description || '',
    },
  })

  const { formState, reset } = form

  useEffect(() => {
    if (open) {
      reset({
        name: department.name,
        code: department.code || '',
        locationId: department.location?.id || '',
        description: department.description || '',
      })
    }
  }, [open, department, reset])

  const handleCloseRequest = () => {
    if (formState.isDirty) {
      setDiscardOpen(true)
      return
    }
    onClose()
  }

  const onSubmit = async (values: UpdateDepartmentValues) => {
    try {
      await updateMutation.mutateAsync({
        name: values.name,
        code: values.code || null,
        locationId: values.locationId || null,
        description: values.description || null,
      })
      onClose()
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
            return
          }
        }}
        title={t('update.drawerTitle')}
        description={t('update.drawerDescription')}
        footer={
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4 w-full">
            <Button type="button" variant="outline" onClick={handleCloseRequest}>
              {t('update.cancelButton')}
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={updateMutation.isPending}
            >
              {t('update.submitButton')}
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <FormSection title={t('update.section1Title')}>
            <FormField
              label={t('update.nameLabel')}
              required
              error={formState.errors.name?.message}
            >
              <Input
                {...form.register('name')}
              />
            </FormField>

            <FormField
              label={t('update.codeLabel')}
              helperText={t('update.codeHint')}
              error={formState.errors.code?.message}
            >
              <Input
                {...form.register('code')}
              />
            </FormField>
          </FormSection>

          <FormSection title={t('update.section2Title')}>
            <FormField
              label={t('update.locationLabel')}
              error={formState.errors.locationId?.message}
            >
              <Controller
                name="locationId"
                control={form.control}
                render={({ field }) => (
                  <SearchableSelect
                    options={locationOptions}
                    value={field.value || ''}
                    onChange={field.onChange}
                    isLoading={isLocLoading}
                    placeholder={t('update.locationPlaceholder')}
                  />
                )}
              />
            </FormField>

            <FormField
              label={t('update.descriptionLabel')}
              error={formState.errors.description?.message}
            >
              <Textarea
                {...form.register('description')}
                placeholder={t('update.descriptionPlaceholder')}
                rows={4}
              />
            </FormField>
          </FormSection>
        </form>
      </SlideOverDrawer>

      {discardOpen ? (
        <ConfirmDialog
          open={discardOpen}
          onOpenChange={setDiscardOpen}
          title="Discard unsaved changes?"
          description="Your unsaved data will be lost."
          confirmLabel="Discard"
          cancelLabel="Cancel"
          onConfirm={() => {
            setDiscardOpen(false)
            reset()
            onClose()
          }}
        />
      ) : null}
    </>
  )
}
