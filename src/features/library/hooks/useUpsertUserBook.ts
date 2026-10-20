import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import type { Tables, UpsertUserBookParams } from '~/types'
import {
  readingRecordMutationOptions,
  upsertUserBookFn,
  userBookQueryOptions
} from '../library.queries'
import { projectReadingRecord } from '../reading-record'
import { refreshReadingQueries } from '../reading-cache'

// Proyecta la edición, revierte ante errores y sincroniza metas y biblioteca con la fila del servidor.
export function useUpsertUserBook(bookId: string) {
  const client = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id ?? '')
  const queryKey = userBookQueryOptions(userId, bookId).queryKey
  return useMutation({
    ...readingRecordMutationOptions(userId, bookId),
    mutationFn: (params: UpsertUserBookParams) =>
      upsertUserBookFn(userId, params),
    onMutate: async (params) => {
      await client.cancelQueries({ queryKey })
      const snapshot = client.getQueryData<Tables<'user_books'> | null>(
        queryKey
      )
      client.setQueryData(
        queryKey,
        projectReadingRecord(snapshot, params, userId)
      )
      return { snapshot }
    },
    onError: (_error, _params, context) => {
      client.setQueryData(queryKey, context?.snapshot ?? null)
    },
    onSuccess: (record) => {
      client.setQueryData(queryKey, record)
    },
    onSettled: () => refreshReadingQueries(client, userId, bookId)
  })
}
