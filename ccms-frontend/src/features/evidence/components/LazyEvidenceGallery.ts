// src/features/evidence/components/LazyEvidenceGallery.ts
import { createElement } from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@shared/components/feedback/Skeleton'

export const LazyEvidenceGallery = dynamic(
  () => import('./EvidenceGallery').then((m) => ({ default: m.EvidenceGallery })),
  {
    loading: () => createElement(Skeleton, { className: 'w-full h-[300px]' }),
    ssr: false,
  },
)
export default LazyEvidenceGallery
