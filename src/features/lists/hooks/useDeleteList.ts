import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteListFn } from "../list.queries";
import { useAuthStore } from "~/stores/auth.store";

export function useDeleteList() {
  const userId = useAuthStore((s) => s.user?.id ?? "");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listId: string) => deleteListFn(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists", "user", userId] });
    },
  });
}
