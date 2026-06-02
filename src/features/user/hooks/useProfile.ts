import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth.store";
import { profileQueryOptions } from "../user.queries";

export function useProfile(username: string) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  return useQuery(profileQueryOptions(username, currentUserId));
}
