import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import type { PersistedClient } from '@tanstack/react-query-persist-client'

export const PERSIST_WHITELIST = [
  ['departments'],
  ['crimeTypes'],
  ['locations'],
  ['cases', 'list'],
  ['courtCases', 'list'],
] as const

export const PERSIST_BLACKLIST = [
  ['persons'],
  ['officers'],
  ['audit'],
  ['dashboard'],
  ['health'],
  ['cases', 'detail'],
] as const

function shouldPersist(queryKey: readonly unknown[]): boolean {
  const keyAsStrings = queryKey.map(String)

  // Check blacklist first (deny-wins)
  for (const blacklistKey of PERSIST_BLACKLIST) {
    const matches = blacklistKey.every((part, i) => keyAsStrings[i] === String(part))
    if (matches) return false
  }

  // Check whitelist
  for (const whitelistKey of PERSIST_WHITELIST) {
    const matches = whitelistKey.every((part, i) => keyAsStrings[i] === String(part))
    if (matches) return true
  }

  return false
}

export const localStoragePersister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'ccms-query-cache',
  serialize: (client: PersistedClient) => {
    const filtered = {
      ...client,
      clientState: {
        ...client.clientState,
        queries: client.clientState.queries.filter((q) =>
          shouldPersist(q.queryKey as readonly unknown[]),
        ),
      },
    }
    return JSON.stringify(filtered)
  },
})
