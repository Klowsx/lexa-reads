import { QueryClient } from '@tanstack/react-query'
import { toAppError } from '~/types/errors'
import { useUIStore } from '~/stores/ui.store'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 2
    },
    mutations: {
      onError: (error) => {
        // Presenta una instrucción útil sin mostrar detalles técnicos del servidor.
        const appError = toAppError(error)
        const message =
          appError.code === 'NETWORK_ERROR'
            ? 'Sin conexión. Revisa tu red e inténtalo de nuevo.'
            : appError.code === 'UNKNOWN'
              ? 'No se pudo completar la acción. Inténtalo de nuevo.'
              : appError.message
        useUIStore.getState().addToast(message, 'error')
      }
    }
  }
})
