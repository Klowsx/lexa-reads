import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import {
  readingGoalQueryOptions,
  updateReadingGoalFn,
  type ReadingGoalData
} from '../user.queries'

export function useUpdateReadingGoal() {
  const userId = useAuthStore((s) => s.user?.id ?? '')
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (goal: number) => updateReadingGoalFn(userId, goal),
    onMutate: async (goal) => {
      const key = readingGoalQueryOptions(userId).queryKey
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<ReadingGoalData>(key)
      if (previous) {
        qc.setQueryData<ReadingGoalData>(key, {
          ...previous,
          goal,
          goalYear: new Date().getFullYear()
        })
      }
      return { previous }
    },
    onError: (_err, _goal, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(readingGoalQueryOptions(userId).queryKey, ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({
        queryKey: readingGoalQueryOptions(userId).queryKey
      })
    }
  })
}
