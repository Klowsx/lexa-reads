import { Database } from './database'

export type UpsertUserBookParams = {
  bookId: string
  status?: Database['public']['Enums']['user_book_status']
  rating?: number | null
  started_at?: string | null
  finished_at?: string | null
  tags?: string[] | null
}

// Parámetros para crear o editar una reseña.
// reviewId presente → edición; ausente → creación.
export type UpsertReviewParams = {
  bookId: string
  body: string
  containsSpoilers: boolean
  reviewId?: string // si existe, es un UPDATE; si no, es un INSERT
  userBookId?: string // FK opcional a user_books
}
