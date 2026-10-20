import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import { type ReportTargetType, createReportFn } from '../user.queries'

export function useCreateReport() {
  const currentUserId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: (data: {
      targetType: ReportTargetType
      targetId: string
      reason: string
      details?: string
    }) => {
      if (!currentUserId) throw new Error('Not authenticated')
      return createReportFn({ reporterId: currentUserId, ...data })
    }
  })
}
