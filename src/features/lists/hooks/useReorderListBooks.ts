import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reorderListBooksFn } from '../list.queries'

export function useReorderListBooks(slug: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: { id: string; position: number }[]) =>
      reorderListBooksFn(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists', 'slug', slug] })
    }
  })
}
