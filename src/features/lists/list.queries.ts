import { queryOptions } from '@tanstack/react-query'
import { supabase } from '~/lib/supabase'
import { fixed } from '~/theme/colors'
import type { Tables, TablesUpdate } from '~/types/database'

// ── Types ──────────────────────────────────────────────────────

export type ListPreviewBook = {
  id: string
  cover_url: string | null
  title: string
}

export type ListRow = {
  id: string
  user_id: string
  name: string
  description: string | null
  visibility: 'public' | 'private'
  slug: string
  books_count: number
  likes_count: number
  is_featured: boolean
  accent_color: string
  created_at: string
  preview_books: ListPreviewBook[]
}

export type ListBookItem = {
  id: string
  position: number
  note: string | null
  added_at: string
  book: Tables<'books'>
}

export type ListDetail = ListRow & {
  items: ListBookItem[]
  liked: boolean
}

// ── Slug generation ────────────────────────────────────────────

// Genera un enlace estable; editar el nombre no cambia la URL compartida.
export function generateListSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
  return `${base}-${Date.now().toString(36)}`
}

// ── List columns ───────────────────────────────────────────────

const LIST_COLS =
  'id, user_id, name, description, visibility, slug, books_count, likes_count, is_featured, accent_color, created_at, preview_books:list_books(id, position, book:books(id, cover_url, title))'

const LIST_DETAIL_COLS = `
  id, user_id, name, description, visibility, slug, books_count, likes_count, is_featured, accent_color, created_at,
  items:list_books(id, position, note, added_at, book:books(*))
` as const

// ── Fetch functions ────────────────────────────────────────────

type ListRecord = Pick<
  Tables<'lists'>,
  | 'id'
  | 'user_id'
  | 'name'
  | 'description'
  | 'visibility'
  | 'slug'
  | 'books_count'
  | 'likes_count'
  | 'is_featured'
  | 'accent_color'
  | 'created_at'
> & { preview_books: { position: number; book: ListPreviewBook | null }[] }

// Normaliza las filas consultadas o guardadas sin ocultar errores de esquema con casts.
function normalizeList(row: ListRecord): ListRow {
  return {
    ...row,
    visibility: row.visibility ?? 'private',
    books_count: row.books_count ?? 0,
    likes_count: row.likes_count ?? 0,
    created_at: row.created_at ?? '1970-01-01T00:00:00Z',
    is_featured: row.is_featured ?? false,
    accent_color: row.accent_color ?? fixed.status.reading,
    preview_books: [...row.preview_books]
      .sort((a, b) => a.position - b.position)
      .slice(0, 3)
      .map((item) => item.book)
      .filter((book): book is ListPreviewBook => !!book)
  }
}

// Consulta las listas del usuario y conserva portadas válidas para el perfil y el selector.
async function fetchUserLists(userId: string): Promise<ListRow[]> {
  const { data, error } = await supabase
    .from('lists')
    .select(LIST_COLS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(normalizeList)
}

// Consulta una lista pública o privada y conserva un color de respaldo centralizado.
async function fetchList(
  slug: string,
  viewerId: string
): Promise<ListDetail | null> {
  const { data, error } = await supabase
    .from('lists')
    .select(LIST_DETAIL_COLS)
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const like = viewerId
    ? await supabase
        .from('list_likes')
        .select('id')
        .eq('list_id', data.id)
        .eq('user_id', viewerId)
        .maybeSingle()
    : { data: null, error: null }
  if (like.error) throw like.error

  const items: ListBookItem[] = data.items
    .flatMap((item) =>
      item.book
        ? [
            {
              ...item,
              book: item.book,
              added_at: item.added_at ?? '1970-01-01T00:00:00Z'
            }
          ]
        : []
    )
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
  return {
    ...normalizeList({ ...data, preview_books: items }),
    liked: !!like.data,
    items
  }
}

// ── Query options ──────────────────────────────────────────────

export const userListsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['lists', 'user', userId],
    queryFn: () => fetchUserLists(userId),
    enabled: !!userId
  })

