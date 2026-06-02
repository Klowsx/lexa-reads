import { useQuery } from "@tanstack/react-query";
import { userListsQueryOptions } from "../list.queries";
import { useAuthStore } from "~/stores/auth.store";

export function useUserLists(userId?: string) {
  const currentUserId = useAuthStore((s) => s.user?.id ?? "");
  const targetId = userId ?? currentUserId;
  return useQuery(userListsQueryOptions(targetId));
}
