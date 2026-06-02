export function getFocusRestorer(): () => void {
  const activeElement = typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null
  return () => {
    if (activeElement && typeof activeElement.focus === 'function') {
      requestAnimationFrame(() => {
        activeElement.focus({ preventScroll: true })
      })
    }
  }
}

export function useFocusRestore() {
  let restorer: (() => void) | null = null

  function openWithFocusRestore(open: () => void): void {
    restorer = getFocusRestorer()
    open()
  }

  function restoreFocusOnClose(): void {
    restorer?.()
    restorer = null
  }

  return { openWithFocusRestore, restoreFocusOnClose }
}
