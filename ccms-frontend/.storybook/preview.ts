import React from 'react'

import type { Preview } from '@storybook/react'

import '../src/app/globals.css'
import '../src/shared/styles/tokens.css'
import { ThemeProvider } from '../src/shared/providers/ThemeProvider'

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
        ThemeProvider,
        null,
        React.createElement(
          'div',
          { className: 'dark min-h-screen bg-background text-foreground' },
          React.createElement(Story),
        ),
      ),
  ],
}

export default preview
