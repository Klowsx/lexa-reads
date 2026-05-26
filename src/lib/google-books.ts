// ============================================================
// google-books.ts
// Única puerta de entrada a la API de Google Books.
// Regla: siempre busca primero en la DB local (caché). Si no
// encuentra el libro, lo trae de la API, lo guarda en la DB y
// lo retorna. Las pantallas nunca llaman a la API directamente.
// ============================================================

import { supabase } from "~/lib/supabase";
import type { Tables, TablesInsert } from "~/types/database";

// ── Tipos de la respuesta de la API de Google Books ─────────

type BookRow = Tables<"books">;

// Solo mapeamos los campos que nos interesan de la respuesta
interface GBVolume {
  id: string; // ID único de Google Books (ej. "zyTCAlFPjgYC")
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    industryIdentifiers?: Array<{
      type: "ISBN_10" | "ISBN_13" | string;
      identifier: string;
    }>;
    pageCount?: number;
    categories?: string[]; // va a la columna "genres"
    language?: string;
    publishedDate?: string; // puede ser "2001" o "2001-05-28"
    publisher?: string;
  };
}

interface GBSearchResponse {
  totalItems: number;
  items?: GBVolume[];
}

// ── URL base y API key (opcional) ────────────────────────────

const BASE_URL = "https://www.googleapis.com/books/v1";
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;

// Construye la query string agregando la key solo si existe
function buildParams(extra: Record<string, string | number>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(extra)) {
    params.set(k, String(v));
  }
  if (API_KEY) params.set("key", API_KEY);
  return params.toString();
}

// ── Conversión: respuesta API → fila de la tabla books ───────

// Paso interno: transforma un GBVolume en el objeto que
// insertamos en Supabase (TablesInsert<"books">).
function mapVolumeToRow(volume: GBVolume): TablesInsert<"books"> {
  const v = volume.volumeInfo;

  // Paso 1: extraer ISBN-10 e ISBN-13 del array de identificadores
  const isbn10 =
    v.industryIdentifiers?.find((i) => i.type === "ISBN_10")?.identifier ??
    null;
  const isbn13 =
    v.industryIdentifiers?.find((i) => i.type === "ISBN_13")?.identifier ??
    null;

  // Paso 2: limpiar la URL de la portada
  // Google Books devuelve URLs con http:// y un parámetro &edge=curl
  // que agrega una esquina doblada. Lo removemos para tener la imagen limpia.
  const rawCover =
    v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail ?? null;
  const coverUrl = rawCover
    ? rawCover.replace("http://", "https://").replace("&edge=curl", "")
    : null;

  // Paso 3: armar el objeto con los campos de la tabla
  return {
    google_books_id: volume.id,
    title: v.title,
    authors: v.authors ?? [],
    description: v.description ?? null,
    cover_url: coverUrl,
    isbn_10: isbn10,
    isbn_13: isbn13,
    page_count: v.pageCount ?? null,
    genres: v.categories ?? [],
    language: v.language ?? null,
    published_date: v.publishedDate ?? null,
    publisher: v.publisher ?? null,
  };
}

// ── Helpers para llamar a la API externa ─────────────────────

// Paso interno: llama a la API de Google Books para obtener
// un volumen específico por su ID.
async function fetchVolumeFromApi(
  googleBooksId: string,
): Promise<GBVolume | null> {
  const params = buildParams({});
  const url = `${BASE_URL}/volumes/${googleBooksId}?${params}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json() as Promise<GBVolume>;
}

// Paso interno: llama a la API de Google Books con un texto de
// búsqueda libre (título, autor, ISBN, etc.) y retorna hasta
// maxResults volúmenes.
async function fetchSearchFromApi(
  query: string,
  maxResults = 10,
): Promise<GBVolume[]> {
  const params = buildParams({ q: query, maxResults });
  const url = `${BASE_URL}/volumes?${params}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = (await res.json()) as GBSearchResponse;
  return json.items ?? [];
}

// Paso interno: guarda un array de volúmenes en la tabla local.
// Usa upsert para no fallar si el libro ya existe (race condition).
async function upsertBooks(volumes: GBVolume[]): Promise<BookRow[]> {
  if (volumes.length === 0) return [];
  const rows = volumes.map(mapVolumeToRow);
  const { data, error } = await supabase
    .from("books")
    .upsert(rows, { onConflict: "google_books_id" })
    .select();
  if (error) throw error;
  return data ?? [];
}

// ── Deduplicación de ediciones ───────────────────────────────

function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

