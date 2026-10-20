import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '~/lib/supabase'
import { usernameAvailabilityQueryOptions } from '../auth.queries'
import { useAuthStore } from '~/stores/auth.store'
import type { OnboardingPreferences, UserProfile } from '~/types/user'
import {
  meQueryOptions,
  saveOnboardingPreferencesFn
} from '~/features/user/user.queries'

export { normalizeUsername } from '~/lib/username'

// Consulta un nombre válido después de una pausa para no pedir datos por cada pulsación.
export function useUsernameAvailability(username: string) {
  return useQuery(usernameAvailabilityQueryOptions(username))
}

// Persiste géneros y meta antes del último paso para reanudar el flujo desde cualquier reinicio.
export function useSaveOnboardingPreferences() {
  const userId = useAuthStore((state) => state.user?.id ?? '')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: OnboardingPreferences) => {
      if (!userId) throw new Error('No hay una sesión activa')
      return saveOnboardingPreferencesFn(userId, data)
    },
    onSuccess: (profile) => {
      queryClient.setQueryData<UserProfile>(
        meQueryOptions(userId).queryKey,
        profile
      )
    }
  })
}

// Completa el perfil de forma atómica en el servidor y actualiza la caché de la sesión actual.
export function useCompleteOnboarding() {
  const userId = useAuthStore((state) => state.user?.id ?? '')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (username: string) => {
      const { data, error } = await supabase.rpc('complete_onboarding', {
        p_username: username
      })
      if (error) throw error
      return data as UserProfile
    },
    // Revalida la disponibilidad si otra cuenta reservó el nombre mientras se completaba el formulario.
    onError: (_error, username) => {
      void queryClient.invalidateQueries({
        queryKey: usernameAvailabilityQueryOptions(username).queryKey
      })
    },
    onSuccess: (profile) => {
      queryClient.setQueryData<UserProfile>(
        meQueryOptions(userId).queryKey,
        profile
      )
    }
  })
}
