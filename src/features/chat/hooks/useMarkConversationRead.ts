import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import { markConversationReadFn } from '../chat.queries'

// Marca la conversación como leída al abrirla (y vuelve a marcar cuando cambia
// la cuenta de mensajes cargados, p. ej. al llegar uno nuevo estando dentro).
export function useMarkConversationRead(
  conversationId: string,
  messageCount: number
) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    if (!conversationId || !userId) return
    markConversationReadFn(conversationId, userId)
      .then(() =>
        queryClient.invalidateQueries({ queryKey: ['dm-inbox', userId] })
      )
      .catch(() => {})
  }, [conversationId, userId, messageCount])
}
