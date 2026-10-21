import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { decode } from 'base64-arraybuffer'
import { supabase } from '~/lib/supabase'
import type { Tables } from '~/types/database'

type Book = Tables<'books'>
export type CatalogFilters = {
  search: string
  genres: string[]
  tags: string[]
  yearFrom: number | null
  yearTo: number | null
}
export const emptyCatalogFilters: Omit<CatalogFilters, 'search'> = {
  genres: [],
  tags: [],
  yearFrom: null,
  yearTo: null
}
export type CatalogFacet = {
  kind: 'genre' | 'tag'
  value: string
  label_es: string | null
  label_en: string | null
}
type Cursor = { rank: number; createdAt: string; id: string } | null
const PAGE_SIZE = 20

// Replica el orden de relevancia del RPC para construir el cursor de la última ficha.
function rankBook(book: Book, search: string): number {
  const term = search.trim().toLowerCase()
  if (!term) return 0
  const isbn = term.replace(/[^0-9x]/g, '')
  if (book.isbn_10?.toLowerCase() === isbn || book.isbn_13 === isbn) return 4
  if (book.title.toLowerCase() === term) return 3
  if (book.title.toLowerCase().startsWith(term)) return 2
  if (book.authors?.some((author) => author.toLowerCase().startsWith(term)))
    return 1
  return 0
}

// Consulta únicamente el catálogo compartido y conserva una página adicional para detectar si hay más.
async function fetchCatalogPage(filters: CatalogFilters, cursor: Cursor) {
  // El RPC se añade en la migración de catálogo; los tipos generados se actualizarán al aplicarla.
  const { data, error } = await (supabase as SupabaseClient).rpc(
    'search_catalog',
    {
      p_search: filters.search,
      p_before_rank: cursor?.rank ?? null,
      p_before_created_at: cursor?.createdAt ?? null,
      p_before_id: cursor?.id ?? null,
      p_limit: PAGE_SIZE + 1,
      p_genres: filters.genres,
      p_tags: filters.tags,
      p_year_from: filters.yearFrom,
      p_year_to: filters.yearTo
    }
  )
  if (error) throw error
  const rows = (data ?? []) as Book[]
  const items = rows.slice(0, PAGE_SIZE)
  const last = items.at(-1)
  return {
    items,
    nextCursor:
      rows.length > PAGE_SIZE && last
        ? {
            rank: rankBook(last, filters.search),
            createdAt: last.created_at!,
            id: last.id
          }
        : null
  }
}

// Página completa para búsqueda y filtros de la pantalla principal.
export const catalogInfiniteOptions = (
  filters: CatalogFilters,
  enabled = true
) =>
  infiniteQueryOptions({
    queryKey: ['books', 'catalog', filters],
    queryFn: ({ pageParam }) => fetchCatalogPage(filters, pageParam),
    initialPageParam: null as Cursor,
    getNextPageParam: (last) => last.nextCursor,
    enabled
  })

// Conserva la consulta simple que usa el selector de libros en las listas.
export const searchBooksQueryOptions = (search: string) =>
  queryOptions({
    queryKey: ['books', 'search', search],
    queryFn: async () =>
      (await fetchCatalogPage({ search, ...emptyCatalogFilters }, null)).items,
    enabled: search.trim().length >= 1
  })

// Carga los valores presentes en fichas compartidas para poblar el modal de filtros.
export const catalogFacetsQueryOptions = () =>
  queryOptions({
    queryKey: ['books', 'catalog-facets'],
    queryFn: async () => {
      const { data, error } = await (supabase as SupabaseClient).rpc(
        'catalog_facets'
      )
      if (error) throw error
      return (data ?? []) as CatalogFacet[]
    },
    staleTime: 5 * 60 * 1000
  })

// Abre por UUID; acepta claves antiguas de Google solo para preservar enlaces ya compartidos.
export const bookQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['book', id],
    queryFn: async () => {
      const column =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id
        )
          ? 'id'
          : 'google_books_id'
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq(column, id)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!id
  })

// Destaca lecturas de la comunidad y completa con fichas recientes si aún hay poca actividad.
export const trendingBooksQueryOptions = () =>
  queryOptions({
    queryKey: ['books', 'trending'],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: activity, error } = await supabase
        .from('user_books')
        .select('book_id, books(*)')
        .gte('created_at', since)
        .limit(100)
      if (error) throw error
      const counts = new Map<string, number>()
      const books = new Map<string, Book>()
      for (const row of activity ?? []) {
        if (!row.books) continue
        counts.set(row.book_id, (counts.get(row.book_id) ?? 0) + 1)
        books.set(row.book_id, row.books as Book)
      }
      const popular = [...books.values()]
        .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0))
        .slice(0, 10)
      if (popular.length >= 5)
        return { books: popular, source: 'community' as const }
      const { data: recent, error: recentError } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      if (recentError) throw recentError
      return {
        books: [
          ...popular,
          ...(recent ?? []).filter((b) => !books.has(b.id))
        ].slice(0, 10),
        source: 'community' as const
      }
    },
    staleTime: 1000 * 60 * 10
  })

