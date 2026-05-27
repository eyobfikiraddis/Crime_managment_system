'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { AlertCircle, Lock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { FormField } from '@/shared/components/forms/FormField'
import { useUiStore } from '@/shared/stores/ui.store'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useCase } from '../hooks/useCase'
import { useTransitionCaseStatus } from '../hooks/useTransitionCaseStatus'
import {
  CaseStatus,
  CASE_STATUS_TRANSITIONS,
  STATUS_TRANSITION_MIN_ROLE,
} from '../types/case.types'
import {
  statusTransitionSchema,
  type StatusTransitionValues,
} from '../schemas/status-transition.schema'
import type { OfficerRole } from '@/shared/types/auth.types'

interface CaseStatusTransitionDrawerProps {
  caseId: string
}

const ROLE_RANKING: Record<OfficerRole, number> = {
  INVESTIGATOR: 1,
  FORENSIC: 1,
  LEGAL_OFFICER: 1,
  DEPT_HEAD: 2,
  ADMIN: 3,
  SUPERADMIN: 4,
}

function isRoleSufficient(userRole: OfficerRole | null, minRole?: OfficerRole): boolean {
  if (!minRole) return true
  if (!userRole) return false
  return ROLE_RANKING[userRole] >= ROLE_RANKING[minRole]
}

export function CaseStatusTransitionDrawer({ caseId }: CaseStatusTransitionDrawerProps) {
  const t = useTranslations('cases')
  const { activeModal, closeModal } = useUiStore()
  const userRole = useAuthStore((state) => state.role)

  const { data: caseDetail, isLoading } = useCase(caseId)
  const transitionMutation = useTransitionCaseStatus(caseId)

  const isOpen = activeModal?.id === 'case-status-transition' && activeModal.props?.caseId === caseId

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<StatusTransitionValues>({
    resolver: zodResolver(statusTransitionSchema),
    defaultValues: {
      reason: '',
    },
  })

  const selectedToStatus = watch('toStatus')

  // Reset form when drawer opens/closes or case details load
  useEffect(() => {
    if (isOpen && caseDetail) {
      reset({
        toStatus: undefined as any,
        reason: '',
      })
    }
  }, [isOpen, caseDetail, reset])

  if (!isOpen) return null

  const onSubmit = (data: StatusTransitionValues) => {
    transitionMutation.mutate(data, {
      onSuccess: () => {
        closeModal()
      },
    })
  }

  // Get valid transitions for current status
  const currentStatus = caseDetail?.status
  const transitionsList = currentStatus ? CASE_STATUS_TRANSITIONS[currentStatus] : []

  // Check if target status requires a reason
  const isReasonRequired = selectedToStatus === CaseStatus.ARCHIVED

  return (
    <SlideOverDrawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeModal()
      }}
      title={t('status.transitionDrawerTitle')}
      description={t('status.transitionDrawerDescription')}
      footer={
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={closeModal}
            disabled={transitionMutation.isPending}
          >
            {t('status.cancelButton')}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={
              isLoading ||
              !selectedToStatus ||
              transitionMutation.isPending ||
              (selectedToStatus &&
                STATUS_TRANSITION_MIN_ROLE[selectedToStatus] &&
                !isRoleSufficient(userRole, STATUS_TRANSITION_MIN_ROLE[selectedToStatus]))
            }
          >
            {transitionMutation.isPending ? t('detail.loading') : t('status.transitionButton')}
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex flex-col gap-4 py-8 items-center justify-center">
          <span className="text-sm text-foreground-muted">{t('detail.loading')}</span>
        </div>
      ) : !caseDetail ? (
        <div className="flex flex-col gap-2 items-center justify-center py-8">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <span className="text-sm font-medium">{t('detail.notFound')}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Current Status Info */}
          <div className="rounded-lg bg-muted/40 p-4 border border-border">
            <span className="text-xs font-semibold text-foreground-muted block mb-1">
              {t('status.currentStatus')}
            </span>
            <span className="font-medium text-sm text-foreground">
              {t(`status.${caseDetail.status}`)}
            </span>
          </div>

          {/* Available Transitions */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">{t('status.availableTransitions')}</Label>

            {transitionsList.length === 0 ? (
              <p className="text-sm text-foreground-muted italic">
                {t('status.noTransitionsAvailable')}
              </p>
            ) : (
              <RadioGroup
                value={selectedToStatus}
                onValueChange={(val) => setValue('toStatus', val as CaseStatus, { shouldValidate: true })}
                className="space-y-2"
              >
                {transitionsList.map((status) => {
                  const minRole = STATUS_TRANSITION_MIN_ROLE[status]
                  const isRoleAllowed = isRoleSufficient(userRole, minRole)
                  const isDisabled = !isRoleAllowed

                  const optionNode = (
                    <div
                      className={`flex items-center justify-between p-3 border rounded-lg transition relative ${
                        selectedToStatus === status
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/30'
                      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      onClick={() => {
                        if (!isDisabled) {
                          setValue('toStatus', status, { shouldValidate: true })
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem
                          value={status}
                          id={`status-${status}`}
                          disabled={isDisabled}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Label
                          htmlFor={`status-${status}`}
                          className={`text-sm font-medium ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t(`status.${status}`)}
                        </Label>
                      </div>
                      
                      {isDisabled && minRole && (
                        <span className="text-foreground-muted flex items-center gap-1 text-xs">
                          <Lock className="h-3 w-3" />
                          <span className="sr-only">
                            {t('status.lockedTransitionTooltip', { minRole })}
                          </span>
                        </span>
                      )}
                    </div>
                  )

                  if (isDisabled && minRole) {
                    return (
                      <TooltipProvider key={status}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>{optionNode}</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t('status.lockedTransitionTooltip', { minRole })}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  }

                  return <div key={status}>{optionNode}</div>
                })}
              </RadioGroup>
            )}
            {errors.toStatus && (
              <p className="text-xs text-destructive mt-1">{errors.toStatus.message}</p>
            )}
          </div>

          {/* Reason text area */}
          <div className="pt-2">
            <FormField
              label={t('status.reasonLabel')}
              required={isReasonRequired}
              error={errors.reason?.message || ''}
            >
              <Textarea
                {...register('reason')}
                placeholder={t('status.reasonPlaceholder')}
                className="min-h-[100px] resize-y"
              />
            </FormField>
          </div>
        </form>
      )}
    </SlideOverDrawer>
  )
}
