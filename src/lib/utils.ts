import { fixed } from '~/theme/colors'
import i18n from '~/lib/i18n'

/*
 * Utilidades generales
 * =====================
 *
 * Funciones pequeñas y reutilizables que no pertenecen a un feature específico.
 * Todas son puras (sin efectos secundarios) y tipadas.
 */

/* ------------------------------------------------------------------ */
/*  cn — classnames condicionales (Tailwind compat)                    */
/* ------------------------------------------------------------------ */

/*
 * cn — mergea clases de Tailwind condicionalmente.
 *
 * Acepta strings, undefined, null, false y arrays.
 * Los valores falsy se ignoran. Los strings se unen con espacio.
 *
 * Uso:
 *   cn("bg-white", isActive && "bg-blue-500", "px-4")
 *   // → "bg-white bg-blue-500 px-4"  (si isActive es true)
 *
 * Esto evita tener que instalar una librería solo para mergear clases.
 * Si el proyecto escala y necesitas resolución de conflictos de Tailwind,
 * reemplaza el cuerpo con clsx + tailwind-merge.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/* ------------------------------------------------------------------ */
/*  Fechas                                                             */
/* ------------------------------------------------------------------ */

/*
 * formatDate — fecha legible en el idioma seleccionado en la aplicación.
 *
 * Recibe: Date, string ISO, o timestamp
 * Retorna: string tipo "15 de mayo de 2026"
 *
 * Si no hay fecha o es inválida, retorna string vacío.
 */
