'use client'

import type { ReactNode } from 'react'

import { IdleWarningModal } from '@/features/auth/components/IdleWarningModal'
import { LogoutConfirmModal } from '@/features/auth/components/LogoutConfirmModal'
import { useUiStore } from '@/shared/stores/ui.store'

type ModalComponent = (props: Record<string, unknown>) => ReactNode

const MODAL_REGISTRY: Record<string, ModalComponent> = {
  'idle-warning': () => <IdleWarningModal />,
  'logout-confirm': () => <LogoutConfirmModal />,
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
