import { supabase } from '~/lib/supabase'
import { toAppError } from '~/types'
import type { LoginParams, RegisterParams } from '~/types'
import type { AuthResponse } from '@supabase/supabase-js'
import { getPasswordRecoveryRedirectUrl } from './password-recovery'

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
    options: { data: { display_name: displayName.trim() } }
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

// Actualiza la contraseña y verifica que la sesión temporal se haya cerrado.
export async function updatePasswordFn({
  password
}: {
  password: string
}): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw toAppError(error)
  const { error: signOutError } = await supabase.auth.signOut()
  if (signOutError) throw toAppError(signOutError)
}

export async function logoutFn(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw toAppError(error)
}
