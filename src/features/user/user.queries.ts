import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import type { Tables } from "~/types";
import type { ProfileData, UpdateProfileData, UserProfile } from "~/types/user";
import type { LibraryRow } from "~/features/library/library.queries";

// Reading goal

export type ReadingGoalData = {
  goal: number;
  goalYear: number;
  booksRead: number;
};

async function fetchReadingGoal(userId: string): Promise<ReadingGoalData> {
  const currentYear = new Date().getFullYear();

  const [userResult, booksResult] = await Promise.all([
    supabase
      .from("users")
      .select("reading_goal, reading_goal_year")
      .eq("id", userId)
      .single(),
    supabase
      .from("user_books")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "read")
      .gte("finished_at", `${currentYear}-01-01`)
      .lte("finished_at", `${currentYear}-12-31`),
  ]);

  if (userResult.error) throw userResult.error;
  if (booksResult.error) throw booksResult.error;

  return {
    goal: userResult.data.reading_goal ?? 12,
    goalYear: userResult.data.reading_goal_year ?? currentYear,
    booksRead: booksResult.count ?? 0,
  };
}

export const readingGoalQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["reading_goal", userId],
    queryFn: () => fetchReadingGoal(userId),
    enabled: !!userId,
  });

export async function updateReadingGoalFn(
  userId: string,
  goal: number,
): Promise<Pick<Tables<"users">, "reading_goal" | "reading_goal_year">> {
  const currentYear = new Date().getFullYear();
  const { data, error } = await supabase
    .from("users")
    .update({ reading_goal: goal, reading_goal_year: currentYear })
    .eq("id", userId)
    .select("reading_goal, reading_goal_year")
    .single();
  if (error) throw error;
  return data;
}

// Own profile (by userId)

const PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, bio, favorite_genres, books_read_count, reviews_count, followers_count, following_count, is_private, reading_goal, reading_goal_year, onboarding_completed, created_at";

async function fetchMe(userId: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("users")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .is("deleted_at", null)
    .single();
  if (error) throw error;
  return data as UserProfile;
}

export const meQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["me", userId],
    queryFn: () => fetchMe(userId),
    enabled: !!userId,
  });

// Public profile (by username)

async function fetchProfile(
  username: string,
  currentUserId?: string,
): Promise<ProfileData> {
  const { data: profile, error } = await supabase
    .from("users")
    .select(PROFILE_COLUMNS)
    .eq("username", username)
    .is("deleted_at", null)
    .single();

  if (error) throw error;

  let follow_status: "accepted" | "pending" | null = null;
  let is_blocked_by_me = false;

  if (currentUserId && currentUserId !== profile.id) {
    const [followResult, blockResult] = await Promise.all([
      supabase
        .from("follows")
        .select("id, status")
        .eq("follower_id", currentUserId)
        .eq("following_id", profile.id)
        .maybeSingle(),
      supabase
        .from("user_blocks")
        .select("id")
        .eq("blocker_id", currentUserId)
        .eq("blocked_id", profile.id)
        .maybeSingle(),
    ]);

    follow_status =
      (followResult.data?.status as "accepted" | "pending" | null) ?? null;
    is_blocked_by_me = !!blockResult.data;
  }

  return {
    ...(profile as UserProfile),
    follow_status,
    is_following: follow_status === "accepted",
    is_blocked_by_me,
  };
}

export const profileQueryOptions = (username: string, currentUserId?: string) =>
  queryOptions({
    queryKey: ["profile", username, currentUserId],
    queryFn: () => fetchProfile(username, currentUserId),
    enabled: !!username,
  });

// Profile update

export async function updateProfileFn(
  userId: string,
  data: UpdateProfileData,
): Promise<UserProfile> {
  const { data: updated, error } = await supabase
    .from("users")
    .update(data)
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .single();
  if (error) throw error;
  return updated as UserProfile;
}

// Follow / Unfollow

export async function followFn(
  followerId: string,
  followingId: string,
  isPrivate: boolean = false,
): Promise<void> {
  const { error } = await supabase.from("follows").insert({
    follower_id: followerId,
    following_id: followingId,
    status: isPrivate ? "pending" : "accepted",
  });
  if (error) throw error;
}

export async function unfollowFn(
  followerId: string,
  followingId: string,
): Promise<void> {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  if (error) throw error;
}

