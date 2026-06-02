// src/features/evidence/components/LazyLightbox.ts
import { createElement } from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@shared/components/feedback/Skeleton'

export const LazyLightbox = dynamic(
  () => import('./EvidenceLightbox').then((m) => ({ default: m.EvidenceLightbox })),
  {
    loading: () =>
      createElement(
        'div',
        { className: 'fixed inset-0 bg-black/90 flex items-center justify-center z-50' },
        createElement(Skeleton, { className: 'w-[600px] h-[400px]' })
      ),
    ssr: false,
  },
)
export default LazyLightbox
