import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth.store";
import { unreadCountQueryOptions } from "../notifications.queries";

export function useUnreadCount() {
  const userId = useAuthStore((s) => s.user?.id) ?? "";
  return useQuery(unreadCountQueryOptions(userId));
}
