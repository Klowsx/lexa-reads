import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { supabase } from '~/lib/supabase'

// ── Feed types ─────────────────────────────────────────────────

export type ActivityType =
  | 'finished_book'
  | 'started_book'
  | 'wrote_review'
  | 'added_to_list'
  | 'want_to_read'
  | 'abandoned_book'

export type FeedItemUser = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

export type FeedItemBook = {
  id: string
  title: string
  authors: string[]
  cover_url: string | null
  google_books_id: string
}

export type FeedItem = {
  id: string
  user: FeedItemUser
  activity_type: ActivityType
  book: FeedItemBook
  review_preview: string | null
  review_contains_spoilers: boolean
  review_id: string | null
  list_name: string | null
  likes_count: number
  liked: boolean
  created_at: string
}

const FEED_PAGE = 20

// Cursor compuesto (created_at, id) — CLAUDE.md §6 / D-2.
// Filtrar solo por created_at pierde o duplica filas cuando dos comparten
// timestamp justo en el borde de página (común con inserciones en lote en
// activity_feed). El id desempata de forma determinista.
export type FeedCursor = { created_at: string; id: string }

const FEED_COLS = `
  id, user_id, activity_type, book_id, review_id, list_id, likes_count, created_at,
  user:users!activity_feed_user_id_fkey(id, username, display_name, avatar_url),
  book:books!activity_feed_book_id_fkey(id, title, authors, cover_url, google_books_id),
  review:reviews(body, contains_spoilers, deleted_at, is_published),
  list:lists(name)
`.trim()

type RawFeedRow = {
  id: string
  user_id: string
  activity_type: ActivityType
  likes_count: number
  created_at: string
  user: FeedItemUser
  book: FeedItemBook
  review_id: string | null
  review: {
    body: string
    contains_spoilers: boolean | null
    deleted_at: string | null
    is_published: boolean | null
  } | null
  list: { name: string } | null
}

