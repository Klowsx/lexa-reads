import { supabase } from "~/lib/supabase";
import { AppError, toAppError } from "~/types";
import { AuthResponse } from "@supabase/supabase-js";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";

interface LoginParams {
  email: string;
  password: string;
}

export function useLogin() {
  const router = useRouter();

  return useMutation<AuthResponse["data"], AppError, LoginParams>({
    mutationFn: async ({ email, password }: LoginParams) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw toAppError(error);
      return data;
    },
    onSuccess: () => {
      router.replace("/(tabs)/feed");
    },
  });
}