// Reúne fichas reales que comparten género para la pestaña de recomendaciones.
export const similarBooksQueryOptions = (book: Book) =>
  queryOptions({
    queryKey: ['books', 'similar', book.id, book.genres],
    queryFn: async () => {
      let query = supabase.from('books').select('*').neq('id', book.id).limit(6)
      if (book.genres?.length) query = query.overlaps('genres', book.genres)
      const { data, error } = await query
      if (error) throw error
      return data
    }
  })

export type NewCommunityBook = {
  title: string
  author: string
  isbn13: string | null
  genres: string[]
  tags: string[]
  descriptionEs: string
  descriptionEn: string
  publishedYear: number | null
  locale: 'es' | 'en'
}

// Publica una imagen en la carpeta del usuario sin sobrescribir otra portada.
async function uploadCover(base64: string, userId: string) {
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
  const { error } = await supabase.storage
    .from('book-covers')
    .upload(path, decode(base64), { contentType: 'image/jpeg' })
  if (error) throw error
  return path
}

// Sube las propuestas y crea ficha, términos y candidatas en una transacción; limpia cargas fallidas.
export async function createCommunityBook(
  values: NewCommunityBook,
  coverBase64: string[],
  userId: string
) {
  const uploadedPaths: string[] = []
  try {
    for (const image of coverBase64) {
      uploadedPaths.push(await uploadCover(image, userId))
    }
    const coverUrls = uploadedPaths.map(
      (path) =>
        supabase.storage.from('book-covers').getPublicUrl(path).data.publicUrl
    )
    const { data, error } = await (supabase as SupabaseClient).rpc(
      'create_community_book',
      {
        p_title: values.title,
        p_author: values.author,
        p_isbn_13: values.isbn13,
        p_genres: values.genres,
        p_tags: values.tags,
        p_description_es: values.descriptionEs,
        p_description_en: values.descriptionEn,
        p_published_year: values.publishedYear,
        p_locale: values.locale,
        p_cover_paths: uploadedPaths,
        p_cover_urls: coverUrls
      }
    )
    if (error) throw error
    return data as Book
  } catch (error) {
    if (uploadedPaths.length)
      await supabase.storage.from('book-covers').remove(uploadedPaths)
    throw error
  }
}

export type CoverCandidate = {
  id: string
  cover_url: string
  votes: number
  selected_by_me: boolean
  added_by: string | null
}

// Muestra las propuestas y los votos agregados de una ficha.
export const bookCoverBallotOptions = (bookId: string) =>
  queryOptions({
    queryKey: ['book', bookId, 'cover-ballot'],
    queryFn: async () => {
      const { data, error } = await (supabase as SupabaseClient).rpc(
        'book_cover_ballot',
        { p_book_id: bookId }
      )
      if (error) throw error
      return (data ?? []) as CoverCandidate[]
    },
    enabled: !!bookId
  })

// Sube una propuesta vinculada a la ficha; retira el archivo si falla su registro.
export async function proposeBookCover(
  bookId: string,
  base64: string,
  userId: string
) {
  const path = await uploadCover(base64, userId)
  try {
    const coverUrl = supabase.storage.from('book-covers').getPublicUrl(path)
      .data.publicUrl
    const { error } = await (supabase as SupabaseClient)
      .from('book_cover_candidates')
      .insert({ book_id: bookId, storage_path: path, cover_url: coverUrl })
    if (error) throw error
  } catch (error) {
    await supabase.storage.from('book-covers').remove([path])
    throw error
  }
}

// Guarda o cambia el único voto del lector mientras la votación está abierta.
export async function voteBookCover(
  bookId: string,
  candidateId: string,
  userId: string
) {
  if (!userId) throw new Error('Sin sesión')
  const { error } = await (supabase as SupabaseClient)
    .from('book_cover_votes')
    .upsert(
      { book_id: bookId, candidate_id: candidateId, user_id: userId },
      { onConflict: 'book_id,user_id' }
    )
  if (error) throw error
}

// Comprueba el permiso administrativo antes de mostrar la corrección de portadas.
export const bookModeratorQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['book_moderator', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data.is_admin
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000
  })

// Cambia la portada de la ficha compartida; RLS impide la actualización a lectores normales.
export async function replaceBookCover(
  bookId: string,
  base64: string,
  userId: string
) {
  const path = await uploadCover(base64, userId)
  try {
    const coverUrl = supabase.storage.from('book-covers').getPublicUrl(path)
      .data.publicUrl
    const { error } = await (supabase as SupabaseClient)
      .from('books')
      .update({
        cover_url: coverUrl,
        cover_finalized_at: new Date().toISOString()
      })
      .eq('id', bookId)
      .select('id')
      .single()
    if (error) throw error
    return coverUrl
  } catch (error) {
    await supabase.storage.from('book-covers').remove([path])
    throw error
  }
}
