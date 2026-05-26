import { AppError } from "~/types";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  requestResetPasswordFn,
  verifyPasswordResetCodeFn,
  updatePasswordFn,
} from "../auth.queries";

export function useRequestResetPassword() {
  const router = useRouter();

  return useMutation<void, AppError, { email: string }>({
    mutationFn: requestResetPasswordFn,
    onSuccess: (_, { email }) => {
      router.push({ pathname: "/(auth)/verify-email", params: { email } });
    },
  });
}

export function useVerifyPasswordResetCode() {
  const router = useRouter();

  return useMutation<void, AppError, { email: string; token: string }>({
    mutationFn: verifyPasswordResetCodeFn,
    onSuccess: () => {
      router.push("/(auth)/new-password");
    },
  });
}

export function useUpdatePassword() {
  const router = useRouter();

  return useMutation<void, AppError, { password: string }>({
    mutationFn: updatePasswordFn,
    onSuccess: () => {
      router.replace("/(auth)/success");
    },
  });
}
