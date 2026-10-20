import { useAuthStore } from '~/stores/auth.store'
import { AppError } from '~/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { logoutFn } from '../auth.queries'

// Cierra el acceso actual y descarta los datos privados almacenados en memoria.
export function useLogout() {
  const setSession = useAuthStore((state) => state.setSession)
  const queryClient = useQueryClient()

  return useMutation<void, AppError, void>({
    mutationFn: logoutFn,
    onSuccess: () => {
      queryClient.clear()
      setSession(null)
    }
  })
}
