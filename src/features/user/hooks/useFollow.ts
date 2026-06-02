import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth.store";
import type { ProfileData } from "~/types/user";
import { followFn, unfollowFn } from "../user.queries";

export function useFollow(
  targetUserId: string,
  targetUsername: string,
  isTargetPrivate: boolean = false,
) {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const profileKey = ["profile", targetUsername, currentUserId];

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["profile", targetUsername] });

  const follow = useMutation({
    mutationFn: () => {
      if (!currentUserId) throw new Error("Not authenticated");
      return followFn(currentUserId, targetUserId, isTargetPrivate);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: profileKey });
      const prev = queryClient.getQueryData<ProfileData>(profileKey);
      queryClient.setQueryData<ProfileData>(profileKey, (old) => {
        if (!old) return old;
        const newStatus = isTargetPrivate ? "pending" : "accepted";
        return {
          ...old,
          follow_status: newStatus,
          is_following: newStatus === "accepted",
          followers_count: isTargetPrivate
            ? old.followers_count
            : (old.followers_count ?? 0) + 1,
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(profileKey, ctx.prev);
    },
    onSettled: invalidate,
  });

  const unfollow = useMutation({
    mutationFn: () => {
      if (!currentUserId) throw new Error("Not authenticated");
      return unfollowFn(currentUserId, targetUserId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: profileKey });
      const prev = queryClient.getQueryData<ProfileData>(profileKey);
      queryClient.setQueryData<ProfileData>(profileKey, (old) => {
        if (!old) return old;
        const wasAccepted = old.follow_status === "accepted";
        return {
          ...old,
          follow_status: null,
          is_following: false,
          followers_count: wasAccepted
            ? Math.max(0, (old.followers_count ?? 1) - 1)
            : old.followers_count,
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(profileKey, ctx.prev);
    },
    onSettled: invalidate,
  });

  return { follow, unfollow };
}
