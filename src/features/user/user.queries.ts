import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { supabase } from '~/lib/supabase'
import type { Tables } from '~/types'
import type {
  ProfileData,
  UpdateProfileData,
  UserProfile,
  OnboardingPreferences
} from '~/types/user'
import type { LibraryRow } from '~/features/library/library.queries'

// Reading goal

export type ReadingGoalData = {
  goal: number
  goalYear: number
  booksRead: number
}

// Cuenta solo finalizaciones del año consultado; la fecha de edición no afecta la meta.
async function fetchReadingGoal(
  userId: string,
  currentYear: number
): Promise<ReadingGoalData> {
  const [userResult, booksResult] = await Promise.all([
    supabase
      .from('users')
      .select('reading_goal, reading_goal_year')
      .eq('id', userId)
      .single(),
    supabase
      .from('user_books')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'read')
      .gte('finished_at', `${currentYear}-01-01`)
      .lte('finished_at', `${currentYear}-12-31`)
  ])

  if (userResult.error) throw userResult.error
  if (booksResult.error) throw booksResult.error

  return {
    goal:
      userResult.data.reading_goal_year === currentYear
        ? (userResult.data.reading_goal ?? 12)
        : 12,
    goalYear: currentYear,
    booksRead: booksResult.count ?? 0
  }
}

// Incluye el año en caché para no reutilizar el progreso anterior al cambiar de calendario.
export const readingGoalQueryOptions = (
  userId: string,
  year = new Date().getFullYear()
) =>
  queryOptions({
    queryKey: ['reading_goal', userId, year],
    queryFn: () => fetchReadingGoal(userId, year),
    enabled: !!userId
  })

export async function updateReadingGoalFn(
  userId: string,
  goal: number
): Promise<Pick<Tables<'users'>, 'reading_goal' | 'reading_goal_year'>> {
  const currentYear = new Date().getFullYear()
  const { data, error } = await supabase
    .from('users')
    .update({ reading_goal: goal, reading_goal_year: currentYear })
    .eq('id', userId)
    .select('reading_goal, reading_goal_year')
    .single()
  if (error) throw error
  return data
}

// Own profile (by userId)

const PROFILE_COLUMNS =
  'id, username, display_name, avatar_url, bio, favorite_genres, books_read_count, reviews_count, followers_count, following_count, is_private, reading_goal, reading_goal_year, onboarding_completed, onboarding_step, created_at'

async function fetchMe(userId: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('users')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .is('deleted_at', null)
    .single()
  if (error) throw error
  return data as UserProfile
}

export const meQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['me', userId],
    queryFn: () => fetchMe(userId),
    enabled: !!userId
  })

// Public profile (by username)

// Recupera la identidad visible y comprueba cada consulta de relación antes de conceder acceso en la UI.
async function fetchProfile(
  username: string,
  currentUserId?: string
): Promise<ProfileData | null> {
  const { data: profile, error } = await supabase
    .from('users')
    .select(PROFILE_COLUMNS)
    .eq('username', username)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  if (!profile) return null

  let follow_status: 'accepted' | 'pending' | null = null
  let is_blocked_by_me = false

  if (currentUserId && currentUserId !== profile.id) {
    const [followResult, blockResult] = await Promise.all([
      supabase
        .from('follows')
        .select('id, status')
        .eq('follower_id', currentUserId)
        .eq('following_id', profile.id)
        .maybeSingle(),
      supabase
        .from('user_blocks')
        .select('id')
        .eq('blocker_id', currentUserId)
        .eq('blocked_id', profile.id)
        .maybeSingle()
    ])

    if (followResult.error) throw followResult.error
    if (blockResult.error) throw blockResult.error
    follow_status =
      (followResult.data?.status as 'accepted' | 'pending' | null) ?? null
    is_blocked_by_me = !!blockResult.data
  }

  return {
    ...(profile as UserProfile),
    follow_status,
    is_following: follow_status === 'accepted',
    is_blocked_by_me
  }
}

