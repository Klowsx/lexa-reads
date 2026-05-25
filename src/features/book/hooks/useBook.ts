import { getBook } from "~/lib/google-books";
import { queryOptions, useQuery } from "@tanstack/react-query";

export const bookQueryOptions = (googleBooksId: string) =>
  queryOptions({
    queryKey: ["Book", googleBooksId],
    queryFn: () => getBook(googleBooksId),
    enabled: !!googleBooksId,
  });

export function useBook(googleBooksId: string) {
  return useQuery(bookQueryOptions(googleBooksId));
}
