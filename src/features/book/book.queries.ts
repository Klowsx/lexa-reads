import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { getBook, searchBooks } from "~/lib/google-books";
import { supabase } from "~/lib/supabase";
import { getNYTBestsellers } from "~/lib/nyt-books";
import type { Tables } from "~/types/database";
import type { UpsertReviewParams } from "~/types";

const TRENDING_THRESHOLD = 5;

async function fetchTrending(): Promise<{
  books: Tables<"books">[];
  source: "community" | "bestsellers";
}> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("user_books")
    .select("book_id, books(*)")
    .gte("created_at", since)
    .limit(50);

  const rows = (data ?? []).filter((r) => r.books);

  if (rows.length >= TRENDING_THRESHOLD) {
    const counts = new Map<string, number>();
    for (const r of rows) {
      counts.set(r.book_id, (counts.get(r.book_id) ?? 0) + 1);
    }

    const seen = new Set<string>();
    const books = rows
      .filter((r) => {
        if (seen.has(r.book_id)) return false;
        seen.add(r.book_id);
        return true;
      })
      .sort(
        (a, b) => (counts.get(b.book_id) ?? 0) - (counts.get(a.book_id) ?? 0),
      )
      .slice(0, 10)
      .map((r) => r.books as Tables<"books">);

    return { books, source: "community" };
  }

  const books = await getNYTBestsellers();
  return { books, source: "bestsellers" };
}

export const trendingBooksQueryOptions = () =>
  queryOptions({
    queryKey: ["books", "trending"],
    queryFn: fetchTrending,
    staleTime: 1000 * 60 * 30,
  });

export const bookQueryOptions = (googleBooksId: string) =>
  queryOptions({
    queryKey: ["book", googleBooksId],
    queryFn: () => getBook(googleBooksId),
    enabled: !!googleBooksId,
  });

export const searchBooksQueryOptions = (query: string) =>
  queryOptions({
    queryKey: ["books", "search", query],
    queryFn: () => searchBooks(query),
    enabled: query.length > 2,
  });

// ─── Reviews ──────────────────────────────────────────────────

// Una reseña enriquecida con los datos públicos del autor,
// usada en la lista de reseñas del libro.
export type ReviewWithUser = Tables<"reviews"> & {
  users: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

// Cursor para paginación por par (created_at, id).
// null significa "primera página, sin offset".
export type ReviewCursor = { createdAt: string; id: string } | null;

const REVIEWS_PAGE_SIZE = 10;

// Carga una página de reseñas publicadas para un libro dado.
// El par (created_at, id) como cursor evita offsets costosos en tablas grandes.
async function fetchBookReviews(
  bookId: string,
  cursor: ReviewCursor,
): Promise<{ rows: ReviewWithUser[]; nextCursor: ReviewCursor }> {
  let query = supabase
    .from("reviews")
    .select("*, users(id, username, display_name, avatar_url)")
    .eq("book_id", bookId)
    .eq("is_published", true)   // solo reseñas publicadas
    .is("deleted_at", null)     // excluir soft-deleted
    .order("created_at", { ascending: false })
    .order("id", { ascending: false }) // desempate para cursor estable
    .limit(REVIEWS_PAGE_SIZE);

  // Cursor-based pagination: solo filas anteriores al último ítem visto.
  // Equivale a WHERE (created_at, id) < (cursor.createdAt, cursor.id).
  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as ReviewWithUser[];

  // Si recibimos exactamente PAGE_SIZE filas, puede haber más.
  const nextCursor: ReviewCursor =
    rows.length === REVIEWS_PAGE_SIZE
      ? { createdAt: rows[rows.length - 1].created_at!, id: rows[rows.length - 1].id }
      : null;

  return { rows, nextCursor };
}

// infiniteQueryOptions (TanStack Query v5) para la lista paginada.
// pageParam = cursor de la última página cargada.
export const bookReviewsInfiniteOptions = (bookId: string) =>
  infiniteQueryOptions({
    queryKey: ["reviews", bookId] as const,
    queryFn: ({ pageParam }) =>
      fetchBookReviews(bookId, pageParam as ReviewCursor),
    initialPageParam: null as ReviewCursor,
    // Si la página anterior no devolvió cursor, no hay más páginas.
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!bookId,
  });

// Trae la reseña del usuario actual para un libro.
// Sirve para saber si ya existe (mostrar "Editar" vs "Crear")
// y para precargar el formulario de edición.
async function fetchMyReview(
  userId: string,
  bookId: string,
): Promise<Tables<"reviews"> | null> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .is("deleted_at", null) // una reseña borrada no cuenta como "existente"
    .maybeSingle();

  if (error) throw error;
  return data;
}

// queryKey separado de la lista paginada para que el optimistic update
// al crear/editar no rompa la paginación.
export const myReviewQueryOptions = (userId: string, bookId: string) =>
  queryOptions({
    queryKey: ["my_review", userId, bookId] as const,
    queryFn: () => fetchMyReview(userId, bookId),
    enabled: !!userId && !!bookId,
  });

// Crea una nueva reseña o edita una existente.
// reviewId presente → UPDATE; ausente → INSERT.
export async function upsertReviewFn(
  userId: string,
  params: UpsertReviewParams,
): Promise<Tables<"reviews">> {
  if (params.reviewId) {
    // Edición: actualiza texto, spoiler flag y edited_at.
    const { data, error } = await supabase
      .from("reviews")
      .update({
        body: params.body,
        contains_spoilers: params.containsSpoilers,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.reviewId)
      .eq("user_id", userId) // el usuario solo puede editar la suya
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Creación: is_published = true — el usuario siempre publica directamente.
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      user_id: userId,
      book_id: params.bookId,
      user_book_id: params.userBookId ?? null,
      body: params.body,
      contains_spoilers: params.containsSpoilers,
      is_published: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Soft delete: pone deleted_at en vez de borrar la fila.
// Así se mantiene la integridad referencial con activity_feed y review_likes.
export async function deleteReviewFn(
  userId: string,
  reviewId: string,
): Promise<void> {
  const { error } = await supabase
    .from("reviews")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", reviewId)
    .eq("user_id", userId); // solo el autor puede borrar
  if (error) throw error;
}
