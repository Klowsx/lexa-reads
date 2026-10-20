import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { supabase } from '~/lib/supabase'

const PAGE_SIZE = 20

export type NotificationType =
  | 'new_follower'
  | 'review_like'
  | 'activity_like'
  | 'comment_received'
  | 'reading_challenge_completed'
  | 'recommendation_received'

export type NotificationItem = {
  id: string
  type: NotificationType
  read_at: string | null
  created_at: string
  reference_id: string | null
  reference_type: string | null
  actor: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

type NotificationPage = {
  items: NotificationItem[]
  nextCursor: string | null
}

const ACTOR_COLS = 'id, username, display_name, avatar_url'

async function fetchNotifications(
  userId: string,
  cursor?: string
): Promise<NotificationPage> {
  let query = supabase
    .from('notifications')
    .select(
      `id, type, read_at, created_at, reference_id, reference_type,
       actor:users!notifications_actor_id_fkey(${ACTOR_COLS})`
    )
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (cursor) query = query.lt('created_at', cursor)

  const { data, error } = await query
  if (error) throw error

  const items: NotificationItem[] = (data ?? []).map((row: any) => ({
    id: row.id,
    type: row.type as NotificationType,
    read_at: row.read_at,
    created_at: row.created_at,
    reference_id: row.reference_id,
    reference_type: row.reference_type,
    actor: Array.isArray(row.actor) ? (row.actor[0] ?? null) : row.actor
  }))

  return {
    items,
    nextCursor:
      items.length === PAGE_SIZE
        ? (items[items.length - 1].created_at ?? null)
        : null
  }
}

export function notificationsQueryOptions(userId: string) {
  return infiniteQueryOptions({
    queryKey: ['notifications', userId],
    queryFn: ({ pageParam }) =>
      fetchNotifications(userId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!userId
  })
}

export async function markAllNotificationsReadFn(
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', userId)
    .is('read_at', null)
  if (error) throw error
}

async function fetchUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .is('read_at', null)
  if (error) throw error
  return count ?? 0
}

export function unreadCountQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ['notifications-unread', userId],
    queryFn: () => fetchUnreadCount(userId),
    enabled: !!userId,
    refetchInterval: 60_000
  })
}
