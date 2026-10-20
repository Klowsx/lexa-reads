import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import { getOrCreateDMFn } from '../chat.queries'

// Abre (o crea) el DM con otro usuario y devuelve el conversationId.
export function useStartDM() {
  const userId = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: (otherId: string) => {
      if (!userId) throw new Error('Not authenticated')
      if (otherId === userId) throw new Error('No puedes escribirte a ti mismo')
      return getOrCreateDMFn(userId, otherId)
    }
  })
}
