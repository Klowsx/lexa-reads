import { useInfiniteQuery } from '@tanstack/react-query'
import { followersInfiniteOptions } from '../user.queries'

export function useFollowers(userId: string) {
  return useInfiniteQuery(followersInfiniteOptions(userId))
}
