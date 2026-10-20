import type { QueryClient } from '@tanstack/react-query'
import {
  meQueryOptions,
  profileQueryOptions,
  followersInfiniteOptions,
  followingInfiniteOptions,
  pendingRequestsQueryOptions,
  userRecentReadsQueryOptions
} from './user.queries'
import { userListsQueryOptions } from '~/features/lists/list.queries'
import {
  feedInfiniteOptions,
  commentsInfiniteOptions,
  commentContextQueryOptions
} from '~/features/feed/feed.queries'
import { userReviewsInfiniteOptions } from '~/features/reviews/reviews.queries'
import {
  bookReviewsInfiniteOptions,
  bookCommunityStatsQueryOptions
} from '~/features/book/book.queries'

// Retira contenido protegido antes de refrescar relaciones para no reutilizar datos tras perder acceso.
export async function refreshProfileAccess(
  client: QueryClient,
  userId: string
) {
  const protectedKeys = [
    userRecentReadsQueryOptions('').queryKey.slice(0, 1),
    userListsQueryOptions('').queryKey.slice(0, 1),
    userReviewsInfiniteOptions('').queryKey.slice(0, 1),
    feedInfiniteOptions(userId).queryKey,
    commentsInfiniteOptions('review', '').queryKey.slice(0, 1),
    commentContextQueryOptions('review', '').queryKey.slice(0, 1),
    bookReviewsInfiniteOptions('').queryKey.slice(0, 1),
    bookCommunityStatsQueryOptions('', userId).queryKey.slice(0, 1)
  ]
  for (const key of protectedKeys) {
    await client.cancelQueries({ queryKey: key })
    void client.resetQueries({ queryKey: key })
  }
  const keys = [
    meQueryOptions(userId).queryKey,
    profileQueryOptions('').queryKey.slice(0, 1),
    followersInfiniteOptions('').queryKey.slice(0, 1),
    followingInfiniteOptions('').queryKey.slice(0, 1),
    pendingRequestsQueryOptions(userId).queryKey
  ]
  await Promise.all(
    keys.map((queryKey) => client.invalidateQueries({ queryKey }))
  )
}
