import { supabase } from '~/lib/supabase'
import { queryOptions } from '@tanstack/react-query'
import { USERNAME_PATTERN } from '~/lib/username'
import { toAppError } from '~/types'
import type { LoginParams, RegisterParams } from '~/types'
import type { AuthResponse } from '@supabase/supabase-js'
import {
  getAuthRedirectUrl,
  getPasswordRecoveryRedirectUrl
} from './password-recovery'
import { saveRecoveryContext } from './recovery-context'

// Consulta el servidor; la restricción única decide el nombre definitivo si hay una carrera.
async function checkUsernameAvailability(username: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_username_available', {
    p_username: username
  })
  if (error) throw error
  return data
}

// Comparte la clave y las reglas de disponibilidad entre la consulta y su invalidación.
export function usernameAvailabilityQueryOptions(username: string) {
  return queryOptions({
    queryKey: ['username_availability', username],
    queryFn: () => checkUsernameAvailability(username),
    enabled: USERNAME_PATTERN.test(username),
    staleTime: 30_000
  })
}

// Autentica con el correo normalizado y conserva intacta la contraseña.
export async function loginFn({
  email,
  password
}: LoginParams): Promise<AuthResponse['data']> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password
  })
  if (error) throw toAppError(error)
  return data
}

// Crea la cuenta y envía el nombre que consume el trigger del perfil.
export async function registerFn({
  email,
  password,
  displayName
}: RegisterParams): Promise<AuthResponse['data']> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { display_name: displayName.trim() },
      emailRedirectTo: getAuthRedirectUrl('signup')
    }
  })
  if (error) throw toAppError(error)
  return data
}

// Solicita el correo de recuperación sin revelar si la cuenta existe y define el retorno a Lexa.
export async function requestResetPasswordFn({
  email
}: {
  email: string
}): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: getPasswordRecoveryRedirectUrl()
  })
  if (error) throw toAppError(error)
}

// Verifica un código de recuperación cuando la plantilla de correo usa OTP.
export async function verifyPasswordResetCodeFn({
  email,
  token
}: {
  email: string
  token: string
}): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'recovery'
  })
  if (error) throw toAppError(error)
}

// Actualiza la contraseña una sola vez dentro de la sesión validada por el enlace.
export async function updatePasswordFn({
  password
}: {
  password: string
}): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw toAppError(error)
}

// Revoca las sesiones tras la recuperación; su reintento no vuelve a modificar la contraseña.
export async function finishPasswordRecoveryFn(): Promise<void> {
  const { error: signOutError } = await supabase.auth.signOut({
    scope: 'global'
  })
  if (signOutError) throw toAppError(signOutError)
  await saveRecoveryContext(null)
}

// Cierra la sesión de este dispositivo y retira su contexto de recuperación.
export async function logoutFn(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'local' })
  if (error) throw toAppError(error)
  await saveRecoveryContext(null)
}
