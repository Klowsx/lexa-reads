import { useInfiniteQuery } from '@tanstack/react-query'
import { catalogInfiniteOptions, type CatalogFilters } from '../catalog.queries'

// Mantiene la consulta paginada del catálogo fuera de la pantalla.
export function useCatalogBooks(filters: CatalogFilters, enabled: boolean) {
  return useInfiniteQuery(catalogInfiniteOptions(filters, enabled))
}
