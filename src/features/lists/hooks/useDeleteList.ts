import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteListFn, userListsQueryOptions } from '../list.queries'

// Descarta los detalles eliminados y actualiza las listas visibles del perfil.
export function useDeleteList() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: deleteListFn,
    onSuccess: () =>
      client.resetQueries({
        queryKey: userListsQueryOptions('').queryKey.slice(0, 1)
      })
  })
}
