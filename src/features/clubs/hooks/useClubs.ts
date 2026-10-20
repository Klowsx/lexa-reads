import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import {
  discoverClubsQueryOptions,
  myClubsQueryOptions
} from '../clubs.queries'

export function useDiscoverClubs() {
  return useQuery(discoverClubsQueryOptions())
}

export function useMyClubs() {
  const userId = useAuthStore((s) => s.user?.id) ?? ''
  return useQuery(myClubsQueryOptions(userId))
}
