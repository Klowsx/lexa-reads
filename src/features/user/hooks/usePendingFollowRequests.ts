import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth.store";
import { pendingRequestsQueryOptions } from "../user.queries";

export function usePendingFollowRequests() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery(pendingRequestsQueryOptions(userId ?? ""));
}
