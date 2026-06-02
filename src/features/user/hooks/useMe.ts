import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth.store";
import { meQueryOptions } from "../user.queries";

export function useMe() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery(meQueryOptions(userId ?? ""));
}
