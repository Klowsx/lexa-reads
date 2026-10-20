import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addBookToListFn, userListsQueryOptions } from '../list.queries'

// Refresca detalle, portadas, contadores y pertenencia tras una incorporación.
export function useAddBookToList() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ listId, bookId }: { listId: string; bookId: string }) =>
      addBookToListFn(listId, bookId),
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: userListsQueryOptions('').queryKey.slice(0, 1)
      })
  })
}