export const listQueryOptions = (slug: string, viewerId = '') =>
  queryOptions({
    queryKey: ['lists', 'slug', slug, viewerId],
    queryFn: () => fetchList(slug, viewerId),
    enabled: !!slug
  })

// ── Mutation functions ─────────────────────────────────────────

// Valida los límites compartidos antes de enviar el formulario.
function validateList(name?: string, description?: string | null) {
  if (name !== undefined && (name.trim().length < 2 || name.trim().length > 60))
    throw new Error('El nombre debe tener entre 2 y 60 caracteres.')
  if (description && description.trim().length > 200)
    throw new Error('La descripción admite hasta 200 caracteres.')
}

// Crea la lista sin modificar contadores mantenidos por la base de datos.
export async function createListFn(params: {
  userId: string
  name: string
  description?: string
  visibility: 'public' | 'private'
  accentColor: string
}): Promise<ListRow> {
  validateList(params.name, params.description)
  const slug = generateListSlug(params.name)
  const { data, error } = await supabase
    .from('lists')
    .insert({
      user_id: params.userId,
      name: params.name,
      description: params.description ?? null,
      visibility: params.visibility,
      slug,
      accent_color: params.accentColor
    })
    .select(LIST_COLS)
    .single()
  if (error) throw error
  return normalizeList(data)
}

// Actualiza solo los campos enviados y exige que el servidor devuelva la lista autorizada.
export async function updateListFn(params: {
  listId: string
  name?: string
  description?: string | null
  visibility?: 'public' | 'private'
  accentColor?: string
  isFeatured?: boolean
}): Promise<ListRow> {
  validateList(params.name, params.description)
  const updates: TablesUpdate<'lists'> = {}
  if (params.name !== undefined) updates.name = params.name
  if (params.description !== undefined) updates.description = params.description
  if (params.visibility !== undefined) updates.visibility = params.visibility
  if (params.accentColor !== undefined)
    updates.accent_color = params.accentColor
  if (params.isFeatured !== undefined) updates.is_featured = params.isFeatured

  const { data, error } = await supabase
    .from('lists')
    .update(updates)
    .eq('id', params.listId)
    .select(LIST_COLS)
    .single()
  if (error) throw error
  return normalizeList(data)
}

// Elimina la lista y detecta si ya no existe o se perdieron los permisos.
export async function deleteListFn(listId: string): Promise<void> {
  const { error } = await supabase
    .from('lists')
    .delete()
    .eq('id', listId)
    .select('id')
    .single()
  if (error) throw error
}

// El servidor añade al final y evita duplicados, incluso entre dos dispositivos.
export async function addBookToListFn(
  listId: string,
  bookId: string
): Promise<void> {
  const { error } = await supabase.rpc('add_list_book', {
    target_list: listId,
    target_book: bookId
  })
  if (error) throw error
}

// Quita únicamente la relación con la lista, nunca el libro de la biblioteca.
export async function removeBookFromListFn(listBookId: string): Promise<void> {
  const { error } = await supabase
    .from('list_books')
    .delete()
    .eq('id', listBookId)
    .select('id')
    .single()
  if (error) throw error
}

// Consulta la pertenencia real para conservar la selección al volver a abrir el selector.
export const bookListsQueryOptions = (userId: string, bookId: string) =>
  queryOptions({
    queryKey: ['lists', 'membership', userId, bookId],
    enabled: !!userId && !!bookId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('list_books')
        .select('id,list_id,lists!inner(user_id)')
        .eq('book_id', bookId)
        .eq('lists.user_id', userId)
      if (error) throw error
      return data ?? []
    }
  })

export async function reorderListBooksFn(
  updates: { id: string; position: number }[]
): Promise<void> {
  await Promise.all(
    updates.map(({ id, position }) =>
      supabase.from('list_books').update({ position }).eq('id', id)
    )
  )
}

export async function toggleListLikeFn(
  listId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<void> {
  if (currentlyLiked) {
    const { error } = await supabase
      .from('list_likes')
      .delete()
      .eq('list_id', listId)
      .eq('user_id', userId)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('list_likes')
      .insert({ list_id: listId, user_id: userId })
    if (error) throw error
  }
}
