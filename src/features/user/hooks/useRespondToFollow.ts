import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import {
  acceptFollowFn,
  rejectFollowFn,
  pendingRequestsQueryOptions
} from '../user.queries'
import { refreshProfileAccess } from '../profile-cache'

// Conserva cada solicitud visible mientras se guarda y muestra el error en su misma fila.
export function useRespondToFollow() {
  const client = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id ?? '')
  const shared = {
    mutationKey: [...pendingRequestsQueryOptions(userId).queryKey, 'respond'],
    onSuccess: () => refreshProfileAccess(client, userId)
  }
  const accept = useMutation({ ...shared, mutationFn: acceptFollowFn })
  const reject = useMutation({ ...shared, mutationFn: rejectFollowFn })
  return { accept, reject }
}
