// ─── CCMS Chart Colour Constants ─────────────────────────────────────────────
// Recharts requires hex colours — CSS variables are not supported.
// These values correspond exactly to the CCMS dark-mode design tokens.

export const CHART_COLORS = {
  primary:     '#3B82F6',    // --color-primary (blue)
  success:     '#22C55E',    // --color-success (green)
  warning:     '#F59E0B',    // --color-warning (amber)
  destructive: '#EF4444',    // --color-destructive (red)
  accent:      '#6366F1',    // --color-accent (indigo)
  muted:       '#64748B',    // --color-muted (slate)
  pink:        '#EC4899',
  teal:        '#14B8A6',
  orange:      '#F97316',
  violet:      '#8B5CF6',

  // Axis, grid, and tooltip chrome (dark theme)
  axisLabel:       '#94A3B8',    // --color-foreground-muted
  gridLine:        '#334155',    // --color-border
  tooltipBg:       '#1E293B',    // --color-card
  tooltipBorder:   '#334155',    // --color-border
  tooltipText:     '#F1F5F9',    // --color-foreground

  // Ordered palette for multi-series charts (use series[index % series.length])
  series: [
    '#3B82F6',  // primary blue
    '#22C55E',  // success green
    '#F59E0B',  // warning amber
    '#6366F1',  // accent indigo
    '#EF4444',  // destructive red
    '#EC4899',  // pink
    '#14B8A6',  // teal
    '#F97316',  // orange
  ] as const,
} as const
