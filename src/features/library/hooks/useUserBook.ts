import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import { userBookQueryOptions } from '../library.queries'

export function useUserBook(bookId: string) {
  const userId = useAuthStore((s) => s.user?.id ?? '')
  return useQuery(userBookQueryOptions(userId, bookId))
}
