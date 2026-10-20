import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  commentsInfiniteOptions,
  deleteCommentFn,
  type CommentTargetType
} from '../feed.queries'
import { useAuthStore } from '~/stores/auth.store'
import { refreshReviewQueries } from '~/features/reviews/reviews-cache'

// Invalida el hilo y sus contadores después de retirar un comentario propio.
export function useDeleteComment(
  targetType: CommentTargetType,
  targetId: string
) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id ?? '')

  return useMutation({
    mutationFn: (commentId: string) => deleteCommentFn(commentId),
    onSuccess: () => {
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: commentsInfiniteOptions(targetType, targetId).queryKey
        }),
        refreshReviewQueries(queryClient, userId ?? '')
      ])
    }
  })
}
