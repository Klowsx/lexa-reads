import { supabase } from "~/lib/supabase";
import { AppError, toAppError } from "~/types";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";

// Enviar codigo al correo
export function useRequestResetPassword() {
  const router = useRouter();

  return useMutation<void, AppError, { email: string }>({
    mutationFn: async ({ email }) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw toAppError(error);
    },

    onSuccess: (_, { email }) => {
      router.push({ pathname: "/(auth)/verify-email", params: { email } });
    },
  });
}

// Verificar codigo OTP
export function useVerifyPasswordResetCode() {
  const router = useRouter();

  return useMutation<void, AppError, { email: string; token: string }>({
    mutationFn: async ({ email, token }) => {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "recovery",
      });

      if (error) throw toAppError(error);
    },

    onSuccess: () => {
      router.push("/(auth)/new-password");
    },
  });
}

// Nueva contraseña
export function useUpdatePassword() {
  const router = useRouter();

  return useMutation<void, AppError, { password: string }>({
    mutationFn: async ({ password }) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw toAppError(error);
    },
    onSuccess: async () => {
      await supabase.auth.signOut();
      router.replace("/(auth)/success");
    },
  });
}
