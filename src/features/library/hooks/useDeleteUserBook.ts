import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth.store";
import { deleteUserBookFn, userBookQueryOptions } from "../library.queries";

export function useDeleteUserBook(bookId: string) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? "");
  const qKey = userBookQueryOptions(userId, bookId).queryKey;

  return useMutation({
    mutationFn: () => deleteUserBookFn(userId, bookId),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: qKey });
      const snapshot = queryClient.getQueryData(qKey);
      queryClient.setQueryData(qKey, null);
      return { snapshot };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot !== undefined) {
        queryClient.setQueryData(qKey, ctx.snapshot);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qKey });
    },
  });
}
