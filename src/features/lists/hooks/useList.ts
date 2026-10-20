import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import { useAuthStore } from '~/stores/auth.store'
import { listQueryOptions } from '../list.queries'

// Separa la caché por lector y revalida los permisos al volver al detalle.
export function useList(slug: string) {
  const uid = useAuthStore((s) => s.user?.id ?? '')
  const query = useQuery({
    ...listQueryOptions(slug, uid),
    staleTime: 0,
    refetchOnMount: 'always' as const
  })
  const { refetch } = query
  useFocusEffect(
    useCallback(() => {
      if (slug) void refetch({ cancelRefetch: false })
    }, [slug, refetch])
  )
  return query
}
