import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type'
}

const EXPORT_VERSION = '1.0'
const PAGE_SIZE = 1000

type QueryResult<Row> = {
  data: Row[] | null
  error: { message: string } | null
}

// Reúne todas las páginas para no truncar una exportación al límite predeterminado de Supabase.
async function fetchAllRows<Row>(
  fetchPage: (from: number, to: number) => PromiseLike<QueryResult<Row>>
): Promise<Row[]> {
  const rows: Row[] = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)

    const page = data ?? []
    rows.push(...page)
    if (page.length < PAGE_SIZE) return rows
  }
}

// Genera una exportación versionada de la información accesible para el usuario autenticado.
Deno.serve(async (req) => {
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

  const [profileResult, userBooks, reviews, lists, comments, messages] =
    await Promise.all([
      supabase
        .from('users')
        .select('username, display_name, bio, favorite_genres, created_at')
        .eq('id', uid)
        .single(),

      fetchAllRows((from, to) =>
        supabase
          .from('user_books')
          .select(
            'status, rating, started_at, finished_at, tags, books(title, authors, isbn_13)'
          )
          .eq('user_id', uid)
          .range(from, to)
      ),

      fetchAllRows((from, to) =>
        supabase
          .from('reviews')
          .select('body, contains_spoilers, created_at, books(title, authors)')
          .eq('user_id', uid)
          .is('deleted_at', null)
          .range(from, to)
      ),

      fetchAllRows((from, to) =>
        supabase
          .from('lists')
          .select(
            'name, description, visibility, created_at, list_books(books(title, authors))'
          )
          .eq('user_id', uid)
          .range(from, to)
      ),

      fetchAllRows((from, to) =>
        supabase
          .from('comments')
          .select('body, target_type, created_at')
          .eq('user_id', uid)
          .is('deleted_at', null)
          .range(from, to)
      ),

      // Mensajes enviados (DMs + chat de club). Derecho de portabilidad (GDPR).
      fetchAllRows((from, to) =>
        supabase
          .from('messages')
          .select('body, conversation_id, created_at')
          .eq('sender_id', uid)
          .is('deleted_at', null)
          .range(from, to)
      )
    ])

  if (profileResult.error) throw new Error(profileResult.error.message)

  const exportData = {
    version: EXPORT_VERSION,
    exported_at: new Date().toISOString(),
    profile: profileResult.data,
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
