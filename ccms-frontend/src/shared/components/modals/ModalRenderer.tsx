'use client'

import type { ReactNode } from 'react'

import { useUiStore } from '@/shared/stores/ui.store'

type ModalComponent = (props: Record<string, unknown>) => ReactNode

const MODAL_REGISTRY: Record<string, ModalComponent> = {}

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
