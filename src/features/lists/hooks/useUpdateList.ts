import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateListFn, userListsQueryOptions } from '../list.queries'

// Mantiene sincronizados el formulario, el detalle y las vistas del perfil.
export function useUpdateList(_slug: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: updateListFn,
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: userListsQueryOptions('').queryKey.slice(0, 1)
      })
  })
}
