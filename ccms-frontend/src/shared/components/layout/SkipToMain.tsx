'use client'

import { useTranslations } from 'next-intl'

export function SkipToMain() {
  const t = useTranslations('accessibility')

  return (
    <a
      href="#main-content"
      className={[
        'absolute top-0 left-0 z-[9999] px-4 py-2',
        'bg-primary text-white text-sm font-medium rounded-br-md',
        // Visually hidden until focused
        'sr-only focus:not-sr-only focus:outline-none',
        'transition-transform focus:translate-x-0 -translate-x-full',
        'print:hidden',
      ].join(' ')}
    >
      {t('skipToMain')}
    </a>
  )
}
export default SkipToMain
