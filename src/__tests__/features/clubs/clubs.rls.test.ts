import {
  adminClient,
  createTestUser,
  hasSupabaseTestEnv
} from '~/test-utils/supabase'

// RLS de clubes (migración 020). Requiere SUPABASE_SERVICE_ROLE_KEY +
// migraciones 019/020 aplicadas. Sin key → SKIP por env; sin migraciones
// desplegadas → se saltan en runtime (ready=false).
const SKIP = !hasSupabaseTestEnv
const admin = adminClient as any

async function messagingDeployed(): Promise<boolean> {
  const { error } = await admin.from('conversations').select('id').limit(1)
  return !error
}

type TestUser = Awaited<ReturnType<typeof createTestUser>>

// Crea un club como `owner` (RLS exige created_by = auth.uid()). El trigger
// handle_new_club da de alta al owner y crea la conversación del chat.
async function createClub(
  owner: TestUser,
  visibility: 'public' | 'private'
): Promise<string> {
  const slug = `test-club-${visibility}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  const { data, error } = await (owner.client as any)
    .from('reading_clubs')
    .insert({
      name: `Club ${slug}`,
      visibility,
      created_by: owner.user.id,
      slug
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

async function clubConversationId(clubId: string): Promise<string> {
  const { data } = await admin
    .from('conversations')
    .select('id')
    .eq('kind', 'club')
    .eq('club_id', clubId)
    .single()
  return data.id
}

describe('RLS: clubes de lectura', () => {
  let owner: TestUser
  let outsider: TestUser
  let ready = false

  beforeAll(async () => {
    if (SKIP) return
    ready = await messagingDeployed()
    if (!ready) {
      console.warn('[clubs.rls] migración 020 no desplegada → tests omitidos')
      return
    }
    ;[owner, outsider] = await Promise.all([
      createTestUser('club-owner@test.lexa', 'password123'),
      createTestUser('club-out@test.lexa', 'password123')
    ])
  })

  afterAll(async () => {
    if (SKIP || !ready) return
    await Promise.all([owner?.cleanup(), outsider?.cleanup()])
  })

  it('crear club da de alta al owner + crea la conversación', async () => {
    if (SKIP || !ready) return
    const clubId = await createClub(owner, 'public')

    const { data: mem } = await admin
      .from('reading_club_members')
      .select('role, state')
      .eq('club_id', clubId)
      .eq('user_id', owner.user.id)
      .single()
    expect(mem.role).toBe('owner')
    expect(mem.state).toBe('active')

    const { data: conv } = await admin
      .from('conversations')
      .select('id')
      .eq('kind', 'club')
      .eq('club_id', clubId)
      .single()
    expect(conv?.id).toBeTruthy()
  })

  it("club público: unirse queda 'active' al instante", async () => {
    if (SKIP || !ready) return
    const clubId = await createClub(owner, 'public')
    await (outsider.client as any)
      .from('reading_club_members')
      .insert({ club_id: clubId, user_id: outsider.user.id })

    const { data } = await admin
      .from('reading_club_members')
      .select('state, role')
      .eq('club_id', clubId)
      .eq('user_id', outsider.user.id)
      .single()
    expect(data.state).toBe('active')
    expect(data.role).toBe('member')
  })

  it("club privado: unirse queda 'pending' y no ve los mensajes", async () => {
    if (SKIP || !ready) return
    const clubId = await createClub(owner, 'private')
    const convId = await clubConversationId(clubId)
    await (owner.client as any).from('messages').insert({
      conversation_id: convId,
      sender_id: owner.user.id,
      body: 'solo socios'
    })

    // Solicitud pendiente
    await (outsider.client as any)
      .from('reading_club_members')
      .insert({ club_id: clubId, user_id: outsider.user.id })
    const { data: mem } = await admin
      .from('reading_club_members')
      .select('state')
      .eq('club_id', clubId)
      .eq('user_id', outsider.user.id)
      .single()
    expect(mem.state).toBe('pending')

    // Pendiente NO lee los mensajes del club
    const { data: seen } = await (outsider.client as any)
      .from('messages')
      .select('id')
      .eq('conversation_id', convId)
    expect(seen ?? []).toHaveLength(0)
  })

  it('un miembro NO puede auto-promoverse (REVOKE de state/role)', async () => {
    if (SKIP || !ready) return
    const clubId = await createClub(owner, 'private')
    await (outsider.client as any)
      .from('reading_club_members')
      .insert({ club_id: clubId, user_id: outsider.user.id }) // queda pending

    // Intento de auto-aprobarse / auto-promoverse directamente
    await (outsider.client as any)
      .from('reading_club_members')
      .update({ state: 'active', role: 'owner' })
      .eq('club_id', clubId)
      .eq('user_id', outsider.user.id)

    const { data } = await admin
      .from('reading_club_members')
      .select('state, role')
      .eq('club_id', clubId)
      .eq('user_id', outsider.user.id)
      .single()
    expect(data.state).toBe('pending') // sin cambios
    expect(data.role).toBe('member')
  })

  it('moderación: solo un mod aprueba (RPC); el solicitante no', async () => {
    if (SKIP || !ready) return
    const clubId = await createClub(owner, 'private')
    await (outsider.client as any)
      .from('reading_club_members')
      .insert({ club_id: clubId, user_id: outsider.user.id })

    // El propio solicitante NO puede aprobarse vía RPC (no es mod)
    await (outsider.client as any).rpc('approve_club_member', {
      p_club: clubId,
      p_user: outsider.user.id
    })
    let { data } = await admin
      .from('reading_club_members')
      .select('state')
      .eq('club_id', clubId)
      .eq('user_id', outsider.user.id)
      .single()
    expect(data.state).toBe('pending')

    // El owner (mod) sí aprueba
    await (owner.client as any).rpc('approve_club_member', {
      p_club: clubId,
      p_user: outsider.user.id
    })
    ;({ data } = await admin
      .from('reading_club_members')
      .select('state')
      .eq('club_id', clubId)
      .eq('user_id', outsider.user.id)
      .single())
    expect(data.state).toBe('active')
  })
})
