import {
  useMutation,
  useQueryClient,
  type InfiniteData
} from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import {
  sendMessageFn,
  messagesInfiniteOptions,
  type ChatCursor,
  type ChatMessage
} from '../chat.queries'

type Page = { items: ChatMessage[]; nextCursor: ChatCursor | null }

export type ReplyTarget = { id: string; body: string; sender_id: string } | null

// Optimistic send: añade un mensaje temporal al frente de la 1ª página (orden
// desc) → revierte en error → reconcilia en settle. El realtime trae el resto.
export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  const queryKey = messagesInfiniteOptions(conversationId).queryKey

  return useMutation({
    mutationFn: (params: { body: string; replyTo?: ReplyTarget }) => {
      if (!userId) throw new Error('Not authenticated')
      return sendMessageFn({
        conversationId,
        senderId: userId,
        body: params.body,
        replyToId: params.replyTo?.id ?? null
      })
    },
    onMutate: async ({ body, replyTo }) => {
      if (!userId) return
      await queryClient.cancelQueries({ queryKey })

      const temp: ChatMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: userId,
        body,
        reply_to_id: replyTo?.id ?? null,
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
        sender: null,
        reply_to: replyTo ?? null
      }

      queryClient.setQueryData<InfiniteData<Page>>(queryKey, (old) => {
        if (!old) {
          return {
            pages: [{ items: [temp], nextCursor: null }],
            pageParams: [undefined]
          }
        }
        const [first, ...rest] = old.pages
        return {
          ...old,
          pages: [{ ...first, items: [temp, ...first.items] }, ...rest]
        }
      })

      return { temporaryId: temp.id }
    },
    onError: (_err, _vars, ctx) => {
      // Retira únicamente el mensaje temporal fallido, incluso si el hilo aún no tenía caché.
      // Así no se pierden mensajes reales que hayan llegado por Realtime durante el envío.
      if (!ctx) return
      queryClient.setQueryData<InfiniteData<Page>>(queryKey, (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.filter(
                  (message) => message.id !== ctx.temporaryId
                )
              }))
            }
          : old
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
      if (userId)
        queryClient.invalidateQueries({ queryKey: ['dm-inbox', userId] })
    }
  })
}
