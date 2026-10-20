import { supabase } from '~/lib/supabase'
import { toAppError } from '~/types'
import type { Session } from '@supabase/supabase-js'
import { completeAuthCallback } from './auth-callback'
import { getAuthRedirectUrl } from './password-recovery'

// Comparte la validación de enlaces con el registro y la recuperación.
export async function createSessionFromUrl(
  url: string
): Promise<Session | null> {
  return (await completeAuthCallback(url)).session
}

// Mantiene los proveedores externos en el mismo retorno sin cargar módulos nativos al arrancar.
export async function oauthLoginFn(
  provider: 'google' | 'apple'
): Promise<Session | null> {
  // El proveedor opcional se carga solo al usarlo, para no iniciar módulos nativos en Expo Go.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const WebBrowser: typeof import('expo-web-browser') = require('expo-web-browser')
  WebBrowser.maybeCompleteAuthSession()
  const redirectTo = getAuthRedirectUrl('oauth')
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true }
  })
  if (error) throw toAppError(error)
  if (!data.url) throw new Error('No se pudo iniciar sesión con el proveedor')
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
  return result.type === 'success' ? createSessionFromUrl(result.url) : null
}
