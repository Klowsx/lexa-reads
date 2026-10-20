import { useInfiniteQuery } from '@tanstack/react-query'
import { followingInfiniteOptions } from '../user.queries'

export function useFollowing(userId: string) {
  return useInfiniteQuery(followingInfiniteOptions(userId))
}
