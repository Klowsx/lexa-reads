import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { supabase } from '~/lib/supabase'
import type { Tables } from '~/types/database'
import type { UpsertReviewParams } from '~/types'

export {
  bookQueryOptions,
  searchBooksQueryOptions,
  trendingBooksQueryOptions
} from './catalog.queries'

// ─── Reviews ──────────────────────────────────────────────────

// Una reseña enriquecida con los datos públicos del autor,
// usada en la lista de reseñas del libro.
export type ReviewWithUser = Tables<'reviews'> & {
  users: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

// Cursor para paginación por par (created_at, id).
// null significa "primera página, sin offset".
export type ReviewCursor = { createdAt: string; id: string } | null

const REVIEWS_PAGE_SIZE = 10

// Carga una página de reseñas publicadas para un libro dado.
// El par (created_at, id) como cursor evita offsets costosos en tablas grandes.
async function fetchBookReviews(
  bookId: string,
  cursor: ReviewCursor
): Promise<{ rows: ReviewWithUser[]; nextCursor: ReviewCursor }> {
  let query = supabase
    .from('reviews')
    .select('*, users(id, username, display_name, avatar_url)')
    .eq('book_id', bookId)
    .eq('is_published', true) // solo reseñas publicadas
    .is('deleted_at', null) // excluir soft-deleted
    .order('created_at', { ascending: false })
    .order('id', { ascending: false }) // desempate para cursor estable
    .limit(REVIEWS_PAGE_SIZE)

  // Cursor-based pagination: solo filas anteriores al último ítem visto.
  // Equivale a WHERE (created_at, id) < (cursor.createdAt, cursor.id).
  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
    )
  }

  const { data, error } = await query
  if (error) throw error

  const rows = (data ?? []) as ReviewWithUser[]

  // Si recibimos exactamente PAGE_SIZE filas, puede haber más.
  const nextCursor: ReviewCursor =
    rows.length === REVIEWS_PAGE_SIZE
      ? {
          createdAt: rows[rows.length - 1].created_at!,
          id: rows[rows.length - 1].id
        }
      : null

  return { rows, nextCursor }
}

// infiniteQueryOptions (TanStack Query v5) para la lista paginada.
// pageParam = cursor de la última página cargada.
export const bookReviewsInfiniteOptions = (bookId: string) =>
  infiniteQueryOptions({
    queryKey: ['reviews', bookId] as const,
    queryFn: ({ pageParam }) =>
      fetchBookReviews(bookId, pageParam as ReviewCursor),
    initialPageParam: null as ReviewCursor,
    // Si la página anterior no devolvió cursor, no hay más páginas.
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!bookId
  })

// Trae la reseña del usuario actual para un libro.
// Sirve para saber si ya existe (mostrar "Editar" vs "Crear")
// y para precargar el formulario de edición.
async function fetchMyReview(
  userId: string,
  bookId: string
): Promise<Tables<'reviews'> | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .is('deleted_at', null) // una reseña borrada no cuenta como "existente"
    .maybeSingle()

  if (error) throw error
  return data
}

// queryKey separado de la lista paginada para que el optimistic update
// al crear/editar no rompa la paginación.
export const myReviewQueryOptions = (userId: string, bookId: string) =>
  queryOptions({
    queryKey: ['my_review', userId, bookId] as const,
    queryFn: () => fetchMyReview(userId, bookId),
    enabled: !!userId && !!bookId
  })

