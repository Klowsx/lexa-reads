import { infiniteQueryOptions } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";

// ── Feed types ─────────────────────────────────────────────────

export type ActivityType =
  | "finished_book"
  | "started_book"
  | "wrote_review"
  | "added_to_list"
  | "want_to_read"
  | "abandoned_book";

export type FeedItemUser = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type FeedItemBook = {
  id: string;
  title: string;
  authors: string[];
  cover_url: string | null;
  google_books_id: string;
};

export type FeedItem = {
  id: string;
  user: FeedItemUser;
  activity_type: ActivityType;
  book: FeedItemBook;
  review_preview: string | null;
  list_name: string | null;
  likes_count: number;
  liked: boolean;
  created_at: string;
};

const FEED_PAGE = 20;

const FEED_COLS = `
  id, user_id, activity_type, book_id, review_id, list_id, likes_count, created_at,
  user:users!activity_feed_user_id_fkey(id, username, display_name, avatar_url),
  book:books!activity_feed_book_id_fkey(id, title, authors, cover_url, google_books_id),
  review:reviews(body),
  list:lists(name)
`.trim();

type RawFeedRow = {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  likes_count: number;
  created_at: string;
  user: FeedItemUser;
  book: FeedItemBook;
  review: { body: string } | null;
  list: { name: string } | null;
};

async function fetchFeedPage(
  userId: string,
  cursor?: string,
): Promise<{ items: FeedItem[]; nextCursor: string | null }> {
  let query = supabase
    .from("activity_feed")
    .select(FEED_COLS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(FEED_PAGE);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as RawFeedRow[];
  if (rows.length === 0) return { items: [], nextCursor: null };

  // Batch-check which items the current user has liked
  const activityIds = rows.map((r) => r.id);
  const { data: likes } = await supabase
    .from("activity_likes")
    .select("activity_id")
    .in("activity_id", activityIds)
    .eq("user_id", userId);
  const likedSet = new Set((likes ?? []).map((l) => l.activity_id));

  const items: FeedItem[] = rows.map((row) => ({
    id: row.id,
    user: row.user,
    activity_type: row.activity_type,
    book: row.book,
    review_preview: row.review?.body ?? null,
    list_name: row.list?.name ?? null,
    likes_count: row.likes_count,
    liked: likedSet.has(row.id),
    created_at: row.created_at,
  }));

  const nextCursor =
    items.length === FEED_PAGE ? items[items.length - 1].created_at : null;

  return { items, nextCursor };
}

export const feedInfiniteOptions = (userId: string) =>
  infiniteQueryOptions({
    queryKey: ["feed", userId],
    queryFn: ({ pageParam }) =>
      fetchFeedPage(userId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });

// ── Types ──────────────────────────────────────────────────────

export type CommentTargetType = "review" | "activity";

export type CommentUser = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type CommentRow = {
  id: string;
  user_id: string;
  target_type: CommentTargetType;
  target_id: string;
  parent_id: string | null;
  reply_to_user_id: string | null;
  body: string;
  created_at: string | null;
  deleted_at: string | null;
  user: CommentUser;
};

const COMMENT_COLS =
  "id, user_id, target_type, target_id, parent_id, reply_to_user_id, body, created_at, deleted_at, user:users!comments_user_id_fkey(id, username, display_name, avatar_url)";

const COMMENT_PAGE = 40;

// ── Activity likes ─────────────────────────────────────────────

export async function toggleActivityLikeFn(
  activityId: string,
  userId: string,
  currentlyLiked: boolean,
): Promise<void> {
  if (currentlyLiked) {
    const { error } = await supabase
      .from("activity_likes")
      .delete()
      .eq("activity_id", activityId)
      .eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("activity_likes")
      .insert({ activity_id: activityId, user_id: userId });
    if (error) throw error;
  }
}

export async function fetchActivityLiked(
  activityId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("activity_likes")
    .select("id")
    .eq("activity_id", activityId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

// ── Review likes ───────────────────────────────────────────────

export async function toggleReviewLikeFn(
  reviewId: string,
  userId: string,
  currentlyLiked: boolean,
): Promise<void> {
  if (currentlyLiked) {
    const { error } = await supabase
      .from("review_likes")
      .delete()
      .eq("review_id", reviewId)
      .eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("review_likes")
      .insert({ review_id: reviewId, user_id: userId });
    if (error) throw error;
  }
}

export async function fetchReviewLiked(
  reviewId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("review_likes")
    .select("id")
    .eq("review_id", reviewId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

// ── Comments ───────────────────────────────────────────────────

async function fetchComments(
  targetType: CommentTargetType,
  targetId: string,
  cursor?: string,
): Promise<{ items: CommentRow[]; nextCursor: string | null }> {
  let query = supabase
    .from("comments")
    .select(COMMENT_COLS)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .is("parent_id", null)
    .order("created_at", { ascending: true })
    .limit(COMMENT_PAGE);

  if (cursor) query = query.gt("created_at", cursor);

  const { data, error } = await query;
  if (error) throw error;

  const items = (data ?? []) as unknown as CommentRow[];
  return {
    items,
    nextCursor:
      items.length === COMMENT_PAGE ? (items[items.length - 1].created_at ?? null) : null,
  };
}

export const commentsInfiniteOptions = (
  targetType: CommentTargetType,
  targetId: string,
) =>
  infiniteQueryOptions({
    queryKey: ["comments", targetType, targetId],
    queryFn: ({ pageParam }) =>
      fetchComments(targetType, targetId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!targetId,
  });

export async function createCommentFn(params: {
  userId: string;
  targetType: CommentTargetType;
  targetId: string;
  body: string;
  parentId?: string;
}): Promise<CommentRow> {
  const { data, error } = await supabase
    .from("comments")
    .insert({
      user_id: params.userId,
      target_type: params.targetType,
      target_id: params.targetId,
      body: params.body,
      parent_id: params.parentId ?? null,
    })
    .select(COMMENT_COLS)
    .single();
  if (error) throw error;
  return data as unknown as CommentRow;
}

export async function deleteCommentFn(commentId: string): Promise<void> {
  const { error } = await supabase
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId);
  if (error) throw error;
}
