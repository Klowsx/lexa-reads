import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createListFn, userListsQueryOptions } from '../list.queries'
import { useAuthStore } from '~/stores/auth.store'

// Añade la lista creada a las consultas del propietario, manteniendo el error en el formulario.
export function useCreateList() {
  const userId = useAuthStore((s) => s.user?.id ?? '')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      name: string
      description?: string
      visibility: 'public' | 'private'
      accentColor: string
    }) => createListFn({ userId, ...params }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userListsQueryOptions(userId).queryKey
      })
    }
  })
}
