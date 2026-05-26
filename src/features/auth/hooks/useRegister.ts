import { useAuthStore } from "~/stores/auth.store";
import { useUIStore } from "~/stores/ui.store";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { AppError } from "~/types";
import type { AuthResponse } from "@supabase/supabase-js";
import type { RegisterParams } from "~/types";
import { registerFn } from "../auth.queries";

export function useRegister() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const setOnboardingStarted = useAuthStore((state) => state.setOnboardingStarted);
  const addToast = useUIStore((s) => s.addToast);

  return useMutation<AuthResponse["data"], AppError, RegisterParams>({
    mutationFn: registerFn,
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
