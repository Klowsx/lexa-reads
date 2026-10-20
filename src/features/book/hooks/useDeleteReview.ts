import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import { deleteReviewFn, myReviewQueryOptions } from '../book.queries'
import { refreshReviewQueries } from '~/features/reviews/reviews-cache'

// Hace un soft-delete de la reseña del usuario.
// El servidor pone deleted_at; la DB y RLS se encargan del resto.
export function useDeleteReview(bookId: string) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id ?? '')

  const myReviewKey = myReviewQueryOptions(userId, bookId).queryKey

  return useMutation({
    mutationFn: (reviewId: string) => deleteReviewFn(userId, reviewId),

    onMutate: async () => {
      // Optimistic: borramos la reseña del caché de "mi reseña" inmediatamente.
      await queryClient.cancelQueries({ queryKey: myReviewKey })
      const snapshot = queryClient.getQueryData(myReviewKey)
      queryClient.setQueryData(myReviewKey, null)
      return { snapshot }
    },

    onError: (_err, _vars, ctx) => {
      // Si el servidor rechaza el borrado, restauramos el snapshot.
      if (ctx?.snapshot !== undefined) {
        queryClient.setQueryData(myReviewKey, ctx.snapshot)
      }
    },

    onSettled: () => refreshReviewQueries(queryClient, userId, bookId)
  })
}
