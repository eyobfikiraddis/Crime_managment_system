'use client'

import type { ReactNode } from 'react'

import { IdleWarningModal } from '@/features/auth/components/IdleWarningModal'
import { LogoutConfirmModal } from '@/features/auth/components/LogoutConfirmModal'
import { CaseStatusTransitionDrawer } from '@/features/cases/components/CaseStatusTransitionDrawer'
import { useUiStore } from '@/shared/stores/ui.store'

type ModalComponent = (props: Record<string, unknown>) => ReactNode

// NOTE: EvidenceLightbox is intentionally excluded from the global MODAL_REGISTRY.
// It requires complex component-local state, specifically the list of sibling photos
// and the current image index, which are not suitable for global routing/registry props.
const MODAL_REGISTRY: Record<string, ModalComponent> = {
  'idle-warning': () => <IdleWarningModal />,
  'logout-confirm': () => <LogoutConfirmModal />,
  'case-status-transition': (props) => <CaseStatusTransitionDrawer caseId={props.caseId as string} />,
}

export function ModalRenderer() {
  const activeModal = useUiStore((state) => state.activeModal)

  if (!activeModal) {
    return null
  }

  const ModalComponent = MODAL_REGISTRY[activeModal.id]
  if (!ModalComponent) {
    return null
  }

  return <>{ModalComponent(activeModal.props)}</>
}
