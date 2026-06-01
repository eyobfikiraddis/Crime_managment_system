import dynamic from 'next/dynamic'

export const CcmsLineChart = dynamic(
  () => import('./CcmsLineChart').then((mod) => mod.CcmsLineChart),
  { ssr: false }
)

export const CcmsBarChart = dynamic(
  () => import('./CcmsBarChart').then((mod) => mod.CcmsBarChart),
  { ssr: false }
)

export const CcmsDonutChart = dynamic(
  () => import('./CcmsDonutChart').then((mod) => mod.CcmsDonutChart),
  { ssr: false }
)
