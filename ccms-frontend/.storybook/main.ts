import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  framework: '@storybook/nextjs',
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
  ],
  staticDirs: ['../public'],
  docs: {
    autodocs: true,
  },
}

export default config
