import { useQuery } from "@tanstack/react-query";
import { clubMembersQueryOptions } from "../clubs.queries";

export function useClubMembers(clubId: string) {
  return useQuery(clubMembersQueryOptions(clubId));
}
