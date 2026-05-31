'use client'

import { useEffect, useState, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { FormField } from '@/shared/components/forms/FormField'
import { SearchableSelect } from '@/shared/components/forms/SearchableSelect'

import { assignHeadOfficerSchema, type AssignHeadOfficerValues } from '../schemas/department.schema'
import { useAssignHeadOfficer } from '../hooks/useAssignHeadOfficer'
import { getOfficers } from '@services/domain/personnel.service'
import type { HeadOfficerRef } from '../types/department.types'

interface AssignHeadOfficerDrawerProps {
  open: boolean
  departmentId: string
  currentHead: HeadOfficerRef | null
  onClose: () => void
}

export function AssignHeadOfficerDrawer({
  open,
  departmentId,
  currentHead,
  onClose,
}: AssignHeadOfficerDrawerProps) {
  const t = useTranslations('departments')
  const [discardOpen, setDiscardOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const assignMutation = useAssignHeadOfficer(departmentId)

  const { data: officersResponse, isLoading: isSearchLoading } = useQuery({
    queryKey: ['officers', 'search', searchQuery],
    queryFn: () => getOfficers({ search: searchQuery, status: ['ACTIVE'], pageSize: 20 }),
    enabled: open,
    staleTime: 30 * 1000,
  })

  const officerOptions = useMemo(() => {
    return (
      officersResponse?.data.map((off) => ({
        value: off.id,
        label: `${off.firstName} ${off.lastName} (${off.badgeNumber})`,
      })) ?? []
    )
  }, [officersResponse])

  const form = useForm<AssignHeadOfficerValues>({
    resolver: zodResolver(assignHeadOfficerSchema),
    defaultValues: {
      officerId: '',
    },
  })

  const { formState, reset } = form

  useEffect(() => {
    if (open) {
      reset({
        officerId: '',
      })
      setSearchQuery('')
    }
  }, [open, reset])

  const handleCloseRequest = () => {
    if (formState.isDirty) {
      setDiscardOpen(true)
      return
    }
    onClose()
  }

  const onSubmit = async (values: AssignHeadOfficerValues) => {
    try {
      await assignMutation.mutateAsync({
        officerId: values.officerId,
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
          }
        }}
        title={t('assignHead.drawerTitle')}
        description={t('assignHead.drawerDescription')}
        footer={
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4 w-full">
            <Button type="button" variant="outline" onClick={handleCloseRequest}>
              {t('assignHead.cancelButton')}
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={assignMutation.isPending}
            >
              {t('assignHead.submitButton')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {currentHead ? (
            <div className="flex items-start gap-2 rounded-md border border-primary bg-primary/10 p-3 text-xs text-primary mb-4">
              <span className="text-sm">ℹ️</span>
              <div>
                <span className="font-semibold">{t('assignHead.currentHead')}:</span>{' '}
                {currentHead.firstName} {currentHead.lastName} ({currentHead.badgeNumber})
                <br />
                {t('assignHead.replaceNotice')}
              </div>
            </div>
          ) : null}

          <form className="space-y-4">
            <FormField
              label={t('assignHead.officerLabel')}
              required
              helperText={t('assignHead.officerHint')}
              error={formState.errors.officerId?.message}
            >
              <Controller
                name="officerId"
                control={form.control}
                render={({ field }) => (
                  <SearchableSelect
                    options={officerOptions}
                    value={field.value}
                    onChange={field.onChange}
                    onSearch={setSearchQuery}
                    isLoading={isSearchLoading}
                    placeholder={t('assignHead.officerPlaceholder')}
                  />
                )}
              />
            </FormField>
          </form>
        </div>
      </SlideOverDrawer>

      {discardOpen ? (
        <ConfirmDialog
          open={discardOpen}
          onOpenChange={setDiscardOpen}
          title="Discard selection?"
          description="Your selection will not be saved."
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
