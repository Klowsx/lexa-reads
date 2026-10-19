import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import { USERNAME_PATTERN } from "~/lib/username";
import { useAuthStore } from "~/stores/auth.store";
import type { OnboardingPreferences, UserProfile } from "~/types/user";
import {
  meQueryOptions,
  saveOnboardingPreferencesFn,
} from "~/features/user/user.queries";

export { normalizeUsername } from "~/lib/username";

// Comprueba la disponibilidad en servidor; la restricción única sigue siendo la protección ante carreras.
async function checkUsernameAvailability(username: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_username_available", {
    p_username: username,
  });
  if (error) throw error;
  return data;
}

// Consulta un nombre válido después de una pausa para no pedir datos por cada pulsación.
export function useUsernameAvailability(username: string) {
  const isValid = USERNAME_PATTERN.test(username);

  return useQuery({
    queryKey: ["username_availability", username],
    queryFn: () => checkUsernameAvailability(username),
    enabled: isValid,
    staleTime: 30_000,
  });
}

// Persiste géneros y meta antes del último paso para reanudar el flujo desde cualquier reinicio.
export function useSaveOnboardingPreferences() {
  const userId = useAuthStore((state) => state.user?.id ?? "");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OnboardingPreferences) => {
      if (!userId) throw new Error("No hay una sesión activa");
      return saveOnboardingPreferencesFn(userId, data);
    },
    onSuccess: (profile) => {
      queryClient.setQueryData<UserProfile>(meQueryOptions(userId).queryKey, profile);
    },
  });
}

// Completa el perfil de forma atómica en el servidor y actualiza la caché de la sesión actual.
export function useCompleteOnboarding() {
  const userId = useAuthStore((state) => state.user?.id ?? "");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      const { data, error } = await supabase.rpc("complete_onboarding", {
        p_username: username,
      });
      if (error) throw error;
      return data as UserProfile;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData<UserProfile>(meQueryOptions(userId).queryKey, profile);
    },
  });
}
