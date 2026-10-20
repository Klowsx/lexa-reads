import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import { blockedUsersQueryOptions } from '../user.queries'

export function useBlockedUsers() {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery(blockedUsersQueryOptions(userId ?? ''))
}
