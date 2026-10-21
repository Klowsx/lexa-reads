import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCommunityBook } from '../catalog.queries'

// Crea la ficha compartida y refresca descubrimiento y búsquedas tras guardarla.
export function useCreateBook() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: Parameters<typeof createCommunityBook>) =>
      createCommunityBook(...input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['books'] })
    }
  })
}
