import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth.store";
import type { Database } from "~/types/database";
import { libraryQueryOptions } from "../library.queries";

// Tipo corto para no repetir el path largo en los parámetros
type UserBookStatus = Database["public"]["Enums"]["user_book_status"];

// Recibe el estado como parámetro porque la pantalla de biblioteca
// tiene 4 tabs (Leyendo / Leído / Quiero leer / Abandonado) y cada
// tab llama a este hook con su estado — cada uno tiene su cache propio.
//
// El dato que retorna tiene esta forma:
// {
//   id, status, rating, started_at, finished_at, tags, ...  ← de user_books
//   books: { id, title, cover_url, authors, ... } | null    ← del JOIN
// }[]
export function useLibrary(status: UserBookStatus) {
  const userId = useAuthStore((s) => s.user?.id ?? "");
  return useQuery(libraryQueryOptions(userId, status));
}
