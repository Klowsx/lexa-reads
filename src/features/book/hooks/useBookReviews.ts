import { useInfiniteQuery } from "@tanstack/react-query";
import { bookReviewsInfiniteOptions } from "../book.queries";

// Carga las reseñas de un libro de forma paginada usando cursor.
// Devuelve todas las páginas cargadas hasta el momento aplanadas en un array.
// hasNextPage / fetchNextPage permiten el botón "Cargar más" o scroll infinito.
export function useBookReviews(bookId: string) {
  const query = useInfiniteQuery(bookReviewsInfiniteOptions(bookId));

  // TanStack Query v5 almacena las páginas en query.data.pages.
  // Las aplanamos para que el componente reciba un array simple de reseñas.
  const reviews = query.data?.pages.flatMap((page) => page.rows) ?? [];

  return { ...query, reviews };
}
