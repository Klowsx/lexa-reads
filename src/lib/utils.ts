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
export function cn(
  ...classes: (string | undefined | null | false)[]
): string {
  return classes.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/*  Fechas                                                             */
/* ------------------------------------------------------------------ */

/*
 * formatDate — fecha legible en español.
 *
 * Recibe: Date, string ISO, o timestamp
 * Retorna: string tipo "15 de mayo de 2026"
 *
 * Usa Intl.DateTimeFormat con locale es-ES.
 * Si no hay fecha, retorna string vacío.
 */
export function formatDate(
  date: Date | string | number | null | undefined,
): string {
  if (!date) return "";
  const d = typeof date === "string" || typeof date === "number"
    ? new Date(date)
    : date;

  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/*
 * formatRelativeTime — "hace 3 días", "ahora", etc.
 *
 * Útil para feeds y timestamps ubicuos.
 * Retorna string human-readable en español.
 */
export function formatRelativeTime(
  date: Date | string | number | null | undefined,
): string {
  if (!date) return "";
  const d = typeof date === "string" || typeof date === "number"
    ? new Date(date)
    : date;

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHour < 24) return `hace ${diffHour}h`;
  if (diffDay < 30) return `hace ${diffDay} día${diffDay > 1 ? "s" : ""}`;
  if (diffMonth < 12) return `hace ${diffMonth} mes${diffMonth > 1 ? "es" : ""}`;
  return formatDate(d);
}

/*
 * formatYear — extrae el año de una fecha.
 *
 * Útil para mostrar "Publicado en 2024" en la página del libro.
 */
export function formatYear(
  date: Date | string | number | null | undefined,
): number | null {
  if (!date) return null;
  const d = typeof date === "string" || typeof date === "number"
    ? new Date(date)
    : date;
  return d.getFullYear();
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
  plural?: string,
): string {
  const p = plural ?? `${singular}s`;
  return `${count} ${count === 1 ? singular : p}`;
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
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
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
  if (rating == null) return "--";
  return rating.toFixed(1);
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
export type StarState = "full" | "half" | "empty";

export function ratingToStars(rating: number): StarState[] {
  const result: StarState[] = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      result.push("full");
    } else if (rating >= i - 0.5) {
      result.push("half");
    } else {
      result.push("empty");
    }
  }
  return result;
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
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // elimina diacríticos
    .replace(/[^a-z0-9]+/g, "-") // espacios y no-alfanuméricos → guión
    .replace(/^-+|-+$/g, ""); // recortar guiones extremos
}

/*
 * extractInitials — iniciales de un nombre para avatar fallback.
 *
 *   extractInitials("María García") → "MG"
 *   extractInitials("Alex") → "A"
 */
export function extractInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
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
  keyFn: (item: T) => string,
): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    (result[key] ??= []).push(item);
  }
  return result;
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
  direction: "asc" | "desc" = "desc",
): T[] {
  return [...items].sort((a, b) => {
    const aDate = new Date(String(a[dateField])).getTime();
    const bDate = new Date(String(b[dateField])).getTime();
    return direction === "desc" ? bDate - aDate : aDate - bDate;
  });
}
