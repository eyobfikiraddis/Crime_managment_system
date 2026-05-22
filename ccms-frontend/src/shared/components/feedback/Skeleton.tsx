import { Skeleton as UiSkeleton } from '@/components/ui/skeleton'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <UiSkeleton className={className} />
}
