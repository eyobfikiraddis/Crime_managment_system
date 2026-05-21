import { toast } from 'sonner'
import { create } from 'zustand'

export type Toast = {
  id: string
  message: string
  variant: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface NotificationState {
  toasts: Toast[]
  addToast: (toastData: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearAll: () => void
}

const createToastId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const showToast = (toastData: Omit<Toast, 'id'> & { id: string }) => {
  const options = { id: toastData.id, duration: toastData.duration }

  switch (toastData.variant) {
    case 'success':
      toast.success(toastData.message, options)
      break
    case 'error':
      toast.error(toastData.message, options)
      break
    case 'warning':
      toast.warning(toastData.message, options)
      break
    default:
      toast(toastData.message, options)
  }
}

export const useNotificationStore = create<NotificationState>((set) => ({
  toasts: [],
  addToast: (toastData) => {
    const id = createToastId()
    const toastEntry = { id, ...toastData }

    set((state) => ({ toasts: [...state.toasts, toastEntry] }))
    showToast(toastEntry)

    return id
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toastEntry) => toastEntry.id !== id),
    })),
  clearAll: () => set({ toasts: [] }),
}))
