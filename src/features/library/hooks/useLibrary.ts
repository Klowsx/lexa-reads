import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import type { Database } from '~/types/database'
import {
  libraryInfiniteOptions,
  libraryQueryOptions,
  librarySummaryQueryOptions,
  type LibraryFilters
} from '../library.queries'

// Tipo corto para no repetir el path largo en los parámetros
type UserBookStatus = Database['public']['Enums']['user_book_status']

// Conserva la consulta simple que usa el perfil para sus secciones de lecturas.
export function useLibrary(status: UserBookStatus) {
  const userId = useAuthStore((s) => s.user?.id ?? '')
  return useQuery(libraryQueryOptions(userId, status))
}

// Pagina la biblioteca personal; cada combinación de filtros tiene su propio cursor y caché.
export function useLibraryPages(filters: LibraryFilters) {
  const userId = useAuthStore((s) => s.user?.id ?? '')
  return useInfiniteQuery(libraryInfiniteOptions(userId, filters))
}

// Comparte los totales y las etiquetas de todas las páginas de la biblioteca.
export function useLibrarySummary() {
  const userId = useAuthStore((s) => s.user?.id ?? '')
  return useQuery(librarySummaryQueryOptions(userId))
}
