import { useMutation } from '@tanstack/react-query'
import { supabase } from '~/lib/supabase'
import { toAppError } from '~/types'

// Reenvía solo la confirmación de registro sin navegar ni iniciar una recuperación.
export function useResendConfirmation() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim()
      })
      if (error) throw toAppError(error)
    }
  })
}
