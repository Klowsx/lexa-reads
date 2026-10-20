import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import type { NotificationPreferences } from '../user.queries'
import {
  notificationPreferencesQueryOptions,
  upsertNotificationPreferencesFn
} from '../user.queries'

export function useNotificationPreferences() {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery(notificationPreferencesQueryOptions(userId ?? ''))
}

export function useUpsertNotificationPreferences() {
  const userId = useAuthStore((s) => s.user?.id)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      data: Partial<Omit<NotificationPreferences, 'user_id' | 'updated_at'>> & {
        markConsent?: boolean
      }
    ) => {
      if (!userId) throw new Error('Not authenticated')
      return upsertNotificationPreferencesFn(userId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notification_preferences', userId]
      })
    }
  })
}
