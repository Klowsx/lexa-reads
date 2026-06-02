import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeBookFromListFn } from "../list.queries";

export function useRemoveBookFromList(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listBookId: string) => removeBookFromListFn(listBookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists", "slug", slug] });
      queryClient.invalidateQueries({ queryKey: ["lists", "user"] });
    },
  });
}
