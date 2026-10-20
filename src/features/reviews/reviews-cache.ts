import type { QueryClient } from '@tanstack/react-query'
import {
  bookReviewsInfiniteOptions,
  myReviewQueryOptions
} from '~/features/book/book.queries'
import {
  commentContextQueryOptions,
  feedInfiniteOptions
} from '~/features/feed/feed.queries'
import {
  meQueryOptions,
  profileQueryOptions
} from '~/features/user/user.queries'
import {
  myReviewsInfiniteOptions,
  userReviewsInfiniteOptions,
  reviewCountByUserQueryOptions
} from './reviews.queries'

// Sincroniza publicaciones, spoilers y contadores en todas las representaciones de una reseña.
export async function refreshReviewQueries(
  client: QueryClient,
  userId: string,
  bookId?: string
) {
  const keys = [
    bookReviewsInfiniteOptions(bookId ?? '').queryKey.slice(0, bookId ? 2 : 1),
    myReviewQueryOptions(userId, bookId ?? '').queryKey.slice(
      0,
      bookId ? 3 : 2
    ),
    myReviewsInfiniteOptions(userId).queryKey,
    userReviewsInfiniteOptions('').queryKey.slice(0, 1),
    reviewCountByUserQueryOptions(userId).queryKey,
    meQueryOptions(userId).queryKey,
    profileQueryOptions('').queryKey.slice(0, 1),
    feedInfiniteOptions(userId).queryKey,
    commentContextQueryOptions('review', '').queryKey.slice(0, 1)
  ]
  await Promise.all(
    keys.map((queryKey) => client.invalidateQueries({ queryKey }))
  )
}
