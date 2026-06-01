'use client'

interface TimelineConnectorProps {
  isGap?: boolean
}

export function TimelineConnector({ isGap = false }: TimelineConnectorProps) {
  if (isGap) {
    return (
      <div
        className="ml-[19px] w-[2px] h-6"
        style={{
          background:
            'repeating-linear-gradient(to bottom, var(--color-warning) 0px, var(--color-warning) 4px, transparent 4px, transparent 8px)',
        }}
        aria-hidden="true"
        data-timeline-connector=""
      />
    )
  }

  return (
    <div
      className="ml-[19px] w-[2px] h-6 bg-border"
      aria-hidden="true"
      data-timeline-connector=""
    />
  )
}