export function formatDate(
  date: Date | string | number | null | undefined
): string {
  if (date == null || date === '') return ''
  const d =
    typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

  if (!Number.isFinite(d.getTime())) return ''
  return d.toLocaleDateString(i18n.resolvedLanguage ?? i18n.language ?? 'es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/*
 * formatRelativeTime — "hace 3 días", "ahora", etc.
 *
 * Útil para feeds y timestamps ubicuos.
 * Respeta el idioma de la aplicación y conserva el sentido de fechas futuras.
 */
export function formatRelativeTime(
  date: Date | string | number | null | undefined
): string {
  if (date == null || date === '') return ''
  const d =
    typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

  if (!Number.isFinite(d.getTime())) return ''
  const seconds = (d.getTime() - Date.now()) / 1000
  const magnitude = Math.abs(seconds)
  const formatter = new Intl.RelativeTimeFormat(
    i18n.resolvedLanguage ?? i18n.language ?? 'es',
    { numeric: 'auto', style: 'short' }
  )
  if (magnitude < 60) return formatter.format(0, 'second')
  if (magnitude < 3600)
    return formatter.format(Math.trunc(seconds / 60), 'minute')
  if (magnitude < 86400)
    return formatter.format(Math.trunc(seconds / 3600), 'hour')
  if (magnitude < 2592000)
    return formatter.format(Math.trunc(seconds / 86400), 'day')
  if (magnitude < 31536000)
    return formatter.format(Math.trunc(seconds / 2592000), 'month')
  return formatDate(d)
}

/*
 * formatYear — extrae el año de una fecha.
 *
 * Útil para mostrar "Publicado en 2024" en la página del libro.
 */
export function formatYear(
  date: Date | string | number | null | undefined
): number | null {
  if (!date) return null
  const d =
    typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  return d.getFullYear()
}

/* ------------------------------------------------------------------ */
/*  Números y plurales                                                 */
/* ------------------------------------------------------------------ */

/*
 * pluralize — forma plural simple en español.
 *
 * Recibe: cantidad, singular, plural (opcional)
 * Retorna: string con la palabra en singular o plural.
 *
 *   pluralize(1, "libro")     → "1 libro"
 *   pluralize(3, "libro")     → "3 libros"
 *   pluralize(0, "libro")     → "0 libros"
 *   pluralize(1, "vez", "veces") → "1 vez"
 *   pluralize(3, "vez", "veces") → "3 veces"
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  const p = plural ?? `${singular}s`
  return `${count} ${count === 1 ? singular : p}`
}

/*
 * truncateNumber — acorta números grandes para mostrar.
 *
 *   1234     → "1.2K"
 *   1234567  → "1.2M"
 *   42       → "42"
 *
 * Útil para contadores en perfiles y feeds.
 */
export function truncateNumber(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`
  return `${(n / 1_000_000).toFixed(1)}M`
}

/* ------------------------------------------------------------------ */
/*  Rating                                                             */
/* ------------------------------------------------------------------ */

/*
 * formatRating — muestra el rating como string.
 *
 *   formatRating(4.5) → "4.5"
 *   formatRating(4.0) → "4.0"
 *   formatRating(null) → "--"
 *
 * Los ratings en Lexa son con medias estrellas (0.5 - 5.0, pasos de 0.5).
 * Siempre mostramos 1 decimal por claridad.
 */
export function formatRating(rating: number | null | undefined): string {
  if (rating == null) return '--'
  return rating.toFixed(1)
}

/*
 * ratingToStars — convierte rating numérico a array para renderizar estrellas.
 *
 * Retorna un array de strings: "full" | "half" | "empty"
 * para renderizar 5 estrellas con soporte de medias.
 *
 *   ratingToStars(4.5) → ["full","full","full","full","half"]
 *   ratingToStars(3.0) → ["full","full","full","empty","empty"]
 */
export type StarState = 'full' | 'half' | 'empty'

export function ratingToStars(rating: number): StarState[] {
  const result: StarState[] = []
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      result.push('full')
    } else if (rating >= i - 0.5) {
      result.push('half')
    } else {
      result.push('empty')
    }
  }
  return result
}

/* ------------------------------------------------------------------ */
/*  Strings                                                            */
/* ------------------------------------------------------------------ */

/*
 * generateSlug — crea un slug URL-friendly desde un string.
 *
 *   generateSlug("Mis libros favoritos") → "mis-libros-favoritos"
 *
 * Normaliza: lower case, reemplaza espacios por guiones, elimina acentos.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // elimina diacríticos
    .replace(/[^a-z0-9]+/g, '-') // espacios y no-alfanuméricos → guión
    .replace(/^-+|-+$/g, '') // recortar guiones extremos
}

/*
 * extractInitials — iniciales de un nombre para avatar fallback.
 *
 *   extractInitials("María García") → "MG"
 *   extractInitials("Alex") → "A"
 */
export function extractInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/*
 * deriveAvatarColor — color determinista para un usuario a partir de su id/username.
 *
 * Usa un hash simple (djb2) para seleccionar un color de una paleta fija.
 * El mismo string siempre devuelve el mismo color — sin randomness.
 *
 *   deriveAvatarColor("javierh3r") → "#C4783A" (siempre el mismo)
 */
const AVATAR_PALETTE = fixed.avatar.derived

export function deriveAvatarColor(seed: string): string {
  let hash = 5381
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33) ^ seed.charCodeAt(i)
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

/* ------------------------------------------------------------------ */
/*  Arrays                                                             */
/* ------------------------------------------------------------------ */

/*
 * groupBy — agrupa un array por una clave.
 *
 *   groupBy([...libros], "status")
 *   // → { reading: [...], read: [...], want_to_read: [...] }
 */
export function groupBy<T>(
  items: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  const result: Record<string, T[]> = {}
  for (const item of items) {
    const key = keyFn(item)
    ;(result[key] ??= []).push(item)
  }
  return result
}

/*
 * sortByDate — ordena un array de objetos por un campo fecha.
 *
 *   sortByDate(actividades, "created_at", "desc")
 *
 * Retorna un nuevo array ordenado (no muta el original).
 */
export function sortByDate<T>(
  items: T[],
  dateField: keyof T,
  direction: 'asc' | 'desc' = 'desc'
): T[] {
  return [...items].sort((a, b) => {
    const aDate = new Date(String(a[dateField])).getTime()
    const bDate = new Date(String(b[dateField])).getTime()
    return direction === 'desc' ? bDate - aDate : aDate - bDate
  })
}
