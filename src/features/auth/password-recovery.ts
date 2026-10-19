import * as Linking from 'expo-linking'

const PASSWORD_RECOVERY_CALLBACK_PATH = 'auth-callback'

// Construye la URL de retorno que Supabase abre después de validar el enlace del correo.
export function getPasswordRecoveryRedirectUrl() {
  return Linking.createURL(PASSWORD_RECOVERY_CALLBACK_PATH)
}
