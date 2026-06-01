import React from 'react'

import type { Preview } from '@storybook/react'
import { NextIntlClientProvider } from 'next-intl'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import '../src/app/globals.css'
import '../src/shared/styles/tokens.css'
import { ThemeProvider } from '../src/shared/providers/ThemeProvider'

import accessibility from '../messages/en/accessibility.json'
import audit from '../messages/en/audit.json'
import common from '../messages/en/common.json'
import errors from '../messages/en/errors.json'
import cases from '../messages/en/cases.json'
import evidence from '../messages/en/evidence.json'
import legal from '../messages/en/legal.json'
import personnel from '../messages/en/personnel.json'
import { useAuthStore } from '../src/shared/stores/auth.store'

// Mock authenticated store state with full permissions by default
useAuthStore.setState({
  isAuthenticated: true,
  permissions: [
    'cases:read',
    'cases:write',
    'cases:delete',
    'legal:manage',
    'admin:manage',
    'superadmin:only',
  ],
  role: 'SUPERADMIN',
  officer: {
    badgeNumber: 'SA-0001',
    firstName: 'System',
    lastName: 'Admin',
    email: 'admin@police.gov.et',
    role: 'SUPERADMIN',
    department: 'HQ',
    status: 'ACTIVE',
  },
})

const messages = {
  accessibility,
  audit,
  common,
  errors,
  cases,
  evidence,
  legal,
  personnel,
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: 'var(--color-background)' },
        { name: 'light', value: 'var(--color-card)' },
      ],
    },
  },
  decorators: [
    (Story) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          NextIntlClientProvider,
          { locale: 'en', messages },
          React.createElement(
            ThemeProvider,
            null,
            React.createElement(
              'div',
              { className: 'dark min-h-screen bg-background text-foreground p-6' },
              React.createElement(Story)
            )
          )
        )
      ),
  ],
}

export default preview
