import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '~/lib/supabase'
import { useAuthStore } from '~/stores/auth.store'

// Suscripción Realtime (Postgres Changes) a los mensajes de la conversación.
// Al llegar un cambio, invalida la query → reconcilia (correctness-first; a
// escala se migra a Broadcast, ver docs/clubs-y-chat.md §3).
// Requiere `messages` en la publicación supabase_realtime (migración 020).
export function useRealtimeMessages(conversationId: string) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    if (!conversationId) return
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['messages', conversationId]
          })
          if (userId)
            queryClient.invalidateQueries({ queryKey: ['dm-inbox', userId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, userId])
}
