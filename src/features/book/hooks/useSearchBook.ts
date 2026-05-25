import { searchBooks } from "@/src/lib/google-books";
import { queryOptions, useQuery } from "@tanstack/react-query";

export const searchBookQueryOptions = (query: string) =>
  queryOptions({
    queryKey: ["books", "search", query],
    queryFn: () => searchBooks(query),
    enabled: query.length > 2, // No buscar menos de 3 chars
  });

export function useSearchBooks(query: string) {
  return useQuery(searchBookQueryOptions(query));
}
