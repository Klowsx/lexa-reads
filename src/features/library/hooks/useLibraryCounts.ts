import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth.store";
import { libraryCountsQueryOptions } from "../library.queries";

// Retorna cuántos libros tiene el usuario en cada estado.
// Se usa en LibraryTabs para mostrar los números sobre cada tab.
export function useLibraryCounts() {
  const userId = useAuthStore((s) => s.user?.id ?? "");
  return useQuery(libraryCountsQueryOptions(userId));
}
