import { useInfiniteQuery } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import { myReviewsInfiniteOptions } from '../reviews.queries'

export function useMyReviews() {
  const userId = useAuthStore((s) => s.user?.id ?? '')
  const query = useInfiniteQuery(myReviewsInfiniteOptions(userId))

  const reviews = query.data?.pages.flatMap((p) => p.rows) ?? []

  return { ...query, reviews }
}
