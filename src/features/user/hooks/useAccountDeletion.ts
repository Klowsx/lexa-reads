import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import { useUIStore } from '~/stores/ui.store'
import {
  accountDeletionQueryOptions,
  cancelAccountDeletionFn
} from '../user.queries'
import { supabase } from '~/lib/supabase'

export function useAccountDeletion() {
  const userId = useAuthStore((s) => s.user?.id)
  const setSession = useAuthStore((s) => s.setSession)
  const queryClient = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)

  const { data: request, isLoading } = useQuery(
    accountDeletionQueryOptions(userId ?? '')
  )

  const requestDeletion = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('delete-account')
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.clear()
      setSession(null)
    },
    onError: () => {
      addToast(
        'No se pudo solicitar la eliminación. Intenta de nuevo.',
        'error'
      )
    }
  })

  const cancelDeletion = useMutation({
    mutationFn: (requestId: string) => cancelAccountDeletionFn(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account_deletion', userId] })
      addToast('Eliminación cancelada.', 'success')
    },
    onError: () => {
      addToast('No se pudo cancelar. Intenta de nuevo.', 'error')
    }
  })

  return { request, isLoading, requestDeletion, cancelDeletion }
}
