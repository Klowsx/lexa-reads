import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth.store";
import { notificationsQueryOptions } from "../notifications.queries";

export function useNotifications() {
  const userId = useAuthStore((s) => s.user?.id) ?? "";
  return useInfiniteQuery(notificationsQueryOptions(userId));
}
