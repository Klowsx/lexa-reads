import { useInfiniteQuery } from '@tanstack/react-query'
import {
  commentsInfiniteOptions,
  type CommentTargetType
} from '../feed.queries'

// Espera al permiso del padre y al consentimiento para ver un hilo que contiene spoilers.
export function useComments(
  targetType: CommentTargetType,
  targetId: string,
  enabled = true
) {
  return useInfiniteQuery(
    commentsInfiniteOptions(targetType, targetId, enabled)
  )
}
