import type { Tables, UpsertUserBookParams } from '~/types'
import type { Database } from '~/types/database'
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { supabase } from '~/lib/supabase'
import { localReadingDate } from './reading-record'

type UserBookStatus = Database['public']['Enums']['user_book_status']

// Recupera únicamente el registro de lectura de la cuenta activa.
async function fetchUserBook(userId: string, bookId: string) {
  const { data, error } = await supabase
    .from('user_books')
    .select('*')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .maybeSingle()

  if (error) throw error
  return data
}

export const userBookQueryOptions = (userId: string, bookId: string) =>
  queryOptions({
    queryKey: ['user_books', userId, bookId],
    queryFn: () => fetchUserBook(userId, bookId),
    enabled: !!userId && !!bookId
  })

// Envía solo las propiedades editadas a la RPC atómica para conservar los demás datos.
export async function upsertUserBookFn(
  userId: string,
  params: UpsertUserBookParams
): Promise<Tables<'user_books'>> {
  const { bookId, ...fields } = params
  if (!userId) throw new Error('Se requiere una sesión')
  const { data, error } = await supabase.rpc('save_reading_record', {
    p_book_id: bookId,
    p_changes: fields,
    p_today: localReadingDate()
  })
  if (error) throw error
  return data
}

export async function deleteUserBookFn(
  userId: string,
  bookId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_books')
    .delete()
    .eq('user_id', userId)
    .eq('book_id', bookId)
  if (error) throw error
}

// ── Biblioteca ────────────────────────────────────────────────

export type LibraryRow = Tables<'user_books'> & {
  books: Tables<'books'> | null
}

// Trae los libros del usuario filtrados por estado.
async function fetchLibrary(
  userId: string,
  status: UserBookStatus
): Promise<LibraryRow[]> {
  const { data, error } = await supabase
    .from('user_books')
    .select('*, books(*)') // user_books + datos del libro en un solo round trip
    .eq('user_id', userId) // solo los libros de este usuario
    .eq('status', status) // solo el estado que pide el tab activo
    .order('updated_at', { ascending: false }) // más reciente arriba

  if (error) throw error
  return (data ?? []) as LibraryRow[]
}

// La query key incluye userId y status para que cada tab (Leyendo,
// Leído, etc.) tenga su propia entrada en el cache y no se pisen.
// Prefijo ["library", userId] compartido con librarySummaryQueryOptions
// para que un invalidateQueries({ queryKey: ["library", userId] })
// refresque tanto la lista como los contadores a la vez.
export const libraryQueryOptions = (userId: string, status: UserBookStatus) =>
  queryOptions({
    queryKey: ['library', userId, status],
    queryFn: () => fetchLibrary(userId, status),
    enabled: !!userId
  })

export interface LibraryFilters {
  status: UserBookStatus
  search: string
  rating: 'all' | 'rated' | 'unrated'
  tag: string | null
}

type LibraryCursor = { createdAt: string; id: string } | null
const LIBRARY_PAGE_SIZE = 24

// Consulta una página ya filtrada; el libro adicional permite detectar el final sin contar coincidencias.
async function fetchLibraryPage(
  filters: LibraryFilters,
  cursor: LibraryCursor,
  signal: AbortSignal
) {
  const { data, error } = await supabase
    .rpc('search_library', {
      p_status: filters.status,
      p_search: filters.search,
      p_rating: filters.rating,
      p_tag: filters.tag ?? undefined,
      p_before_created_at: cursor?.createdAt,
      p_before_id: cursor?.id
    })
    .select('*, books(*)')
    .abortSignal(signal)
  if (error) throw error
  const rows = (data ?? []) as LibraryRow[]
  const items = rows.slice(0, LIBRARY_PAGE_SIZE)
  const last = items.at(-1)
  return {
    items,
    nextCursor:
      rows.length > LIBRARY_PAGE_SIZE && last
        ? { createdAt: last.created_at ?? '1970-01-01T00:00:00Z', id: last.id }
        : null
  }
}

// Separa la forma paginada de las consultas simples usadas por el perfil, conservando la invalidación común.
export const libraryInfiniteOptions = (
  userId: string,
  filters: LibraryFilters
) =>
  infiniteQueryOptions({
    queryKey: ['library', userId, 'pages', filters],
    initialPageParam: null as LibraryCursor,
    queryFn: ({ pageParam, signal }) =>
      fetchLibraryPage(filters, pageParam, signal),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: !!userId
  })

// Mantiene las etiquetas de toda la estantería aunque una página o un filtro no las contengan.
export const librarySummaryQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['library', userId, 'summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('library_summary')
      if (error) throw error
      return data
    },
    enabled: !!userId
  })

// Comparte la identidad de escritura y permite bloquear controles del mismo libro en otras vistas.
export const readingRecordMutationOptions = (
  userId: string,
  bookId: string
) => ({
  mutationKey: [...userBookQueryOptions(userId, bookId).queryKey, 'save'],
  scope: { id: `reading:${userId}:${bookId}` }
})
