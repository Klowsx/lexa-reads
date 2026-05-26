import { queryOptions } from "@tanstack/react-query";
import { getBook, searchBooks } from "~/lib/google-books";
import { supabase } from "~/lib/supabase";
import { getNYTBestsellers } from "~/lib/nyt-books";
import type { Tables } from "~/types/database";

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
