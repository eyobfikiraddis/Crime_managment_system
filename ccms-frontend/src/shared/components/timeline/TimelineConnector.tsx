interface TimelineConnectorProps {
  gapDetected?: boolean
}

export function TimelineConnector({ gapDetected }: TimelineConnectorProps) {
  return (
    <div
      className={`ml-4 h-full w-px ${
        gapDetected ? 'border-l border-dashed border-warning' : 'bg-border'
      }`}
    />
  )
}