export const profileQueryOptions = (username: string, currentUserId?: string) =>
  queryOptions({
    queryKey: ['profile', username, currentUserId],
    queryFn: () => fetchProfile(username, currentUserId),
    enabled: !!username
  })

// Profile update

export async function updateProfileFn(
  userId: string,
  data: UpdateProfileData
): Promise<UserProfile> {
  const { data: updated, error } = await supabase
    .from('users')
    .update(data)
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .single()
  if (error) throw error
  return updated as UserProfile
}

// Guarda las preferencias intermedias para que el onboarding pueda reanudarse tras cerrar la aplicación.
export async function saveOnboardingPreferencesFn(
  userId: string,
  data: OnboardingPreferences
): Promise<UserProfile> {
  const currentYear = new Date().getFullYear()
  const { data: updated, error } = await supabase
    .from('users')
    .update({
      favorite_genres: data.favoriteGenres,
      reading_goal: data.readingGoal,
      reading_goal_year: currentYear,
      onboarding_step: data.nextStep
    })
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .single()

  if (error) throw error
  return updated as UserProfile
}

// Follow / Unfollow

// El servidor decide si el seguimiento se acepta o queda pendiente según la privacidad actual.
export async function followFn(followerId: string, followingId: string) {
  const { data, error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId })
    .select('status')
    .single()
  if (error) throw error
  return data.status
}

// Retira un seguimiento aceptado o cancela una solicitud propia.
export async function unfollowFn(
  followerId: string,
  followingId: string
): Promise<void> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
  if (error) throw error
}

// Followers / Following lists (paginadas)

const FOLLOW_USER_COLUMNS =
  'id, username, display_name, avatar_url, bio, followers_count, following_count, books_read_count, is_private'

const PAGE_SIZE = 30

export type FollowUser = {
  follow_id: string
  created_at: string | null
  user: Pick<
    UserProfile,
    | 'id'
    | 'username'
    | 'display_name'
    | 'avatar_url'
    | 'bio'
    | 'followers_count'
    | 'following_count'
    | 'books_read_count'
    | 'is_private'
  >
}

export type FollowListPage = {
  items: FollowUser[]
  nextCursor: FollowCursor | null
}

type FollowCursor = { createdAt: string; id: string }

// Consulta solamente relaciones aceptadas y resuelve empates con un cursor compuesto.
async function fetchConnections(
  userId: string,
  kind: 'followers' | 'following',
  cursor?: FollowCursor
): Promise<FollowListPage> {
  const followers = kind === 'followers'
  const relation = followers
    ? 'follows_follower_id_fkey'
    : 'follows_following_id_fkey'
  let query = supabase
    .from('follows')
    .select(`id, created_at, person:users!${relation}(${FOLLOW_USER_COLUMNS})`)
    .eq(followers ? 'following_id' : 'follower_id', userId)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(PAGE_SIZE + 1)
  if (cursor)
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
    )
  const { data, error } = await query
  if (error) throw error
  const rows = (data ?? []) as unknown as {
    id: string
    created_at: string
    person: FollowUser['user'] | null
  }[]
  const visible = rows.slice(0, PAGE_SIZE)
  const last = visible.at(-1)
  return {
    items: visible.flatMap((row) =>
      row.person
        ? [{ follow_id: row.id, created_at: row.created_at, user: row.person }]
        : []
    ),
    nextCursor:
      rows.length > PAGE_SIZE && last
        ? { createdAt: last.created_at, id: last.id }
        : null
  }
}

// Mantiene cachés separadas de seguidores y seguidos, con el mismo contrato de paginación.
export const followersInfiniteOptions = (userId: string) =>
  infiniteQueryOptions({
    queryKey: ['followers', userId],
    initialPageParam: undefined as FollowCursor | undefined,
    queryFn: ({ pageParam }) =>
      fetchConnections(userId, 'followers', pageParam),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: !!userId
  })
