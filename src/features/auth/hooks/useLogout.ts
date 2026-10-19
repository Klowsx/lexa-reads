import { useAuthStore } from '~/stores/auth.store'
import { AppError } from '~/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { logoutFn } from '../auth.queries'

export function useLogout() {
  const router = useRouter()
  const setSession = useAuthStore((state) => state.setSession)
  const queryClient = useQueryClient()

  return useMutation<void, AppError, void>({
    mutationFn: logoutFn,
    onSuccess: () => {
      queryClient.clear()
      setSession(null)
      router.replace('/(auth)')
    }
  })
}
