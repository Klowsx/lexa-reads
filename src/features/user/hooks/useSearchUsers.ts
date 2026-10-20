import { useQuery } from '@tanstack/react-query'
import { searchUsersQueryOptions } from '../user.queries'

export function useSearchUsers(q: string) {
  return useQuery(searchUsersQueryOptions(q))
}
