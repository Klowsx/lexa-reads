import { create } from 'zustand'

interface Toast {
  id: string
  message: string
  type: 'error' | 'success' | 'info'
}

interface UIState {
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  // Conserva los avisos el tiempo suficiente para leerlos y ofrece cierre manual.
  addToast: (message, type = 'error') => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { id, message, type }].slice(-3) }))
    // Los errores permanecen hasta cerrarlos; los avisos informativos se retiran solos.
    if (type !== 'error') {
      setTimeout(
        () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
        8000
      )
    }
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
}))
