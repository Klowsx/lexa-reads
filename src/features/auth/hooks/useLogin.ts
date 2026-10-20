import { AppError } from '~/types'
import { AuthResponse } from '@supabase/supabase-js'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import type { LoginParams } from '~/types'
import { loginFn } from '../auth.queries'
import { saveRecoveryContext } from '../recovery-context'

// Establece la sesión; el guard global decide el destino cuando el perfil está disponible.
export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession)
  const setRecoveryMode = useAuthStore((state) => state.setRecoveryMode)

  return useMutation<AuthResponse['data'], AppError, LoginParams>({
    mutationFn: loginFn,
    onSuccess: async (data) => {
      await saveRecoveryContext(null)
      setRecoveryMode(false)
      setSession(data.session)
    }
  })
}
