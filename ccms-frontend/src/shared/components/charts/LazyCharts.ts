import { createElement } from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@shared/components/feedback/Skeleton'

export const CcmsLineChart = dynamic(
  () => import('./CcmsLineChart').then((mod) => mod.CcmsLineChart),
  {
    loading: () => createElement(Skeleton, { className: 'w-full h-[280px]' }),
    ssr: false,
  }
)

export const CcmsBarChart = dynamic(
  () => import('./CcmsBarChart').then((mod) => mod.CcmsBarChart),
  {
    loading: () => createElement(Skeleton, { className: 'w-full h-[280px]' }),
    ssr: false,
  }
)

export const CcmsDonutChart = dynamic(
  () => import('./CcmsDonutChart').then((mod) => mod.CcmsDonutChart),
  {
    loading: () => createElement(Skeleton, { className: 'w-full h-[240px]' }),
    ssr: false,
  }
)
