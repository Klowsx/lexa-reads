import { useQuery } from "@tanstack/react-query";
import { listQueryOptions } from "../list.queries";

export function useList(slug: string) {
  return useQuery(listQueryOptions(slug));
}
