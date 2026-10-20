import { isAuthError, type Session } from '@supabase/supabase-js'
import { supabase } from '~/lib/supabase'

// Distingue una sesión revocada de un fallo temporal que permite volver a intentar.
function isRejectedSession(error: unknown) {
  return (
    isAuthError(error) &&
    (error.status === 400 || error.status === 401 || error.status === 403)
  )
}

// Comprueba la identidad en el servidor al reabrir, sin expulsar al lector por una caída de red.
export async function restoreAuthSession(): Promise<Session | null> {
  const stored = await supabase.auth.getSession()
  if (stored.error) {
    if (!isRejectedSession(stored.error)) throw stored.error
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) throw error
    return null
  }
  if (!stored.data.session) return null
  const verified = await supabase.auth.getUser(stored.data.session.access_token)
  if (verified.error || !verified.data.user) {
    if (verified.error && !isRejectedSession(verified.error))
      throw verified.error
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) throw error
    return null
  }
  return { ...stored.data.session, user: verified.data.user }
}
