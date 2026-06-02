import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth.store";
import type { UpdateProfileData, UserProfile } from "~/types/user";
import { updateProfileFn } from "../user.queries";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (data: UpdateProfileData) => {
      if (!user) throw new Error("Not authenticated");
      return updateProfileFn(user.id, data);
    },
    onMutate: async (data) => {
      if (!user) return;
      await queryClient.cancelQueries({ queryKey: ["me", user.id] });
      const prev = queryClient.getQueryData<UserProfile>(["me", user.id]);
      queryClient.setQueryData<UserProfile>(["me", user.id], (old) =>
        old ? { ...old, ...data } : old,
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (!user || !ctx?.prev) return;
      queryClient.setQueryData(["me", user.id], ctx.prev);
    },
    onSettled: () => {
      if (!user) return;
      queryClient.invalidateQueries({ queryKey: ["me", user.id] });
    },
  });
}
