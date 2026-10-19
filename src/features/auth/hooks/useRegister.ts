import { useAuthStore } from '~/stores/auth.store'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { AppError } from '~/types'
import type { AuthResponse } from '@supabase/supabase-js'
import type { RegisterParams } from '~/types'
import { registerFn } from '../auth.queries'

// Registra una cuenta y la dirige al siguiente paso permitido del acceso.
export function useRegister() {
  const router = useRouter()
  const setSession = useAuthStore((state) => state.setSession)

  // Inicia el onboarding cuando Supabase devuelve una sesión; el perfil persistido decide el acceso al reabrir.
  return useMutation<AuthResponse['data'], AppError, RegisterParams>({
    mutationFn: registerFn,
    onSuccess: (data, { email }) => {
      if (data.session) {
        setSession(data.session)
      } else {
        router.replace({
          pathname: '/(auth)/confirm-email',
          params: { email: email.trim() }
        })
      }
    }
  })
}