// Followers / Following lists (paginadas)

const FOLLOW_USER_COLUMNS =
  "id, username, display_name, avatar_url, bio, followers_count, following_count, books_read_count, is_private";

const PAGE_SIZE = 30;

export type FollowUser = {
  follow_id: string;
  created_at: string | null;
  user: Pick<
    UserProfile,
    | "id"
    | "username"
    | "display_name"
    | "avatar_url"
    | "bio"
    | "followers_count"
    | "following_count"
    | "books_read_count"
    | "is_private"
  >;
};

export type FollowListPage = {
  items: FollowUser[];
  nextCursor: string | null;
};

async function fetchFollowers(
  userId: string,
  cursor?: string,
): Promise<FollowListPage> {
  let query = supabase
    .from("follows")
    .select(
      `id, created_at, follower:users!follows_follower_id_fkey(${FOLLOW_USER_COLUMNS})`,
    )
    .eq("following_id", userId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) query = query.lt("created_at", cursor);

  const { data, error } = await query;
  if (error) throw error;

  const items: FollowUser[] = (data ?? []).map((row: any) => ({
    follow_id: row.id,
    created_at: row.created_at,
    user: row.follower,
  }));

  return {
    items,
    nextCursor:
      items.length === PAGE_SIZE
        ? items[items.length - 1].created_at
        : null,
  };
}

async function fetchFollowing(
  userId: string,
  cursor?: string,
): Promise<FollowListPage> {
  let query = supabase
    .from("follows")
    .select(
      `id, created_at, following:users!follows_following_id_fkey(${FOLLOW_USER_COLUMNS})`,
    )
    .eq("follower_id", userId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) query = query.lt("created_at", cursor);

  const { data, error } = await query;
  if (error) throw error;

  const items: FollowUser[] = (data ?? []).map((row: any) => ({
    follow_id: row.id,
    created_at: row.created_at,
    user: row.following,
  }));

  return {
    items,
    nextCursor:
      items.length === PAGE_SIZE
        ? items[items.length - 1].created_at
        : null,
  };
}

export const followersInfiniteOptions = (userId: string) =>
  infiniteQueryOptions({
    queryKey: ["followers", userId],
    queryFn: ({ pageParam }) =>
      fetchFollowers(userId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!userId,
  });

export const followingInfiniteOptions = (userId: string) =>
  infiniteQueryOptions({
    queryKey: ["following", userId],
    queryFn: ({ pageParam }) =>
      fetchFollowing(userId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!userId,
  });

// Pending follow requests (solicitudes recibidas)

export type PendingRequest = {
  follow_id: string;
  created_at: string | null;
  requester: Pick<
    UserProfile,
    "id" | "username" | "display_name" | "avatar_url" | "bio" | "followers_count" | "is_private"
  >;
};

async function fetchPendingRequests(userId: string): Promise<PendingRequest[]> {
  const { data, error } = await supabase
    .from("follows")
    .select(
      `id, created_at, requester:users!follows_follower_id_fkey(id, username, display_name, avatar_url, bio, followers_count, is_private)`,
    )
    .eq("following_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    follow_id: row.id,
    created_at: row.created_at,
    requester: row.requester,
  }));
}

export const pendingRequestsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["follow_requests", userId],
    queryFn: () => fetchPendingRequests(userId),
    enabled: !!userId,
  });

export async function acceptFollowFn(followId: string): Promise<void> {
  const { error } = await supabase
    .from("follows")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", followId);
  if (error) throw error;
}

export async function rejectFollowFn(followId: string): Promise<void> {
  const { error } = await supabase.from("follows").delete().eq("id", followId);
  if (error) throw error;
}

// User recent reads (for other user profiles)

async function fetchUserRecentReads(userId: string): Promise<LibraryRow[]> {
  const { data, error } = await supabase
    .from("user_books")
    .select("*, books(*)")
    .eq("user_id", userId)
    .eq("status", "read")
    .order("finished_at", { ascending: false, nullsFirst: false })
    .limit(8);
  if (error) throw error;
  return (data ?? []) as LibraryRow[];
}

export const userRecentReadsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["user_recent_reads", userId],
    queryFn: () => fetchUserRecentReads(userId),
    enabled: !!userId,
  });

// User search