// Recupera el contexto persistido del libro para el editor, cuyo parámetro es un UUID interno.
export const reviewBookQueryOptions = (bookId: string) =>
  queryOptions({
    queryKey: ['review_book', bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('id, title, authors')
        .eq('id', bookId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!bookId
  })

// Crea una nueva reseña o edita una existente.
// reviewId presente → UPDATE; ausente → INSERT.
export async function upsertReviewFn(
  userId: string,
  params: UpsertReviewParams
): Promise<Tables<'reviews'>> {
  if (params.reviewId) {
    // Edición: actualiza texto, spoiler flag y edited_at.
    const { data, error } = await supabase
      .from('reviews')
      .update({
        body: params.body.trim(),
        contains_spoilers: params.containsSpoilers,
        is_published: true,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.reviewId)
      .eq('user_id', userId) // el usuario solo puede editar la suya
      .eq('book_id', params.bookId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  // Creación: is_published = true — el usuario siempre publica directamente.
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      user_id: userId,
      book_id: params.bookId,
      user_book_id: params.userBookId ?? null,
      body: params.body.trim(),
      contains_spoilers: params.containsSpoilers,
      is_published: true
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Community stats ──────────────────────────────────────────

export type RatingBar = { star: number; count: number; pct: number }

export type FriendActivity = {
  userId: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  status: string
  rating: number | null
  currentPage: number | null
}

export type BookCommunityStats = {
  totalReaders: number
  readingCount: number
  wantCount: number
  avgRating: number
  ratingsCount: number
  distribution: RatingBar[]
  friendActivity: FriendActivity[]
}

async function fetchBookCommunityStats(
  bookId: string,
  userId: string
): Promise<BookCommunityStats> {
  const [totalRes, readingRes, wantRes, ratingsRes, followsRes] =
    await Promise.all([
      supabase
        .from('user_books')
        .select('id', { count: 'exact', head: true })
        .eq('book_id', bookId),
      supabase
        .from('user_books')
        .select('id', { count: 'exact', head: true })
        .eq('book_id', bookId)
        .eq('status', 'reading'),
      supabase
        .from('user_books')
        .select('id', { count: 'exact', head: true })
        .eq('book_id', bookId)
        .eq('status', 'want_to_read'),
      supabase
        .from('user_books')
        .select('rating')
        .eq('book_id', bookId)
        .not('rating', 'is', null)
        .limit(500),
      userId
        ? supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', userId)
            .eq('status', 'accepted')
            .limit(100)
        : Promise.resolve({ data: [], error: null })
    ])

  const ratings = (ratingsRes.data ?? [])
    .map((r) => r.rating as number)
    .filter(Boolean)

  const avgRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) /
        10
      : 0

  const dist: Record<number, number> = {}
  for (const r of ratings) {
    const key = Math.round(r)
    dist[key] = (dist[key] ?? 0) + 1
  }

  const distribution: RatingBar[] = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: dist[star] ?? 0,
    pct:
      ratings.length > 0
        ? Math.round(((dist[star] ?? 0) / ratings.length) * 100)
        : 0
  }))

  const followedIds = (followsRes.data ?? []).map((f) => f.following_id)

  let friendActivity: FriendActivity[] = []
  if (followedIds.length > 0) {
    const { data: friendBooks } = await supabase
      .from('user_books')
      .select(
        'status, rating, current_page, user_id, users(id, username, display_name, avatar_url)'
      )
      .eq('book_id', bookId)
      .in('user_id', followedIds)
      .limit(5)

    friendActivity = ((friendBooks ?? []) as any[]).map((row) => ({
      userId: row.user_id,
      username: row.users?.username ?? '',
      displayName: row.users?.display_name ?? null,
      avatarUrl: row.users?.avatar_url ?? null,
      status: row.status,
      rating: row.rating,
      currentPage: row.current_page
    }))
  }

  return {
    totalReaders: totalRes.count ?? 0,
    readingCount: readingRes.count ?? 0,
    wantCount: wantRes.count ?? 0,
    avgRating,
    ratingsCount: ratings.length,
    distribution,
    friendActivity
  }
}

export const bookCommunityStatsQueryOptions = (
  bookId: string,
  userId: string
) =>
  queryOptions({
    queryKey: ['book_community', bookId, userId] as const,
    queryFn: () => fetchBookCommunityStats(bookId, userId),
    enabled: !!bookId,
    staleTime: 1000 * 60 * 5
  })

// Soft delete: pone deleted_at en vez de borrar la fila.
// Así se mantiene la integridad referencial con activity_feed y review_likes.
export async function deleteReviewFn(
  userId: string,
  reviewId: string
): Promise<void> {
  if (!userId) throw new Error('Sesión requerida')
  const { error, data } = await supabase.rpc('remove_own_content', {
    p_type: 'review',
    p_id: reviewId
  })
  if (error) throw error
  if (!data) throw new Error('La reseña ya no está disponible')
}
