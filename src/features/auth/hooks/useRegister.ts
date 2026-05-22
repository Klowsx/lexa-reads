import { supabase } from "~/lib/supabase";
import { useAuthStore } from "~/stores/auth.store";
import { useUIStore } from "~/stores/ui.store";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { toAppError, AppError } from "~/types";
import type { AuthResponse } from "@supabase/supabase-js";

interface RegisterParams {
  email: string;
  password: string;
  displayName: string;
}

export function useRegister() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const setOnboardingStarted = useAuthStore((state) => state.setOnboardingStarted);
  const addToast = useUIStore((s) => s.addToast);

  return useMutation<AuthResponse["data"], AppError, RegisterParams>({
    mutationFn: async ({ email, password, displayName }: RegisterParams) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });
      if (error) throw toAppError(error);
      return data;
    },
    onSuccess: (data) => {
      if (data.session) {
        setOnboardingStarted(true);
        setSession(data.session);
        router.replace("/(auth)/onboarding/genres");
      } else {
        addToast("Revisa tu correo para confirmar tu cuenta", "info");
        router.push("/(auth)/login");
      }
    },
  });
}
