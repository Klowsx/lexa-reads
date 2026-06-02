import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth.store";
import { createCommentFn, type CommentTargetType } from "../feed.queries";

export function useCreateComment(targetType: CommentTargetType, targetId: string) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: (body: string) => {
      if (!userId) throw new Error("Not authenticated");
      return createCommentFn({ userId, targetType, targetId, body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", targetType, targetId] });
    },
  });
}
