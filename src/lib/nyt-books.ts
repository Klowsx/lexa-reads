import { getBookByIsbn } from '~/lib/google-books';
import type { Tables } from '~/types/database';

const NYT_KEY = process.env.EXPO_PUBLIC_NYT_API_KEY;

interface NYTBook {
  primary_isbn13: string;
  primary_isbn10: string;
}

interface NYTListResponse {
  results: {
    books: NYTBook[];
  };
}

export async function getNYTBestsellers(
  list = 'combined-print-and-e-book-fiction',
): Promise<Tables<'books'>[]> {
  const url = `https://api.nytimes.com/svc/books/v3/lists/current/${list}.json?api-key=${NYT_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const json = (await res.json()) as NYTListResponse;
  const books = json.results?.books ?? [];

  const results = await Promise.all(
    books.map((b) => getBookByIsbn(b.primary_isbn13 || b.primary_isbn10)),
  );
  return results.filter((b): b is Tables<'books'> => b !== null);
}
