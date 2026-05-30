'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Scale } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/shared/components/display/EmptyState'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { ForbiddenState } from '@/shared/components/feedback/ForbiddenState'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { PermissionGuard } from '@/shared/components/permission/PermissionGuard'
import { Permission } from '@/shared/constants/permissions'

import { useCourtCaseByCase } from '../hooks/useCourtCaseByCase'
import { isChargeTerminal } from '../utils/chargeUtils'
import type { ChargeListItem } from '../types/legal.types'
import { CourtCaseCard } from './CourtCaseCard'
import { ChargesTable } from './ChargesTable'
import { CreateCourtCaseDrawer } from './CreateCourtCaseDrawer'
import { UpdateCourtCaseDrawer } from './UpdateCourtCaseDrawer'
import { AddChargeDrawer } from './AddChargeDrawer'
import { UpdateChargeStatusDrawer } from './UpdateChargeStatusDrawer'
import { DropChargeDialog } from './DropChargeDialog'
import { ViewSentenceDrawer } from './ViewSentenceDrawer'

interface LegalTabProps {
  caseId: string
}

export function LegalTab({ caseId }: LegalTabProps) {
  const t = useTranslations('legal')
  const tErrors = useTranslations('errors')

  const { data: courtCase, isLoading, isError, refetch } = useCourtCaseByCase(caseId)

  const [createCourtCaseOpen, setCreateCourtCaseOpen] = useState(false)
  const [updateCourtCaseOpen, setUpdateCourtCaseOpen] = useState(false)
  const [addChargeOpen, setAddChargeOpen] = useState(false)
  const [selectedCharge, setSelectedCharge] = useState<ChargeListItem | null>(null)
  const [updateChargeOpen, setUpdateChargeOpen] = useState(false)
  const [dropChargeOpen, setDropChargeOpen] = useState(false)
  const [viewSentenceOpen, setViewSentenceOpen] = useState(false)

  const handleUpdateStatus = (charge: ChargeListItem) => {
    if (isChargeTerminal(charge.status)) {
      if (charge.status === 'CONVICTED') {
        setSelectedCharge(charge)
        setViewSentenceOpen(true)
      }
      return
    }
    setSelectedCharge(charge)
    setUpdateChargeOpen(true)
  }

  const handleDropCharge = (charge: ChargeListItem) => {
    if (isChargeTerminal(charge.status)) return
    setSelectedCharge(charge)
    setDropChargeOpen(true)
  }

  const handleViewSentence = (charge: ChargeListItem) => {
    setSelectedCharge(charge)
    setViewSentenceOpen(true)
  }

  const loadingSkeleton = (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  )

  return (
    <PermissionGuard
      permission={Permission.LEGAL_READ}
      fallback={<ForbiddenState description={t('tab.lockedTooltip')} />}
    >
      <div className="space-y-6">
        {isLoading ? (
          loadingSkeleton
        ) : isError ? (
          <ErrorState
            title={t('tab.errorTitle')}
            description={t('tab.errorDescription')}
            retry={() => void refetch()}
            retryLabel={tErrors('pages.global.action')}
          />
        ) : courtCase === null ? (
          <EmptyState
            icon={Scale}
            title={t('courtCase.empty.title')}
            description={t('courtCase.empty.description')}
            action={
              <PermissionGuard permission={Permission.LEGAL_MANAGE}>
                <Button onClick={() => setCreateCourtCaseOpen(true)}>
                  {t('courtCase.empty.createButton')}
                </Button>
              </PermissionGuard>
            }
          />
        ) : (
          <>
            <CourtCaseCard
              courtCase={courtCase}
              onEdit={() => setUpdateCourtCaseOpen(true)}
            />
            <ChargesTable
              courtCaseId={courtCase.id}
              caseId={caseId}
              onAddCharge={() => setAddChargeOpen(true)}
              onUpdateStatus={handleUpdateStatus}
              onDropCharge={handleDropCharge}
              onViewSentence={handleViewSentence}
            />
          </>
        )}
      </div>

      <CreateCourtCaseDrawer
        open={createCourtCaseOpen}
        onOpenChange={setCreateCourtCaseOpen}
        caseId={caseId}
      />

      {courtCase ? (
        <UpdateCourtCaseDrawer
          open={updateCourtCaseOpen}
          onOpenChange={setUpdateCourtCaseOpen}
          courtCase={courtCase}
          caseId={caseId}
        />
      ) : null}

      {courtCase ? (
        <AddChargeDrawer
          open={addChargeOpen}
          onOpenChange={setAddChargeOpen}
          courtCaseId={courtCase.id}
          caseId={caseId}
        />
      ) : null}

      {courtCase && selectedCharge ? (
        <UpdateChargeStatusDrawer
          open={updateChargeOpen}
          onOpenChange={(open) => {
            if (!open) setUpdateChargeOpen(false)
          }}
          chargeId={selectedCharge.id}
          courtCaseId={courtCase.id}
          caseId={caseId}
        />
      ) : null}

      {courtCase && selectedCharge ? (
        <DropChargeDialog
          open={dropChargeOpen}
          onOpenChange={(open) => {
            if (!open) setDropChargeOpen(false)
          }}
          charge={selectedCharge}
          courtCaseId={courtCase.id}
          caseId={caseId}
        />
      ) : null}

      {courtCase && selectedCharge ? (
        <ViewSentenceDrawer
          open={viewSentenceOpen}
          onOpenChange={(open) => {
            if (!open) setViewSentenceOpen(false)
          }}
          chargeId={selectedCharge.id}
          charge={selectedCharge}
        />
      ) : null}
    </PermissionGuard>
  )
}
