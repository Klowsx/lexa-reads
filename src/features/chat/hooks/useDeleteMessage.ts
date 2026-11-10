import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteMessageFn, messagesInfiniteOptions } from '../chat.queries'

// Mantiene el borrado dentro de TanStack Query para mostrar progreso, error y reintento.
export function useDeleteMessage(conversationId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: deleteMessageFn,
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: messagesInfiniteOptions(conversationId).queryKey
      })
  })
}
