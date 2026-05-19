import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/stores/auth.store";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { toAppError, AppError } from "@/src/types";
import type { AuthResponse } from "@supabase/supabase-js";

interface RegisterParams {
  email: string;
  password: string;
  displayName: string;
}

export function useRegister() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation<AuthResponse['data'], AppError, RegisterParams>({
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
      if (data.session) setSession(data.session);
      router.push("/(auth)/login");
    },
  });
}
