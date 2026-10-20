import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import { createClubFn, type ClubVisibility } from '../clubs.queries'

export function useCreateClub() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: (params: {
      name: string
      description?: string
      visibility: ClubVisibility
    }) => {
      if (!userId) throw new Error('Not authenticated')
      return createClubFn({ userId, ...params })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] })
    }
  })
}
