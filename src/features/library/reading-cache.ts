import type { QueryClient } from '@tanstack/react-query'
import { bookCommunityStatsQueryOptions } from '~/features/book/book.queries'
import { feedInfiniteOptions } from '~/features/feed/feed.queries'
import {
  myReviewsInfiniteOptions,
  userReviewsInfiniteOptions
} from '~/features/reviews/reviews.queries'
import {
  meQueryOptions,
  profileQueryOptions,
  readingGoalQueryOptions,
  userRecentReadsQueryOptions
} from '~/features/user/user.queries'
import { libraryQueryOptions, userBookQueryOptions } from './library.queries'

// Refresca todas las vistas que muestran estados, puntuaciones, contadores o metas del lector.
export async function refreshReadingQueries(
  client: QueryClient,
  userId: string,
  bookId: string
) {
  const keys = [
    userBookQueryOptions(userId, bookId).queryKey,
    libraryQueryOptions(userId, 'reading').queryKey.slice(0, 2),
    readingGoalQueryOptions(userId).queryKey.slice(0, 2),
    meQueryOptions(userId).queryKey,
    profileQueryOptions('').queryKey.slice(0, 1),
    userRecentReadsQueryOptions(userId).queryKey,
    bookCommunityStatsQueryOptions(bookId, userId).queryKey.slice(0, 2),
    feedInfiniteOptions(userId).queryKey,
    myReviewsInfiniteOptions(userId).queryKey,
    userReviewsInfiniteOptions(userId).queryKey
  ]
  await Promise.all(
    keys.map((queryKey) => client.invalidateQueries({ queryKey }))
  )
}
