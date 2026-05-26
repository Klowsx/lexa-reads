import { useQuery } from "@tanstack/react-query";
import { trendingBooksQueryOptions } from "../book.queries";

export function useTrendingBooks() {
  return useQuery(trendingBooksQueryOptions());
}
