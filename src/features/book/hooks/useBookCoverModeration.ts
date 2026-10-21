import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import { bookModeratorQueryOptions, replaceBookCover } from '../catalog.queries'

// Expone el permiso y la corrección de portada con invalidación de la ficha.
export function useBookCoverModeration(bookId: string) {
  const userId = useAuthStore((state) => state.user?.id ?? '')
  const client = useQueryClient()
  const moderator = useQuery(bookModeratorQueryOptions(userId))
  const replace = useMutation({
    mutationFn: (base64: string) => replaceBookCover(bookId, base64, userId),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['book'] })
    }
  })
  return { canModerate: moderator.data === true, replace }
}
