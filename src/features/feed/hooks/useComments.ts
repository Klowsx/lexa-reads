import { useInfiniteQuery } from "@tanstack/react-query";
import { commentsInfiniteOptions, type CommentTargetType } from "../feed.queries";

export function useComments(targetType: CommentTargetType, targetId: string) {
  return useInfiniteQuery(commentsInfiniteOptions(targetType, targetId));
}
