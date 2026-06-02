import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth.store";
import { deleteMyReviewFn, myReviewsInfiniteOptions } from "../reviews.queries";

export function useDeleteMyReview() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? "");
  const queryKey = myReviewsInfiniteOptions(userId).queryKey;

  return useMutation({
    mutationFn: (reviewId: string) => deleteMyReviewFn(userId, reviewId),

    onMutate: async (reviewId) => {
      await queryClient.cancelQueries({ queryKey });
      const snapshot = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            rows: page.rows.filter((r: any) => r.id !== reviewId),
          })),
        };
      });

      return { snapshot };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot !== undefined) {
        queryClient.setQueryData(queryKey, ctx.snapshot);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
