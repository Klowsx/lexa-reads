import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth.store";
import type { Tables } from "~/types";
import type { UpsertReviewParams } from "~/types";
import {
  myReviewQueryOptions,
  upsertReviewFn,
  bookReviewsInfiniteOptions,
} from "../book.queries";

// Crea o edita la reseña del usuario para un libro.
// Aplica un optimistic update sobre "my_review" para que la UI responda
// de inmediato, y luego invalida la lista paginada para refrescarla desde DB.
export function useUpsertReview(bookId: string) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? "");

  // Query key de "mi reseña" — la que actualizamos de forma optimista.
  const myReviewKey = myReviewQueryOptions(userId, bookId).queryKey;

  // Query key de la lista paginada — la invalidamos al confirmar el server.
  const reviewsKey = bookReviewsInfiniteOptions(bookId).queryKey;

  return useMutation({
    mutationFn: (params: UpsertReviewParams) =>
      upsertReviewFn(userId, params),

    onMutate: async (params) => {
      // Cancelamos cualquier refetch en vuelo para que no pise el optimismo.
      await queryClient.cancelQueries({ queryKey: myReviewKey });

      // Guardamos el estado anterior para poder revertir si hay error.
      const snapshot = queryClient.getQueryData<Tables<"reviews"> | null>(myReviewKey);

      // Aplicamos el cambio en caché de forma optimista.
      queryClient.setQueryData<Tables<"reviews"> | null>(
        myReviewKey,
        (prev) => ({
          // Rellenamos los campos mínimos para que el tipo sea válido en UI.
          ...(prev ?? {
            id: params.reviewId ?? "",
            user_id: userId,
            book_id: bookId,
            user_book_id: params.userBookId ?? null,
            likes_count: 0,
            comments_count: 0,
            is_published: true,
            created_at: new Date().toISOString(),
            edited_at: null,
            deleted_at: null,
          }),
          body: params.body,
          contains_spoilers: params.containsSpoilers,
          updated_at: new Date().toISOString(),
        }),
      );

      return { snapshot };
    },

    onError: (_err, _vars, ctx) => {
      // Si falla, restauramos el snapshot anterior.
      if (ctx?.snapshot !== undefined) {
        queryClient.setQueryData(myReviewKey, ctx.snapshot);
      }
    },

    onSettled: () => {
      // Confirmado o no, sincronizamos con el servidor.
      // Invalidamos "mi reseña" para tener el id real del INSERT.
      queryClient.invalidateQueries({ queryKey: myReviewKey });
      // Invalidamos la lista para que la nueva reseña aparezca en el feed de reseñas.
      queryClient.invalidateQueries({ queryKey: reviewsKey });
    },
  });
}
