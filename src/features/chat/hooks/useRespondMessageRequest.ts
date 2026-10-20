import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import { acceptMessageRequestFn, rejectConversationFn } from '../chat.queries'

// Aceptar o rechazar una solicitud de mensaje (acción del receptor).
export function useRespondMessageRequest() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: ({
      conversationId,
      accept
    }: {
      conversationId: string
      accept: boolean
    }) =>
      accept
        ? acceptMessageRequestFn(conversationId)
        : rejectConversationFn(conversationId),
    onSettled: () => {
      if (userId)
        queryClient.invalidateQueries({ queryKey: ['dm-inbox', userId] })
    }
  })
}
