import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import { clubQueryOptions } from '../clubs.queries'

export function useClub(slug: string) {
  const userId = useAuthStore((s) => s.user?.id) ?? ''
  return useQuery(clubQueryOptions(slug, userId))
}
