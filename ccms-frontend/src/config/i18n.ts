export const locales = ['en', 'am'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  am: 'አማርኛ',
}

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  am: '🇪🇹',
}
