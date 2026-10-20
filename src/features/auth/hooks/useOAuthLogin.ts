import { useMutation } from '@tanstack/react-query'
import { oauthLoginFn } from '../oauth'

// Delega el destino al mismo guard que organiza el acceso por correo y el onboarding.
export function useOAuthLogin() {
  return useMutation({ mutationFn: oauthLoginFn })
}