export const followingInfiniteOptions = (userId: string) =>
  infiniteQueryOptions({
    queryKey: ['following', userId],
    initialPageParam: undefined as FollowCursor | undefined,
    queryFn: ({ pageParam }) =>
      fetchConnections(userId, 'following', pageParam),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: !!userId
  })

// Pending follow requests (solicitudes recibidas)

export type PendingRequest = {
  follow_id: string
  created_at: string | null
  requester: Pick<
    UserProfile,
    | 'id'
    | 'username'
    | 'display_name'
    | 'avatar_url'
    | 'bio'
    | 'followers_count'
    | 'is_private'
  >
}

// Recupera solicitudes recibidas sin exponer relaciones pendientes a terceros.
async function fetchPendingRequests(userId: string): Promise<PendingRequest[]> {
  const { data, error } = await supabase
    .from('follows')
    .select(
      `id, created_at, requester:users!follows_follower_id_fkey(id, username, display_name, avatar_url, bio, followers_count, is_private)`
    )
    .eq('following_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? [])
    .map((row: any) => ({
      follow_id: row.id,
      created_at: row.created_at,
      requester: row.requester
    }))
    .filter((row) => row.requester)
}

export const pendingRequestsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['follow_requests', userId],
    queryFn: () => fetchPendingRequests(userId),
    enabled: !!userId
  })

// Aprueba una solicitud recibida; exige una fila para detectar permisos perdidos o solicitudes retiradas.
export async function acceptFollowFn(followId: string): Promise<void> {
  const { error } = await supabase
    .from('follows')
    .update({ status: 'accepted' })
    .eq('id', followId)
    .select('id')
    .single()
  if (error) throw error
}

// Rechaza una solicitud recibida sin modificar los contadores de seguimientos aceptados.
export async function rejectFollowFn(followId: string): Promise<void> {
  const { error } = await supabase.from('follows').delete().eq('id', followId)
  if (error) throw error
}

// User recent reads (for other user profiles)

async function fetchUserRecentReads(userId: string): Promise<LibraryRow[]> {
  const { data, error } = await supabase
    .from('user_books')
    .select('*, books(*)')
    .eq('user_id', userId)
    .eq('status', 'read')
    .order('finished_at', { ascending: false, nullsFirst: false })
    .limit(8)
  if (error) throw error
  return (data ?? []) as LibraryRow[]
}

export const userRecentReadsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['user_recent_reads', userId],
    queryFn: () => fetchUserRecentReads(userId),
    enabled: !!userId
  })

// User search

export type SearchUser = Pick<
  UserProfile,
  | 'id'
  | 'username'
  | 'display_name'
  | 'avatar_url'
  | 'bio'
  | 'followers_count'
  | 'is_private'
  | 'books_read_count'
>

const USER_SEARCH_COLUMNS =
  'id, username, display_name, avatar_url, bio, followers_count, is_private, books_read_count'

async function fetchSearchUsers(q: string): Promise<SearchUser[]> {
  let query = supabase
    .from('users')
    .select(USER_SEARCH_COLUMNS)
    .is('deleted_at', null)
    .order('followers_count', { ascending: false })
    .limit(q.length >= 1 ? 20 : 5)

  if (q.length >= 1) {
    query = query.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as SearchUser[]
}

export const searchUsersQueryOptions = (q: string) =>
  queryOptions({
    queryKey: ['search_users', q],
    queryFn: () => fetchSearchUsers(q),
    staleTime: q.length >= 1 ? 30_000 : 5 * 60_000
  })

// Propone perfiles públicos activos para que una cuenta nueva no empiece con un feed vacío.
async function fetchOnboardingSuggestions(
  userId: string
): Promise<SearchUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select(USER_SEARCH_COLUMNS)
    .neq('id', userId)
    .is('deleted_at', null)
    .not('username', 'is', null)
    .order('followers_count', { ascending: false })
    .limit(6)
  if (error) throw error
  return (data ?? []) as SearchUser[]
}

