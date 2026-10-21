import { useQuery } from '@tanstack/react-query'
import type { Tables } from '~/types/database'
import { similarBooksQueryOptions } from '../catalog.queries'

// Comparte la consulta de libros similares con la ficha de detalle.
export function useSimilarBooks(book: Tables<'books'>) {
  return useQuery(similarBooksQueryOptions(book))
}
