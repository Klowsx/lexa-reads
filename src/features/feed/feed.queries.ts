import { infiniteQueryOptions } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";

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
