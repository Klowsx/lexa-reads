import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import {
  commentsInfiniteOptions,
  createCommentFn,
  type CommentTargetType
} from '../feed.queries'
import { refreshReviewQueries } from '~/features/reviews/reviews-cache'

// Publica una sola vez por envío y refresca el hilo y los contadores visibles.
export function useCreateComment(
  targetType: CommentTargetType,
  targetId: string
) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: (values: { body: string; containsSpoilers: boolean }) => {
      if (!userId) throw new Error('Not authenticated')
      return createCommentFn({ userId, targetType, targetId, ...values })
    },
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
