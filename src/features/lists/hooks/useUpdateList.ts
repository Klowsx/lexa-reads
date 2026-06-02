import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateListFn } from "../list.queries";

export function useUpdateList(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      listId: string;
      name?: string;
      description?: string | null;
      visibility?: "public" | "private";
      accentColor?: string;
      isFeatured?: boolean;
    }) => updateListFn(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists", "slug", slug] });
      queryClient.invalidateQueries({ queryKey: ["lists", "user"] });
    },
  });
}
