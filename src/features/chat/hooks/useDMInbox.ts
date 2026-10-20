import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import { dmInboxQueryOptions } from '../chat.queries'

export function useDMInbox() {
  const userId = useAuthStore((s) => s.user?.id) ?? ''
  return useQuery(dmInboxQueryOptions(userId))
}
