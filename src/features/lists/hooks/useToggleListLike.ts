import { useAuthStore } from '~/stores/auth.store'
import { useOptimisticLike } from '~/lib/useOptimisticLike'
import { toggleListLikeFn } from '../list.queries'

export function useToggleListLike(
  listId: string,
  initialLiked: boolean,
  initialCount: number
) {
  const userId = useAuthStore((s) => s.user?.id)

  return useOptimisticLike(initialLiked, initialCount, (currentlyLiked) => {
    if (!userId) throw new Error('Not authenticated')
    return toggleListLikeFn(listId, userId, currentlyLiked)
  })
}
