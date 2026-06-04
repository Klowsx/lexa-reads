import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth.store";
import { acceptClubInviteFn, joinClubFn, leaveClubFn } from "../clubs.queries";

type Action = "join" | "leave" | "accept-invite";

// Unirse (público → activo, privado → solicitud), salir, o aceptar invitación.
export function useClubMembership() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: ({ clubId, action }: { clubId: string; action: Action }) => {
      if (!userId) throw new Error("Not authenticated");
      if (action === "join") return joinClubFn(clubId, userId);
      if (action === "leave") return leaveClubFn(clubId, userId);
      return acceptClubInviteFn(clubId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
  });
}
