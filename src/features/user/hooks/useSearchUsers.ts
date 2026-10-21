import { useQuery } from '@tanstack/react-query'
import { searchUsersQueryOptions } from '../user.queries'

// Evita consultar sugerencias fuera de las pantallas que realmente las muestran.
export function useSearchUsers(q: string, enabled = true) {
  return useQuery(searchUsersQueryOptions(q, enabled))
}
