import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import type { UpdateProfileData, UserProfile } from '~/types/user'
import {
  updateProfileFn,
  meQueryOptions,
  profileQueryOptions
} from '../user.queries'
import { refreshProfileAccess } from '../profile-cache'

// Guarda identidad y privacidad, revierte errores y refresca el acceso cuando cambia la cuenta privada.
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const meKey = meQueryOptions(user?.id ?? '').queryKey

  return useMutation({
    mutationFn: (data: UpdateProfileData) => {
      if (!user) throw new Error('Not authenticated')
      return updateProfileFn(user.id, data)
    },
    onMutate: async (data) => {
      if (!user) return
      await queryClient.cancelQueries({ queryKey: meKey })
      const prev = queryClient.getQueryData<UserProfile>(meKey)
      queryClient.setQueryData<UserProfile>(meKey, (old) =>
        old ? { ...old, ...data } : old
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (!user || !ctx?.prev) return
      queryClient.setQueryData(meKey, ctx.prev)
    },
    onSettled: (_data, _error, changes) => {
      if (!user) return
      if (changes.is_private !== undefined)
        return refreshProfileAccess(queryClient, user.id)
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: meQueryOptions(user.id).queryKey
        }),
        queryClient.invalidateQueries({
          queryKey: profileQueryOptions('').queryKey.slice(0, 1)
        })
      ])
    }
  })
}
