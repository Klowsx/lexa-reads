import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/stores/auth.store";
import { AppError, toAppError } from "@/src/types";
import { AuthResponse } from "@supabase/supabase-js";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";

interface LoginParams {
  email: string;
  //   username: string; para usar username como opcion tambien
  password: string;
}

export function useLogin() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation<AuthResponse["data"], AppError, LoginParams>({
    mutationFn: async ({ email, password }: LoginParams) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw toAppError(error);
      return data;
    },
    onSuccess: (data) => {
      if (data.session) setSession(data.session);
      router.replace("/(tabs)");
    },
  });
}
