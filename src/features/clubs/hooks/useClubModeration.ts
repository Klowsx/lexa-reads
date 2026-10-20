import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approveClubMemberFn, banClubMemberFn } from '../clubs.queries'

// Acciones de moderador de club (validadas en el RPC vía is_club_mod).
export function useClubModeration(clubId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      action
    }: {
      userId: string
      action: 'approve' | 'ban'
    }) =>
      action === 'approve'
        ? approveClubMemberFn(clubId, userId)
        : banClubMemberFn(clubId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs', 'members', clubId] })
      queryClient.invalidateQueries({ queryKey: ['clubs'] })
    }
  })
}
