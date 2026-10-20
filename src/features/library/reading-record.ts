import type { BookStatus } from '~/lib/book-status'
import type { Tables, UpsertUserBookParams } from '~/types'

export type ReadingDates = {
  started_at: string | null
  finished_at: string | null
}
export type ReadingDateError =
  'invalidDate' | 'futureDate' | 'dateOrder' | 'finishRequired' | null

// Usa el día del dispositivo, sin desplazar una lectura al día anterior por UTC.
export function localReadingDate(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// Acepta solo días reales en formato ISO, incluyendo años bisiestos.
export function isReadingDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '0001-01-01') return false
  const parsed = new Date(`${value}T12:00:00Z`)
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  )
}

// Comprueba las fechas antes de enviar; el servidor vuelve a validar todas las reglas.
export function validateReadingDates(
  status: BookStatus,
  dates: ReadingDates,
  today = localReadingDate()
): ReadingDateError {
  for (const value of [dates.started_at, dates.finished_at]) {
    if (value != null && !isReadingDate(value)) return 'invalidDate'
    if (value != null && value > today) return 'futureDate'
  }
  if (status === 'read' && !dates.finished_at) return 'finishRequired'
  if (
    dates.started_at &&
    dates.finished_at &&
    dates.started_at > dates.finished_at
  )
    return 'dateOrder'
  return null
}

// Proyecta las mismas transiciones que la RPC, respetando null explícito al quitar datos.
export function projectReadingRecord(
  previous: Tables<'user_books'> | null | undefined,
  changes: UpsertUserBookParams,
  userId: string,
  today = localReadingDate()
): Tables<'user_books'> {
  const status = changes.status ?? previous?.status ?? 'want_to_read'
  const changedStatus = status !== previous?.status
  let started = previous?.started_at ?? null
  let finished = previous?.finished_at ?? null
  if (changedStatus) {
    if (status === 'want_to_read') started = null
    if (status === 'reading' && (!started || previous?.status === 'read'))
      started = today
    finished = status === 'read' ? today : null
  }
  if (changes.started_at !== undefined) started = changes.started_at
  if (changes.finished_at !== undefined) finished = changes.finished_at
  return {
    id: previous?.id ?? `pending-${changes.bookId}`,
    user_id: userId,
    book_id: changes.bookId,
    created_at: previous?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
    current_page: previous?.current_page ?? null,
    goodreads_id: previous?.goodreads_id ?? null,
    is_reread: previous?.is_reread ?? false,
    reread_count: previous?.reread_count ?? 0,
    status,
    rating:
      changes.rating !== undefined
        ? changes.rating
        : (previous?.rating ?? null),
    started_at: started,
    finished_at: finished,
    tags: changes.tags !== undefined ? changes.tags : (previous?.tags ?? [])
  }
}
