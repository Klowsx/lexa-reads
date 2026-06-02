import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth.store";
import { acceptFollowFn, rejectFollowFn, type PendingRequest } from "../user.queries";

export function useRespondToFollow() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  const invalidate = () => {
    if (!userId) return;
    queryClient.invalidateQueries({ queryKey: ["follow_requests", userId] });
    queryClient.invalidateQueries({ queryKey: ["me", userId] });
  };

  const accept = useMutation({
    mutationFn: (followId: string) => acceptFollowFn(followId),
    onMutate: async (followId) => {
      if (!userId) return;
      await queryClient.cancelQueries({ queryKey: ["follow_requests", userId] });
      const prev = queryClient.getQueryData<PendingRequest[]>(["follow_requests", userId]);
      queryClient.setQueryData<PendingRequest[]>(
        ["follow_requests", userId],
        (old) => (old ?? []).filter((r) => r.follow_id !== followId),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev && userId) {
        queryClient.setQueryData(["follow_requests", userId], ctx.prev);
      }
    },
    onSettled: invalidate,
  });

  const reject = useMutation({
    mutationFn: (followId: string) => rejectFollowFn(followId),
    onMutate: async (followId) => {
      if (!userId) return;
      await queryClient.cancelQueries({ queryKey: ["follow_requests", userId] });
      const prev = queryClient.getQueryData<PendingRequest[]>(["follow_requests", userId]);
      queryClient.setQueryData<PendingRequest[]>(
        ["follow_requests", userId],
        (old) => (old ?? []).filter((r) => r.follow_id !== followId),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev && userId) {
        queryClient.setQueryData(["follow_requests", userId], ctx.prev);
      }
    },
    onSettled: invalidate,
  });

  return { accept, reject };
}
