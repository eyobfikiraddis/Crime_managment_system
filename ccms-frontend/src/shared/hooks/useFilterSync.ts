'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function useFilterSync<T extends Record<string, string>>(initialFilters: T) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const initialState = useMemo(() => {
    const nextFilters: Record<string, string> = { ...initialFilters }
    if (!searchParams) {
      return nextFilters
    }

    for (const key of Object.keys(initialFilters)) {
      const value = searchParams.get(key)
      if (value !== null) {
        nextFilters[key] = value
      }
    }

    return nextFilters
  }, [initialFilters, searchParams])

  const [filters, setFilters] = useState<T>(initialState as unknown as T)

  const syncFilters = (nextFilters: T) => {
    const params = new URLSearchParams(searchParams?.toString())

    Object.entries(nextFilters).forEach(([key, value]) => {
      if (!value) {
        params.delete(key)
        return
      }

      params.set(key, value)
    })

    router.replace(`?${params.toString()}`, { scroll: false })
    setFilters(nextFilters)
  }

  return { filters, setFilters: syncFilters }
}
