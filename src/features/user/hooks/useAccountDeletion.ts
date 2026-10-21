import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '~/stores/auth.store'
import { useUIStore } from '~/stores/ui.store'
import {
  accountDeletionQueryOptions,
  cancelAccountDeletionFn
} from '../user.queries'
import { supabase } from '~/lib/supabase'

// Coordina la solicitud y cancelación de eliminación con la caché y la sesión local.
export function useAccountDeletion() {
  const userId = useAuthStore((s) => s.user?.id)
  const setSession = useAuthStore((s) => s.setSession)
  const queryClient = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)
  const { t } = useTranslation()

  const { data: request, isLoading } = useQuery(
    accountDeletionQueryOptions(userId ?? '')
  )

  const requestDeletion = useMutation({
    // Solicita el borrado remoto y limpia los datos de la cuenta al aceptarse.
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('delete-account')
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.clear()
      setSession(null)
    },
    onError: () => {
      addToast(t('settings.deletionRequestError'), 'error')
    }
  })

  const cancelDeletion = useMutation({
    // Cancela solamente la solicitud activa identificada por el servidor.
    mutationFn: (requestId: string) => cancelAccountDeletionFn(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account_deletion', userId] })
      addToast(t('settings.deletionCancelled'), 'success')
    },
    onError: () => {
      addToast(t('settings.deletionCancelError'), 'error')
    }
  })

  return { request, isLoading, requestDeletion, cancelDeletion }
}
