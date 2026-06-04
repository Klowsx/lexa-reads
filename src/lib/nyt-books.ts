import { getBookByIsbn } from '~/lib/google-books';
import { supabase } from '~/lib/supabase';
import type { Tables } from '~/types/database';

// NEW-4 (auditoría): la API key de NYT ya NO vive en el cliente. Esta función
// invoca la Edge Function `nyt-bestsellers` (que guarda la key como secret del
// servidor y devuelve solo los ISBNs), y luego resuelve cada ISBN con el flujo
// cache-first de google-books.ts. Así no se expone ninguna key en el bundle.

export async function getNYTBestsellers(
  list = 'combined-print-and-e-book-fiction',
): Promise<Tables<'books'>[]> {
  const { data, error } = await supabase.functions.invoke<{ isbns: string[] }>(
    'nyt-bestsellers',
    { body: { list } },
  );
  if (error || !data?.isbns?.length) return [];

  const results = await Promise.all(data.isbns.map((isbn) => getBookByIsbn(isbn)));
  return results.filter((b): b is Tables<'books'> => b !== null);
}
