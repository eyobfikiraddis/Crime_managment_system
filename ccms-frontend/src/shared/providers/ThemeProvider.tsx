'use client'

import { useEffect, useMemo } from 'react'

import { useUiStore } from '@/shared/stores/ui.store'

type ThemePreference = 'dark' | 'light'

type PersistedUiState = {
  state?: {
    theme?: ThemePreference
  }
}

const applyThemeClass = (theme: ThemePreference) => {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  root.classList.remove('dark', 'light')
  root.classList.add(theme)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUiStore((state) => state.theme)
  const setTheme = useUiStore((state) => state.setTheme)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const stored = window.localStorage.getItem('ccms-ui-prefs')
    if (!stored) {
      applyThemeClass(theme)
      return
    }

    try {
      const parsed = JSON.parse(stored) as PersistedUiState
      const storedTheme = parsed.state?.theme
      if (storedTheme) {
        setTheme(storedTheme)
        applyThemeClass(storedTheme)
        return
      }
    } catch {
      applyThemeClass(theme)
      return
    }

    applyThemeClass(theme)
  }, [setTheme, theme])

  useEffect(() => {
    applyThemeClass(theme)
  }, [theme])

  const contextValue = useMemo(() => ({ theme }), [theme])

  return <div data-theme={contextValue.theme}>{children}</div>
}
