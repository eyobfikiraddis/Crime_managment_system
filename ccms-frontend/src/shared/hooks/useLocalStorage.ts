'use client'

import { useCallback, useEffect, useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const storedValue = window.localStorage.getItem(key)
    if (storedValue === null) {
      return
    }

    try {
      setValue(JSON.parse(storedValue) as T)
    } catch {
      setValue(initialValue)
    }
  }, [initialValue, key])

  const setStoredValue = useCallback(
    (nextValue: T) => {
      setValue(nextValue)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(nextValue))
      }
    },
    [key],
  )

  return [value, setStoredValue] as const
}
