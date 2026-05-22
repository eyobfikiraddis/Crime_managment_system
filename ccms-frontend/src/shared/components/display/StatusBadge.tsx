import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex min-w-[80px] items-center justify-center rounded-md px-2 py-1 text-xs font-medium',
  {
    variants: {
      variant: {
        primary: 'bg-primary/10 text-primary',
        warning: 'bg-warning/10 text-warning',
        destructive: 'bg-destructive/10 text-destructive',
        success: 'bg-success/10 text-success',
        accent: 'bg-accent/10 text-accent',
        muted: 'bg-muted/20 text-foreground-muted',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
)

interface StatusBadgeProps extends VariantProps<typeof badgeVariants> {
  status: string
  className?: string
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  return (
    <span
      role="status"
      aria-label={`Status: ${status}`}
      className={cn(badgeVariants({ variant, className }))}
    >
      {status}
    </span>
  )
}
