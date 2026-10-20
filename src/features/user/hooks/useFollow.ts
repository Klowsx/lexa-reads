import {
  useIsMutating,
  useMutation,
  useQueryClient
} from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import type { ProfileData } from '~/types/user'
import { followFn, unfollowFn, profileQueryOptions } from '../user.queries'
import { refreshProfileAccess } from '../profile-cache'

// Comparte el bloqueo entre entradas y nunca concede acceso privado antes de la respuesta del servidor.
export function useFollow(targetUserId: string, targetUsername: string) {
  const client = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id ?? '')
  const key = profileQueryOptions(targetUsername, userId).queryKey
  const mutationKey = [...key, 'follow']
  const busy = useIsMutating({ mutationKey }) > 0
  // Actualiza la relación en caché sin convertir una solicitud optimista en acceso concedido.
  async function optimistic(status: 'pending' | null) {
    await client.cancelQueries({ queryKey: key })
    const previous = client.getQueryData<ProfileData | null>(key)
    client.setQueryData<ProfileData | null>(key, (old) =>
      old ? { ...old, follow_status: status, is_following: false } : old
    )
    return { previous }
  }
  // Restaura la relación si la escritura falla; el refresco posterior vuelve a comprobar permisos.
  function rollback(
    _error: unknown,
    _variables: void,
    context: { previous: ProfileData | null | undefined } | undefined
  ) {
    if (context?.previous) client.setQueryData(key, context.previous)
  }
  const shared = {
    mutationKey,
    scope: { id: `follow:${userId}:${targetUserId}` },
    onError: rollback,
    onSettled: () => refreshProfileAccess(client, userId)
  }
  const follow = useMutation({
    ...shared,
    mutationFn: () => followFn(userId, targetUserId),
    onMutate: () => optimistic('pending'),
    onSuccess: (status) =>
      client.setQueryData<ProfileData | null>(key, (old) =>
        old
          ? {
              ...old,
              follow_status: status,
              is_following: status === 'accepted'
            }
          : old
      )
  })
  const unfollow = useMutation({
    ...shared,
    mutationFn: () => unfollowFn(userId, targetUserId),
    onMutate: () => optimistic(null)
  })
  return { follow, unfollow, busy }
}
