import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth.store";
import type { ProfileData } from "~/types/user";
import { blockUserFn, unblockUserFn } from "../user.queries";

export function useBlockUser(targetUserId: string, targetUsername: string) {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const profileKey = ["profile", targetUsername, currentUserId];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: profileKey });
    queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
  };

  const block = useMutation({
    mutationFn: () => {
      if (!currentUserId) throw new Error("Not authenticated");
      return blockUserFn(currentUserId, targetUserId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: profileKey });
      const prev = queryClient.getQueryData<ProfileData>(profileKey);
      queryClient.setQueryData<ProfileData>(profileKey, (old) =>
        old ? { ...old, is_blocked_by_me: true } : old,
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(profileKey, ctx.prev);
    },
    onSettled: invalidate,
  });

  const unblock = useMutation({
    mutationFn: () => {
      if (!currentUserId) throw new Error("Not authenticated");
      return unblockUserFn(currentUserId, targetUserId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: profileKey });
      const prev = queryClient.getQueryData<ProfileData>(profileKey);
      queryClient.setQueryData<ProfileData>(profileKey, (old) =>
        old ? { ...old, is_blocked_by_me: false } : old,
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(profileKey, ctx.prev);
    },
    onSettled: invalidate,
  });

  return { block, unblock };
}
