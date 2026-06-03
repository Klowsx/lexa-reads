import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

/**
 * Like optimista local para superficies cuyo `liked` NO viaja en la fila
 * cacheada (reseñas, listas), por lo que no se puede hacer setQueryData del
 * flag desde el row. Resuelve los dos defectos de D-1:
 *
 *  1. Re-sincroniza con las props entrantes: si un refetch trae nuevos
 *     `initialLiked/initialCount`, el estado local se actualiza (el patrón
 *     anterior con `useState(initial)` ignoraba el nuevo valor → corazón
 *     desincronizado del servidor).
 *  2. No invalida queries de forma global en cada like (P-1).
 *
 * snapshot → flip optimista → revert en onError.
 */
export function useOptimisticLike(
  initialLiked: boolean,
  initialCount: number,
  mutationFn: (currentlyLiked: boolean) => Promise<void>,
) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  // Sincroniza el estado local cuando cambian las props (refetch externo).
  const [seed, setSeed] = useState({ liked: initialLiked, count: initialCount });
  if (seed.liked !== initialLiked || seed.count !== initialCount) {
    setSeed({ liked: initialLiked, count: initialCount });
    setLiked(initialLiked);
    setCount(initialCount);
  }

  const mutation = useMutation({
    mutationFn: () => mutationFn(liked),
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
  });

  return { liked, count, toggle: mutation.mutate, isPending: mutation.isPending };
}
