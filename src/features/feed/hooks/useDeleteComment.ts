import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCommentFn, type CommentTargetType } from "../feed.queries";

export function useDeleteComment(targetType: CommentTargetType, targetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteCommentFn(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", targetType, targetId] });
    },
  });
}
