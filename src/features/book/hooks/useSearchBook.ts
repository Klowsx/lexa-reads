import { useQuery } from "@tanstack/react-query";
import { searchBooksQueryOptions } from "../book.queries";

export function useSearchBooks(query: string) {
  return useQuery(searchBooksQueryOptions(query));
}
