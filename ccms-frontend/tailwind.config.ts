import type { Config } from 'tailwindcss'

const config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    fontFamily: {
      sans: ['var(--font-sans)'],
      mono: ['var(--font-mono)', 'monospace'],
    },
    fontSize: {
      xs: ['var(--text-xs)', { lineHeight: 'var(--leading-xs)' }],
      sm: ['var(--text-sm)', { lineHeight: 'var(--leading-sm)' }],
      base: ['var(--text-base)', { lineHeight: 'var(--leading-base)' }],
      md: ['var(--text-md)', { lineHeight: 'var(--leading-md)' }],
      lg: ['var(--text-lg)', { lineHeight: 'var(--leading-lg)' }],
      xl: ['var(--text-xl)', { lineHeight: 'var(--leading-xl)' }],
      '2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-2xl)' }],
      '3xl': ['var(--text-3xl)', { lineHeight: 'var(--leading-3xl)' }],
    },
    extend: {
      colors: {
        background: 'var(--color-background)',
        card: 'var(--color-card)',
        'card-hover': 'var(--color-card-hover)',
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        accent: 'var(--color-accent)',
        destructive: 'var(--color-destructive)',
        warning: 'var(--color-warning)',
        success: 'var(--color-success)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        foreground: 'var(--color-foreground)',
        'foreground-muted': 'var(--color-foreground-muted)',
        'input-bg': 'var(--color-input-bg)',
        'input-border': 'var(--color-input-border)',
        'focus-ring': 'var(--color-focus-ring)',
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        '3xl': 'var(--spacing-3xl)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        flat: 'var(--shadow-flat)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
