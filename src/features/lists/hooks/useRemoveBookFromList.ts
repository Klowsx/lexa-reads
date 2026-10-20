import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removeBookFromListFn, userListsQueryOptions } from '../list.queries'

// Actualiza todos los consumidores sin borrar la biblioteca personal del lector.
export function useRemoveBookFromList(_slug = '') {
  const client = useQueryClient()
  return useMutation({
    mutationFn: removeBookFromListFn,
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: userListsQueryOptions('').queryKey.slice(0, 1)
      })
  })
}
