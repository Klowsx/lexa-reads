import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import { myReviewQueryOptions } from '../book.queries'

// Trae la reseña del usuario autenticado para un libro específico.
// El resultado es null si el usuario todavía no ha escrito reseña
// (o si la borró), lo que permite al componente mostrar "Crear" vs "Editar".
export function useMyReview(bookId: string) {
  const userId = useAuthStore((s) => s.user?.id ?? '')
  return useQuery(myReviewQueryOptions(userId, bookId))
}