export type SearchUser = Pick<
  UserProfile,
  | "id"
  | "username"
  | "display_name"
  | "avatar_url"
  | "bio"
  | "followers_count"
  | "is_private"
  | "books_read_count"
>;

const USER_SEARCH_COLUMNS =
  "id, username, display_name, avatar_url, bio, followers_count, is_private, books_read_count";

async function fetchSearchUsers(q: string): Promise<SearchUser[]> {
  let query = supabase
    .from("users")
    .select(USER_SEARCH_COLUMNS)
    .is("deleted_at", null)
    .order("followers_count", { ascending: false })
    .limit(q.length >= 2 ? 20 : 5);

  if (q.length >= 2) {
    query = query.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SearchUser[];
}

export const searchUsersQueryOptions = (q: string) =>
  queryOptions({
    queryKey: ["search_users", q],
    queryFn: () => fetchSearchUsers(q),
    staleTime: q.length >= 2 ? 30_000 : 5 * 60_000,
  });

// ── Bloqueos ──────────────────────────────────────────────────

export type BlockedUser = {
  id: string;
  created_at: string;
  blocked: Pick<UserProfile, "id" | "username" | "display_name" | "avatar_url">;
};

export async function blockUserFn(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_blocks")
    .insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error) throw error;
}

export async function unblockUserFn(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
  if (error) throw error;
}

async function fetchBlockedUsers(userId: string): Promise<BlockedUser[]> {
  const { data, error } = await supabase
    .from("user_blocks")
    .select(
      "id, created_at, blocked:users!blocked_id(id, username, display_name, avatar_url)",
    )
    .eq("blocker_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as BlockedUser[];
}

export const blockedUsersQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["blocked-users", userId],
    queryFn: () => fetchBlockedUsers(userId),
    enabled: !!userId,
  });

// ── Reportes ──────────────────────────────────────────────────

export type ReportTargetType =
  | "review"
  | "comment"
  | "user"
  | "list"
  | "activity"
  | "message"
  | "club";

export async function createReportFn(params: {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string;
}): Promise<void> {
    const { error } = await supabase.from("reports").insert({
      reporter_id: params.reporterId,
      target_type: params.targetType,
    target_id: params.targetId,
    reason: params.reason,
    details: params.details ?? null,
  });
  if (error) throw error;
}

// ── Eliminación de cuenta ──────────────────────────────────────

export type DeletionRequest = {
  id: string;
  requested_at: string;
  scheduled_delete_at: string;
};

async function fetchDeletionRequest(
  userId: string,
): Promise<DeletionRequest | null> {
  const { data, error } = await supabase
    .from("account_deletion_requests")
    .select("id, requested_at, scheduled_delete_at")
    .eq("user_id", userId)
    .is("cancelled_at", null)
    .maybeSingle();
  if (error) throw error;
  return data as DeletionRequest | null;
}

export const accountDeletionQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["account_deletion", userId],
    queryFn: () => fetchDeletionRequest(userId),
    enabled: !!userId,
  });

export async function cancelAccountDeletionFn(requestId: string): Promise<void> {
  const { error } = await supabase
    .from("account_deletion_requests")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) throw error;
}

// ── Preferencias de notificación ───────────────────────────────

export type NotificationPreferences = {
  user_id: string;
  push_new_follower: boolean;
  push_activity_like: boolean;
  push_review_like: boolean;
  push_comment: boolean;
  push_recommendation: boolean;
  push_dm: boolean;
  push_club: boolean;
  email_weekly_digest: boolean;
  consent_given_at: string | null;
  push_token: string | null;
  updated_at: string;
};

async function fetchNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences | null> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as NotificationPreferences | null;
}

export const notificationPreferencesQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["notification_preferences", userId],
    queryFn: () => fetchNotificationPreferences(userId),
    enabled: !!userId,
  });

export async function upsertNotificationPreferencesFn(
  userId: string,
  data: Partial<
    Omit<NotificationPreferences, "user_id" | "updated_at">
  > & { markConsent?: boolean },
): Promise<void> {
  const { markConsent, ...prefs } = data;
  const payload = {
    user_id: userId,
    ...prefs,
    ...(markConsent ? { consent_given_at: new Date().toISOString() } : {}),
  };
  const { error } = await supabase.from("notification_preferences").upsert(payload);
  if (error) throw error;
}
