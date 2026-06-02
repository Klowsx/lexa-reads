import { useInfiniteQuery } from "@tanstack/react-query";
import { userReviewsInfiniteOptions } from "../reviews.queries";

export function useUserReviews(userId: string) {
  const query = useInfiniteQuery(userReviewsInfiniteOptions(userId));

  const reviews = query.data?.pages.flatMap((p) => p.rows) ?? [];

  return { ...query, reviews };
}
