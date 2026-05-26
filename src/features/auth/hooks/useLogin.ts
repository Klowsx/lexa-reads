import { AppError } from "~/types";
import { AuthResponse } from "@supabase/supabase-js";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import type { LoginParams } from "~/types";
import { loginFn } from "../auth.queries";

export function useLogin() {
  const router = useRouter();

  return useMutation<AuthResponse["data"], AppError, LoginParams>({
    mutationFn: loginFn,
    onSuccess: () => {
      router.replace("/(tabs)/feed");
    },
  });
}
