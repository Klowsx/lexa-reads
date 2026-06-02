import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createListFn } from "../list.queries";
import { useAuthStore } from "~/stores/auth.store";

export function useCreateList() {
  const userId = useAuthStore((s) => s.user?.id ?? "");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      name: string;
      description?: string;
      visibility: "public" | "private";
      accentColor: string;
    }) => createListFn({ userId, ...params }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists", "user", userId] });
    },
  });
}
