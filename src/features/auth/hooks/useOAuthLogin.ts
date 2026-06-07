import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { oauthLoginFn } from "../oauth";

export function useOAuthLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: oauthLoginFn,
    onSuccess: (session) => {
      if (session) {
        router.replace("/(tabs)/feed");
      }
    },
  });
}
