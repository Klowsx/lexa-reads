import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/stores/auth.store";
import { AppError, toAppError } from "@/src/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

export function useLogout() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const queryClient = useQueryClient();

  return useMutation<void, AppError, void>({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw toAppError(error);
    },
    onSuccess: () => {
      queryClient.clear();
      setSession(null);
      router.replace("/(auth)");
    },
  });
}
