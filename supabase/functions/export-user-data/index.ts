import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
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

  const uid = user.id

  // Rate-limit: el export escanea varias tablas → máx. 3 por hora por usuario.
  const { data: allowed } = await supabase.rpc('hit_rate_limit', {
    p_key: `export:${uid}`,
    p_max: 3,
    p_window_seconds: 3600
  })
  if (allowed === false) {
    return new Response(
      JSON.stringify({ error: 'Demasiadas solicitudes. Inténtalo más tarde.' }),
      {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  const [profile, userBooks, reviews, lists, comments, messages] =
    await Promise.all([
      supabase
        .from('users')
        .select('username, display_name, bio, favorite_genres, created_at')
        .eq('id', uid)
        .single()
        .then((r) => r.data),

      supabase
        .from('user_books')
        .select(
          'status, rating, started_at, finished_at, tags, books(title, authors, isbn_13)'
        )
        .eq('user_id', uid)
        .then((r) => r.data ?? []),

      supabase
        .from('reviews')
        .select('body, contains_spoilers, created_at, books(title, authors)')
        .eq('user_id', uid)
        .is('deleted_at', null)
        .then((r) => r.data ?? []),

      supabase
        .from('lists')
        .select(
          'name, description, visibility, created_at, list_books(books(title, authors))'
        )
        .eq('user_id', uid)
        .then((r) => r.data ?? []),

      supabase
        .from('comments')
        .select('body, target_type, created_at')
        .eq('user_id', uid)
        .is('deleted_at', null)
        .then((r) => r.data ?? []),

      // Mensajes enviados (DMs + chat de club). Derecho de portabilidad (GDPR).
      supabase
        .from('messages')
        .select('body, conversation_id, created_at')
        .eq('sender_id', uid)
        .is('deleted_at', null)
        .then((r) => r.data ?? [])
    ])

  const exportData = {
    exported_at: new Date().toISOString(),
    profile,
    library: userBooks,
    reviews,
    lists,
    comments,
    messages
  }

  return new Response(JSON.stringify(exportData), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
