import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth.store";
import type { Tables, UpsertUserBookParams } from "~/types";
import { upsertUserBookFn, userBookQueryOptions } from "../library.queries";

export function useUpsertUserBook(bookId: string) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? "");
  const qKey = userBookQueryOptions(userId, bookId).queryKey;

  return useMutation({
    mutationFn: (params: UpsertUserBookParams) =>
      upsertUserBookFn(userId, params),

    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: qKey });
      const snapshot = queryClient.getQueryData(qKey);

      queryClient.setQueryData<Tables<"user_books"> | null>(
        qKey,
        (prev) =>
          ({
            ...(prev ?? {
              id: "",
              created_at: null,
              user_id: userId,
              book_id: bookId,
              current_page: null,
              goodreads_id: null,
              is_reread: null,
              reread_count: null,
            }),
            status: params.status,
            rating: params.rating ?? prev?.rating ?? null,
            started_at: params.started_at ?? prev?.started_at ?? null,
            finished_at: params.finished_at ?? prev?.finished_at ?? null,
            tags: params.tags ?? prev?.tags ?? null,
            updated_at: new Date().toISOString(),
          }) as Tables<"user_books">,
      );

      return { snapshot };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot !== undefined) {
        queryClient.setQueryData(qKey, ctx.snapshot);
      }
    },

    onSettled: () => {
      // Refresca la fila específica de user_books
      queryClient.invalidateQueries({ queryKey: qKey });
      // Refresca lista y contadores de biblioteca (prefijo compartido)
      queryClient.invalidateQueries({ queryKey: ["library", userId] });
    },
  });
}
