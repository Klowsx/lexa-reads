import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth.store";
import { toggleActivityLikeFn, type FeedItem, type FeedCursor } from "../feed.queries";

type FeedPage = { items: FeedItem[]; nextCursor: FeedCursor | null };
type FeedData = InfiniteData<FeedPage>;

// Aplica (inmutablemente) el flip de like sobre el item del feed en caché.
function flipLike(data: FeedData | undefined, activityId: string): FeedData | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((it) =>
        it.id === activityId
          ? {
              ...it,
              liked: !it.liked,
              likes_count: it.likes_count + (it.liked ? -1 : 1),
            }
          : it,
      ),
    })),
  };
}

// Optimistic like sobre la CACHÉ del feed (CLAUDE.md §8 / D-1):
// snapshot → flip en caché → revert en onError. NO invalida todo el feed
// en cada like (P-1) — el optimismo deja la caché ya correcta.
export function useToggleActivityLike(activityId: string | undefined) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const feedKey = ["feed", userId] as const;

  const mutation = useMutation({
    // `currentLiked` (variable de mutate) se captura ANTES del flip optimista,
    // así el servidor recibe la acción correcta (insert vs delete).
    mutationFn: (currentLiked: boolean) => {
      if (!userId || !activityId) throw new Error("Not authenticated");
      return toggleActivityLikeFn(activityId, userId, currentLiked);
    },
    onMutate: async () => {
      if (!activityId) return;
      await queryClient.cancelQueries({ queryKey: feedKey });
      const snapshot = queryClient.getQueryData<FeedData>(feedKey);
      queryClient.setQueryData<FeedData>(feedKey, (old) => flipLike(old, activityId));
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot !== undefined) {
        queryClient.setQueryData(feedKey, ctx.snapshot);
      }
    },
  });

  return {
    toggle: mutation.mutate,
    isPending: mutation.isPending,
  };
}
