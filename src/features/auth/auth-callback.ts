import type { Session } from '@supabase/supabase-js'
import { supabase } from '~/lib/supabase'
import { useAuthStore } from '~/stores/auth.store'
import { parseAuthCallback, type AuthFlow } from './auth-links'
import { saveRecoveryContext } from './recovery-context'

type CallbackResult = { session: Session; flow: AuthFlow }
const pending = new Map<string, Promise<CallbackResult>>()

// Verifica el enlace con Supabase antes de proyectar la sesión y su propósito en la interfaz.
async function consumeCallback(url: string): Promise<CallbackResult> {
  const callback = parseAuthCallback(url)
  const result = callback.code
    ? await supabase.auth.exchangeCodeForSession(callback.code)
    : callback.tokenHash
      ? await supabase.auth.verifyOtp({
          token_hash: callback.tokenHash,
          type: callback.tokenType
        })
      : await supabase.auth.setSession({
          access_token: callback.accessToken!,
          refresh_token: callback.refreshToken!
        })
  if (result.error || !result.data.session) {
    throw new Error('No pudimos validar el enlace. Solicita uno nuevo.')
  }
  const session = result.data.session
  await saveRecoveryContext(
    callback.flow === 'recovery' ? session.user.id : null
  )
  const store = useAuthStore.getState()
  store.setRecoveryMode(callback.flow === 'recovery')
  store.setRecoveryPasswordUpdated(false)
  store.setSession(session)
  return { session, flow: callback.flow }
}

// Comparte la petición en curso para que dos montajes no consuman dos veces un código de un solo uso.
export async function completeAuthCallback(
  url: string
): Promise<CallbackResult> {
  const key = JSON.stringify(parseAuthCallback(url))
  const current = pending.get(key)
  if (current) return current
  const request = consumeCallback(url)
  pending.set(key, request)
  const remove = () => {
    if (pending.get(key) === request) pending.delete(key)
  }
  void request.then(remove, remove)
  return request
}
