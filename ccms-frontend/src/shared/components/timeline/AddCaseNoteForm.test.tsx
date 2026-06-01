import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { AddCaseNoteForm } from './AddCaseNoteForm'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string, options?: any) => {
    if (options && options.count !== undefined) return `${options.count} / 2000`
    return namespace ? `${namespace}.${key}` : key
  },
}))

// Mock useAddCaseNote hook
const mockMutate = vi.fn()
vi.mock('@features/audit/hooks/useAddCaseNote', () => ({
  useAddCaseNote: () => ({
    mutate: (payload: any, options?: any) => {
      mockMutate(payload)
      if (options && options.onSuccess) {
        options.onSuccess()
      }
    },
    isPending: false,
  }),
}))

// Mock PermissionGuard to always render
vi.mock('@shared/components/permission/PermissionGuard', () => ({
  PermissionGuard: ({ children }: any) => <>{children}</>,
}))

describe('AddCaseNoteForm Component Tests', () => {
  it('disables submit button initially', () => {
    render(<AddCaseNoteForm caseId="case-123" />)
    const btn = screen.getByText('note.submitButton') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('enables submit button and calls mutation when typing valid note', async () => {
    render(<AddCaseNoteForm caseId="case-123" />)
    const text = screen.getByPlaceholderText('note.placeholder')
    const btn = screen.getByText('note.submitButton') as HTMLButtonElement

    fireEvent.change(text, { target: { value: 'Valid Case Note text' } })
    await waitFor(() => {
      expect(btn.disabled).toBe(false)
    })

    fireEvent.click(btn)
    expect(mockMutate).toHaveBeenCalledWith({ text: 'Valid Case Note text' })

    // Input should be reset
    expect((text as HTMLTextAreaElement).value).toBe('')
  })
})