// Conserva el indicador de spoiler y descarta reseñas retiradas también en las vistas previas.
async function fetchFeedPage(
  userId: string,
  cursor?: FeedCursor
): Promise<{ items: FeedItem[]; nextCursor: FeedCursor | null }> {
  let query = supabase
    .from('activity_feed')
    .select(FEED_COLS)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(FEED_PAGE)

  if (cursor) {
    // Orden descendente: la siguiente página son las filas estrictamente
    // "anteriores" al cursor en la secuencia (created_at, id).
    query = query.or(
      `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
    )
  }

  const { data, error } = await query
  if (error) throw error

  const rows = (data ?? []) as unknown as RawFeedRow[]
  if (rows.length === 0) return { items: [], nextCursor: null }

  // Batch-check which items the current user has liked
  const activityIds = rows.map((r) => r.id)
  const { data: likes } = await supabase
    .from('activity_likes')
    .select('activity_id')
    .in('activity_id', activityIds)
    .eq('user_id', userId)
  const likedSet = new Set((likes ?? []).map((l) => l.activity_id))

  const items: FeedItem[] = rows.map((row) => ({
    id: row.id,
    user: row.user,
    activity_type: row.activity_type,
    book: row.book,
    review_preview:
      row.review?.deleted_at == null && row.review?.is_published
        ? row.review.body
        : null,
    review_contains_spoilers: row.review?.contains_spoilers ?? false,
    review_id: row.review_id,
    list_name: row.list?.name ?? null,
    likes_count: row.likes_count,
    liked: likedSet.has(row.id),
    created_at: row.created_at
  }))

  const last = items[items.length - 1]
  const nextCursor =
    items.length === FEED_PAGE
      ? { created_at: last.created_at, id: last.id }
      : null

  return { items, nextCursor }
}

export const feedInfiniteOptions = (userId: string) =>
  infiniteQueryOptions({
    queryKey: ['feed', userId],
    queryFn: ({ pageParam }) =>
      fetchFeedPage(userId, pageParam as FeedCursor | undefined),
    initialPageParam: undefined as FeedCursor | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!userId,
    staleTime: 1000 * 60 * 2
  })

// ── Types ──────────────────────────────────────────────────────

export type CommentTargetType = 'review' | 'activity'

export type CommentUser = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

export type CommentRow = {
  id: string
  user_id: string
  target_type: CommentTargetType
  target_id: string
  parent_id: string | null
  reply_to_user_id: string | null
  body: string
  contains_spoilers: boolean
  created_at: string | null
  deleted_at: string | null
  user: CommentUser
}

const COMMENT_COLS =
  'id, user_id, target_type, target_id, parent_id, reply_to_user_id, body, contains_spoilers, created_at, deleted_at, user:users!comments_user_id_fkey(id, username, display_name, avatar_url)'

const COMMENT_PAGE = 40

// ── Activity likes ─────────────────────────────────────────────

export async function toggleActivityLikeFn(
  activityId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<void> {
  if (currentlyLiked) {
    const { error } = await supabase
      .from('activity_likes')
      .delete()
      .eq('activity_id', activityId)
      .eq('user_id', userId)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('activity_likes')
      .insert({ activity_id: activityId, user_id: userId })
    if (error) throw error
  }
}

export async function fetchActivityLiked(
  activityId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('activity_likes')
    .select('id')
    .eq('activity_id', activityId)
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

// ── Review likes ───────────────────────────────────────────────

export async function toggleReviewLikeFn(
  reviewId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<void> {
  if (currentlyLiked) {
    const { error } = await supabase
      .from('review_likes')
      .delete()
      .eq('review_id', reviewId)
      .eq('user_id', userId)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('review_likes')
      .insert({ review_id: reviewId, user_id: userId })
    if (error) throw error
  }
}

export async function fetchReviewLiked(
  reviewId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('review_likes')
    .select('id')
    .eq('review_id', reviewId)
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

// ── Comments ───────────────────────────────────────────────────

// Pagina únicamente comentarios activos y visibles según los permisos del padre.
async function fetchComments(
  targetType: CommentTargetType,
  targetId: string,
  cursor?: FeedCursor
): Promise<{ items: CommentRow[]; nextCursor: FeedCursor | null }> {
  let query = supabase
    .from('comments')
    .select(COMMENT_COLS)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .is('deleted_at', null)
    .is('parent_id', null)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(COMMENT_PAGE)

  if (cursor) {
    // Orden ascendente: cursor compuesto (created_at, id) — ver D-2.
    query = query.or(
      `created_at.gt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.gt.${cursor.id})`
    )
  }

  const { data, error } = await query
  if (error) throw error

  const items = (data ?? []) as unknown as CommentRow[]
  const last = items[items.length - 1]
  return {
    items,
    nextCursor:
      items.length === COMMENT_PAGE && last?.created_at
        ? { created_at: last.created_at, id: last.id }
        : null
  }
}

export const commentsInfiniteOptions = (
  targetType: CommentTargetType,
  targetId: string,
  enabled = true
) =>
  infiniteQueryOptions({
    queryKey: ['comments', targetType, targetId],
    queryFn: ({ pageParam }) =>
      fetchComments(targetType, targetId, pageParam as FeedCursor | undefined),
    initialPageParam: undefined as FeedCursor | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!targetId && enabled
  })

// Publica un comentario con su marca de spoiler; RLS valida el acceso al contenido padre.
export async function createCommentFn(params: {
  userId: string
  targetType: CommentTargetType
  targetId: string
  body: string
  containsSpoilers?: boolean
  parentId?: string
}): Promise<CommentRow> {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      user_id: params.userId,
      target_type: params.targetType,
      target_id: params.targetId,
      body: params.body.trim(),
      contains_spoilers: params.containsSpoilers ?? false,
      parent_id: params.parentId ?? null
    })
    .select(COMMENT_COLS)
    .single()
  if (error) throw error
  return data as unknown as CommentRow
}

// Retira solo un comentario propio y exige confirmación de la fila afectada para evitar falsos éxitos.
export async function deleteCommentFn(commentId: string): Promise<void> {
  const { error, data } = await supabase.rpc('remove_own_content', {
    p_type: 'comment',
    p_id: commentId
  })
  if (error) throw error
  if (!data) throw new Error('El comentario ya no está disponible')
}

export type CommentContext = { containsSpoilers: boolean; version: string }

// Resuelve el hilo bajo RLS antes de cargar comentarios y hereda la protección de su reseña.
async function fetchCommentContext(
  type: CommentTargetType,
  id: string
): Promise<CommentContext> {
  if (type === 'review') {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, contains_spoilers, edited_at')
      .eq('id', id)
      .eq('is_published', true)
      .is('deleted_at', null)
      .single()
    if (error) throw error
    return {
      containsSpoilers: data.contains_spoilers ?? false,
      version: `${id}:${data.edited_at}:${data.contains_spoilers}`
    }
  }
  const { data, error } = await supabase
    .from('activity_feed')
    .select('id, review:reviews(contains_spoilers, edited_at)')
    .eq('id', id)
    .single()
  if (error) throw error
  return {
    containsSpoilers: data.review?.contains_spoilers ?? false,
    version: `${id}:${data.review?.edited_at ?? ''}:${data.review?.contains_spoilers}`
  }
}

// Incluye el contexto de spoiler y disponibilidad en una caché independiente del listado paginado.
export const commentContextQueryOptions = (
  type: CommentTargetType,
  id: string
) =>
  queryOptions({
    queryKey: ['comment_context', type, id],
    queryFn: () => fetchCommentContext(type, id),
    enabled: !!id
  })
