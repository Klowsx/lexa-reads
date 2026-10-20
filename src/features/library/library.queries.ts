import type { Tables, UpsertUserBookParams } from '~/types'
import type { Database } from '~/types/database'
import { queryOptions } from '@tanstack/react-query'
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
// Prefijo ["library", userId] compartido con libraryCountsQueryOptions
// para que un invalidateQueries({ queryKey: ["library", userId] })
// refresque tanto la lista como los contadores a la vez.
export const libraryQueryOptions = (userId: string, status: UserBookStatus) =>
  queryOptions({
    queryKey: ['library', userId, status],
    queryFn: () => fetchLibrary(userId, status),
    enabled: !!userId
  })

// Cuenta cuántos libros hay por estado en un solo round trip.
async function fetchLibraryCounts(
  userId: string
): Promise<Record<UserBookStatus, number>> {
  const { data, error } = await supabase
    .from('user_books')
    .select('status')
    .eq('user_id', userId)

  if (error) throw error

  // Agrupamos en memoria (biblioteca personal)
  const counts: Record<UserBookStatus, number> = {
    reading: 0,
    read: 0,
    want_to_read: 0,
    abandoned: 0
  }
  for (const row of data ?? []) {
    counts[row.status]++
  }
  return counts
}

// Clave ["library", userId, "counts"] — mismo prefijo que libraryQueryOptions
// para que un invalidateQueries({ queryKey: ["library", userId] }) refresque ambos.
export const libraryCountsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['library', userId, 'counts'],
    queryFn: () => fetchLibraryCounts(userId),
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