// Mantiene una caché breve de sugerencias para no repetir la consulta al reanudar el último paso.
export const onboardingSuggestionsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['onboarding_suggestions', userId],
    queryFn: () => fetchOnboardingSuggestions(userId),
    enabled: !!userId,
    staleTime: 5 * 60_000
  })

// ── Bloqueos ──────────────────────────────────────────────────

export type BlockedUser = {
  id: string
  created_at: string
  blocked: Pick<UserProfile, 'id' | 'username' | 'display_name' | 'avatar_url'>
}

export async function blockUserFn(
  blockerId: string,
  blockedId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_blocks')
    .insert({ blocker_id: blockerId, blocked_id: blockedId })
  if (error) throw error
}

export async function unblockUserFn(
  blockerId: string,
  blockedId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
  if (error) throw error
}

async function fetchBlockedUsers(userId: string): Promise<BlockedUser[]> {
  const { data, error } = await supabase
    .from('user_blocks')
    .select(
      'id, created_at, blocked:users!blocked_id(id, username, display_name, avatar_url)'
    )
    .eq('blocker_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as BlockedUser[]
}

export const blockedUsersQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['blocked-users', userId],
    queryFn: () => fetchBlockedUsers(userId),
    enabled: !!userId
  })

// ── Reportes ──────────────────────────────────────────────────

export type ReportTargetType =
  'review' | 'comment' | 'user' | 'list' | 'activity' | 'message' | 'club'

export async function createReportFn(params: {
  reporterId: string
  targetType: ReportTargetType
  targetId: string
  reason: string
  details?: string
}): Promise<void> {
  const { error } = await supabase.from('reports').insert({
    reporter_id: params.reporterId,
    target_type: params.targetType,
    target_id: params.targetId,
    reason: params.reason,
    details: params.details ?? null
  })
  if (error) throw error
}

// ── Eliminación de cuenta ──────────────────────────────────────

export type DeletionRequest = {
  id: string
  requested_at: string
  scheduled_delete_at: string
}

async function fetchDeletionRequest(
  userId: string
): Promise<DeletionRequest | null> {
  const { data, error } = await supabase
    .from('account_deletion_requests')
    .select('id, requested_at, scheduled_delete_at')
    .eq('user_id', userId)
    .is('cancelled_at', null)
    .maybeSingle()
  if (error) throw error
  return data as DeletionRequest | null
}

export const accountDeletionQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['account_deletion', userId],
    queryFn: () => fetchDeletionRequest(userId),
    enabled: !!userId
  })

export async function cancelAccountDeletionFn(
  requestId: string
): Promise<void> {
  const { error } = await supabase
    .from('account_deletion_requests')
    .update({ cancelled_at: new Date().toISOString() })
    .eq('id', requestId)
  if (error) throw error
}

// ── Preferencias de notificación ───────────────────────────────

export type NotificationPreferences = {
  user_id: string
  push_new_follower: boolean
  push_activity_like: boolean
  push_review_like: boolean
  push_comment: boolean
  push_recommendation: boolean
  push_dm: boolean
  push_club: boolean
  email_weekly_digest: boolean
  consent_given_at: string | null
  push_token: string | null
  updated_at: string
}

async function fetchNotificationPreferences(
  userId: string
): Promise<NotificationPreferences | null> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data as NotificationPreferences | null
}

export const notificationPreferencesQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['notification_preferences', userId],
    queryFn: () => fetchNotificationPreferences(userId),
    enabled: !!userId
  })

export async function upsertNotificationPreferencesFn(
  userId: string,
  data: Partial<Omit<NotificationPreferences, 'user_id' | 'updated_at'>> & {
    markConsent?: boolean
  }
): Promise<void> {
  const { markConsent, ...prefs } = data
  const payload = {
    user_id: userId,
    ...prefs,
    ...(markConsent ? { consent_given_at: new Date().toISOString() } : {})
  }
  const { error } = await supabase
    .from('notification_preferences')
    .upsert(payload)
  if (error) throw error
}
