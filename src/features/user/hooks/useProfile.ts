import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import { useAuthStore } from '~/stores/auth.store'
import {
  profileQueryOptions,
  userRecentReadsQueryOptions
} from '../user.queries'
import { userListsQueryOptions } from '~/features/lists/list.queries'

// Comprueba identidad y relación de seguimiento para el lector que tiene la sesión activa.
export function useProfile(username: string) {
  const currentUserId = useAuthStore((s) => s.user?.id)
  const query = useQuery({
    ...profileQueryOptions(username, currentUserId),
    staleTime: 0,
    refetchOnMount: 'always'
  })
  // Revalida al regresar de otra pantalla sin cancelar una comprobación que ya esté en curso.
  const { refetch } = query
  useFocusEffect(
    useCallback(() => {
      if (username) void refetch({ cancelRefetch: false })
    }, [username, refetch])
  )
  return query
}

// No consulta lecturas ni listas protegidas hasta que la relación permite abrirlas.
export function useProfileContent(userId: string, visible: boolean) {
  const recentReads = useQuery({
    ...userRecentReadsQueryOptions(userId),
    enabled: !!userId && visible
  })
  const lists = useQuery({
    ...userListsQueryOptions(userId),
    enabled: !!userId && visible
  })
  return { recentReads, lists }
}
