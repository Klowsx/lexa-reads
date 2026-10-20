import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cliente con service_role para setup/teardown en tests (bypasa RLS)
export const adminClient = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: { headers: { Authorization: `Bearer ${serviceRoleKey}` } }
})

// Crea un cliente que siempre envía el JWT del usuario en cada request,
// sin depender del manejo de sesión de Supabase JS (que no funciona bien en jest-expo)
function createUserClient(accessToken: string) {
  const userFetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
    const headers = new Headers(init.headers as HeadersInit)
    headers.set('Authorization', `Bearer ${accessToken}`)
    return fetch(input, { ...init, headers })
  }

  return createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: userFetch }
  })
}

// Crea y autentica un usuario de test, devuelve su cliente y un cleanup
export async function createTestUser(email: string, password: string) {
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })
  if (error || !data.user)
    throw error ?? new Error('Failed to create test user')

  const user = data.user

  // Usar un cliente limpio para el sign-in, sin estado compartido con adminClient
  const signInClient = createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  const { data: signIn, error: signInError } =
    await signInClient.auth.signInWithPassword({
      email,
      password
    })
  if (signInError || !signIn.session)
    throw signInError ?? new Error('Failed to sign in test user')

  const client = createUserClient(signIn.session.access_token)
  const accessToken = signIn.session.access_token

  async function cleanup() {
    await adminClient.auth.admin.deleteUser(user.id)
  }

  return { client, accessToken, user, cleanup }
}
