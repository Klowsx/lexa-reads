import { useAuthStore } from '~/stores/auth.store'
import { useOptimisticLike } from '~/lib/useOptimisticLike'
import { toggleReviewLikeFn } from '../feed.queries'

export function useToggleReviewLike(
  reviewId: string | undefined,
  initialLiked: boolean,
  initialCount: number
) {
  const userId = useAuthStore((s) => s.user?.id)

  return useOptimisticLike(initialLiked, initialCount, (currentlyLiked) => {
    if (!userId || !reviewId) throw new Error('Not authenticated')
    return toggleReviewLikeFn(reviewId, userId, currentlyLiked)
  })
}
