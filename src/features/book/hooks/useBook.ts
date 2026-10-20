import { useQuery } from '@tanstack/react-query'
import { bookQueryOptions } from '../book.queries'

export function useBook(googleBooksId: string) {
  return useQuery(bookQueryOptions(googleBooksId))
}
