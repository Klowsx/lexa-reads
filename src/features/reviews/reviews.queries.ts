import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import type { Tables } from "~/types/database";

export type ReviewWithBook = Tables<"reviews"> & {
  books: Pick<
    Tables<"books">,
    "id" | "title" | "authors" | "cover_url" | "google_books_id" | "published_year"
  > | null;
  user_books: Pick<Tables<"user_books">, "rating"> | null;
};

type ReviewCursor = { createdAt: string; id: string } | null;

const PAGE_SIZE = 15;

async function fetchUserReviews(
  userId: string,
  cursor: ReviewCursor,
): Promise<{ rows: ReviewWithBook[]; nextCursor: ReviewCursor }> {
  let query = supabase
    .from("reviews")
    .select(
      "*, books(id, title, authors, cover_url, google_books_id, published_year), user_books(rating)",
    )
    .eq("user_id", userId)
    .eq("is_published", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as ReviewWithBook[];
  const nextCursor: ReviewCursor =
    rows.length === PAGE_SIZE
      ? { createdAt: rows[rows.length - 1].created_at!, id: rows[rows.length - 1].id }
      : null;

  return { rows, nextCursor };
}

export const myReviewsInfiniteOptions = (userId: string) =>
  infiniteQueryOptions({
    queryKey: ["my_reviews", userId] as const,
    queryFn: ({ pageParam }) => fetchUserReviews(userId, pageParam as ReviewCursor),
    initialPageParam: null as ReviewCursor,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!userId,
  });

export const userReviewsInfiniteOptions = (userId: string) =>
  infiniteQueryOptions({
    queryKey: ["user_reviews", userId] as const,
    queryFn: ({ pageParam }) => fetchUserReviews(userId, pageParam as ReviewCursor),
    initialPageParam: null as ReviewCursor,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!userId,
  });

export async function deleteMyReviewFn(
  userId: string,
  reviewId: string,
): Promise<void> {
  const { error } = await supabase
    .from("reviews")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", reviewId)
    .eq("user_id", userId);
  if (error) throw error;
}

export const reviewCountByUserQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["review_count", userId] as const,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_published", true)
        .is("deleted_at", null);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!userId,
  });
