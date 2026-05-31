export const adminKeys = {
  // ── Health ─────────────────────────────────────────────────────────────────
  health: () => ['admin', 'health'] as const,
  readiness: () => ['admin', 'readiness'] as const,

  // ── Locations ──────────────────────────────────────────────────────────────
  locations: () => ['admin', 'locations'] as const,
  locationList: () => [...adminKeys.locations(), 'list'] as const,
  locationListFiltered: (filters: Record<string, unknown>) =>
    [...adminKeys.locationList(), filters] as const,

  // ── Crime Types ────────────────────────────────────────────────────────────
  crimeTypes: () => ['admin', 'crime-types'] as const,
  crimeTypeList: () => [...adminKeys.crimeTypes(), 'list'] as const,
  crimeTypeListFiltered: (filters: Record<string, unknown>) =>
    [...adminKeys.crimeTypeList(), filters] as const,
} as const
