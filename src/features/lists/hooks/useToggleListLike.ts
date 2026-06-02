import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleListLikeFn } from "../list.queries";
import { useAuthStore } from "~/stores/auth.store";

export function useToggleListLike(
  listId: string,
  initialLiked: boolean,
  initialCount: number,
) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  const mutation = useMutation({
    mutationFn: () => {
      if (!userId) throw new Error("Not authenticated");
      return toggleListLikeFn(listId, userId, liked);
    },
    onMutate: () => {
      const snapshot = { liked, count };
      setLiked((p) => !p);
      setCount((p) => (liked ? p - 1 : p + 1));
      return snapshot;
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) {
        setLiked(ctx.liked);
        setCount(ctx.count);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });

  return { liked, count, toggle: mutation.mutate, isPending: mutation.isPending };
}
