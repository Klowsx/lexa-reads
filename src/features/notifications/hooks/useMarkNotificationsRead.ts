import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import { markAllNotificationsReadFn } from '../notifications.queries'

export function useMarkNotificationsRead() {
  const userId = useAuthStore((s) => s.user?.id) ?? ''
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('Not authenticated')
      return markAllNotificationsReadFn(userId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
      queryClient.setQueryData(['notifications-unread', userId], 0)
    }
  })
}
