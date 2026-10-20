import * as Linking from 'expo-linking'
import type { AuthFlow } from './auth-links'

// Incluye el propósito del enlace para separar registro, recuperación y proveedores externos.
export function getAuthRedirectUrl(flow: AuthFlow) {
  return Linking.createURL('auth-callback', { queryParams: { flow } })
}

// Mantiene una única URL de retorno para los correos de recuperación.
export function getPasswordRecoveryRedirectUrl() {
  return getAuthRedirectUrl('recovery')
}
