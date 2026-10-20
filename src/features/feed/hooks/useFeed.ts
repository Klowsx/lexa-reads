import { useInfiniteQuery } from '@tanstack/react-query'
import { feedInfiniteOptions } from '../feed.queries'
import { useAuthStore } from '~/stores/auth.store'

export function useFeed() {
  const userId = useAuthStore((s) => s.user?.id ?? '')
  return useInfiniteQuery(feedInfiniteOptions(userId))
}
