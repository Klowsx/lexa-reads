import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type'
}

// Gestiona una solicitud de eliminación autenticada y revoca la sesión al aceptarla.
export async function deleteAccountHandler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const authHeader = req.headers.get('Authorization')
  const accessToken = authHeader?.match(/^Bearer\s+(\S+)$/i)?.[1]
  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Cliente autenticado con el JWT del usuario
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  )

  // Cliente admin para cerrar sesiones
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Verificar que no haya ya una solicitud pendiente
  const { data: existing, error: existingError } = await supabase
    .from('account_deletion_requests')
    .select('id')
    .eq('user_id', user.id)
    .is('cancelled_at', null)
    .is('processed_at', null)
    .maybeSingle()

  if (existingError) {
    return new Response(JSON.stringify({ error: existingError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  let alreadyRequested = Boolean(existing)
  if (!existing) {
    // La restricción parcial de base evita duplicados si dos solicitudes llegan a la vez.
    const { error: insertError } = await supabase
      .from('account_deletion_requests')
      .insert({ user_id: user.id })

    if (insertError && insertError.code !== '23505') {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    alreadyRequested = insertError?.code === '23505'
  }

  // Usa el JWT ya validado por getUser: admin.signOut no admite el UUID del usuario.
  // Revoca todas las sesiones, incluso al reintentar una solicitud ya existente.
  const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(
    accessToken,
    'global'
  )
  if (signOutError) {
    return new Response(JSON.stringify({ error: signOutError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ ok: true, alreadyRequested }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