function scoreBook(book: BookRow): number {
  return (
    (book.cover_url ? 3 : 0) +
    (book.description ? 2 : 0) +
    (book.page_count ? 1 : 0) +
    ((book.genres?.length ?? 0) > 0 ? 1 : 0)
  );
}

// Por cada combinación (título + primer autor) conserva la edición
// con más datos completos. Esto evita duplicados por edición ilustrada,
// bolsillo, ebook, etc.
function deduplicateBooks(books: BookRow[]): BookRow[] {
  const best = new Map<string, BookRow>();
  for (const book of books) {
    const key = `${normalize(book.title)}|${normalize(book.authors?.[0] ?? '')}`;
    const current = best.get(key);
    if (!current || scoreBook(book) > scoreBook(current)) {
      best.set(key, book);
    }
  }
  return Array.from(best.values());
}

// ── API pública del módulo ────────────────────────────────────

/**
 * Busca libros por texto libre (título, autor, frase, etc.).
 *
 * Paso 1: busca en la tabla local con pg_trgm (rápido, sin quota).
 * Paso 2: si hay menos de `minLocalResults` resultados locales,
 *         complementa con la API de Google Books.
 * Paso 3: inserta los libros nuevos en la DB y retorna todo junto.
 */
export async function searchBooks(
  query: string,
  {
    maxResults = 10,
    minLocalResults = 3,
  }: { maxResults?: number; minLocalResults?: number } = {},
): Promise<BookRow[]> {
  // Paso 1: buscar en la DB local por título usando el índice GIN pg_trgm.
  // No filtramos por authors porque `cs` es containment exacto y no sirve
  // para búsquedas parciales; la API de Google Books cubre ese caso.
  const { data: localResults } = await supabase
    .from("books")
    .select("*")
    .ilike("title", `%${query}%`)
    .limit(maxResults);

  // Si ya tenemos suficientes resultados locales, los retornamos
  // sin gastar quota de la API externa.
  if ((localResults?.length ?? 0) >= minLocalResults) {
    return localResults ?? [];
  }

  // Paso 2: complementar con la API de Google Books
  const apiVolumes = await fetchSearchFromApi(query, maxResults);

  // Paso 3: filtrar solo los que no están ya en la DB local
  const localIds = new Set(localResults?.map((b) => b.google_books_id) ?? []);
  const newVolumes = apiVolumes.filter((v) => !localIds.has(v.id));

  // Paso 4: guardar los libros nuevos en la DB
  const newRows = await upsertBooks(newVolumes);

  // Paso 5: combinar, deduplicar por obra y limitar
  const combined = [...(localResults ?? []), ...newRows];
  return deduplicateBooks(combined).slice(0, maxResults);
}

/**
 * Obtiene un libro por su ID de Google Books.
 *
 * Paso 1: busca en la tabla local por google_books_id.
 * Paso 2: si no está en caché, lo trae de la API.
 * Paso 3: guarda el libro en la DB para futuras consultas.
 * Paso 4: retorna el libro, o null si no existe.
 */
export async function getBook(googleBooksId: string): Promise<BookRow | null> {
  // Paso 1: consultar la caché local primero
  const { data: cached } = await supabase
    .from("books")
    .select("*")
    .eq("google_books_id", googleBooksId)
    .single();

  if (cached) return cached;

  // Paso 2: no estaba en caché → llamar a la API de Google Books
  const volume = await fetchVolumeFromApi(googleBooksId);
  if (!volume) return null;

  // Paso 3: guardar en la DB (upsert por si hay race condition)
  const [saved] = await upsertBooks([volume]);
  return saved ?? null;
}

/**
 * Obtiene un libro por ISBN (10 o 13 dígitos).
 * Útil para el flujo de escaneo de código de barras.
 *
 * Paso 1: busca en la tabla local por isbn_10 o isbn_13.
 * Paso 2: si no está en caché, busca en la API usando "isbn:{código}".
 * Paso 3: guarda el resultado en la DB y lo retorna.
 */
export async function getBookByIsbn(isbn: string): Promise<BookRow | null> {
  // Paso 1: buscar en caché local (puede estar guardado de antes)
  const { data: cached } = await supabase
    .from("books")
    .select("*")
    .or(`isbn_10.eq.${isbn},isbn_13.eq.${isbn}`)
    .maybeSingle();

  if (cached) return cached;

  // Paso 2: la API de Google Books acepta búsquedas por ISBN
  // usando el prefijo "isbn:" en el parámetro q.
  const volumes = await fetchSearchFromApi(`isbn:${isbn}`, 1);
  if (volumes.length === 0) return null;

  // Paso 3: guardar en la DB y retornar
  const [saved] = await upsertBooks([volumes[0]]);
  return saved ?? null;
}
