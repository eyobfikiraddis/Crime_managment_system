import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import importPlugin from 'eslint-plugin-import'

const __dirname = dirname(fileURLToPath(import.meta.url))

const typeCheckedRules = tseslint.configs['recommended-type-checked']?.rules ?? {}

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
    },
    rules: {
      ...typeCheckedRules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            { target: './src/features', from: './src/shared' },
            { target: './src/features', from: './src/services' },
            { target: './src/shared/components', from: './src/services' },
          ],
        },
      ],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          pathGroups: [
            { pattern: '@/**', group: 'internal' },
            { pattern: '@shared/**', group: 'internal' },
            { pattern: '@features/**', group: 'internal' },
            { pattern: '@services/**', group: 'internal' },
            { pattern: '@config/**', group: 'internal' },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: ['@features/*/*'],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'dangerouslySetInnerHTML is not allowed in this project.',
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['@features/*', '@features/*/*'],
        },
      ],
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'storybook-static/**'],
  },
])
