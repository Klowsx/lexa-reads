import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import { readingGoalQueryOptions } from '../user.queries'

export function useReadingGoal() {
  const userId = useAuthStore((s) => s.user?.id ?? '')
  return useQuery(readingGoalQueryOptions(userId))
}
