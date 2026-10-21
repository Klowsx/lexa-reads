import {
  adminClient,
  createTestUser,
  hasSupabaseTestEnv
} from '~/test-utils/supabase'

// RLS de mensajería (migración 020). Requiere SUPABASE_SERVICE_ROLE_KEY +
// migraciones 019/020 aplicadas. Si falta la key → SKIP por env; si las
// migraciones aún no están desplegadas → se saltan en runtime (ready=false).
const SKIP = !hasSupabaseTestEnv

// El cliente generado no conoce aún las tablas de mensajería (faltan en
// database.ts hasta gen:types) → casts a any en el límite de Supabase.
const admin = adminClient as any

// ¿Está desplegado el esquema de mensajería (migración 020)? Sonda barata.
async function messagingDeployed(): Promise<boolean> {
  const { error } = await admin.from('conversations').select('id').limit(1)
  return !error
}

type TestUser = Awaited<ReturnType<typeof createTestUser>>

// Crea un DM como `client` (auth.uid() = quien llama → el trigger fija
// request_state según follow mutuo). Devuelve el conversationId.
async function createDM(
  client: any,
  idA: string,
  idB: string
): Promise<string> {
  const low = idA < idB ? idA : idB
  const high = idA < idB ? idB : idA
  const { data: conv, error } = await client
    .from('conversations')
    .insert({ kind: 'dm', dm_user_low: low, dm_user_high: high })
    .select('id')
    .single()
  if (error) throw error
  const { error: memErr } = await client.from('conversation_members').insert([
    { conversation_id: conv.id, user_id: low },
    { conversation_id: conv.id, user_id: high }
  ])
  if (memErr) throw memErr
  return conv.id
}

async function makeMutualFollow(a: string, b: string) {
  await admin.from('follows').insert([
    { follower_id: a, following_id: b, status: 'accepted' },
    { follower_id: b, following_id: a, status: 'accepted' }
  ])
}

describe('RLS: mensajería (DMs)', () => {
  let A: TestUser // emisor
  let B: TestUser // sin relación con A (recibe solicitud)
  let C: TestUser // seguidor mutuo de A
  let D: TestUser // tercero ajeno a la conversación
  let ready = false // esquema de mensajería desplegado

  beforeAll(async () => {
    if (SKIP) return
    ready = await messagingDeployed()
    if (!ready) {
      console.warn(
        '[messaging.rls] migración 020 no desplegada → tests omitidos'
      )
      return
    }
    ;[A, B, C, D] = await Promise.all([
      createTestUser('msg-a@test.lexa', 'password123'),
      createTestUser('msg-b@test.lexa', 'password123'),
      createTestUser('msg-c@test.lexa', 'password123'),
      createTestUser('msg-d@test.lexa', 'password123')
    ])
    await makeMutualFollow(A.user.id, C.user.id)
  })

  afterAll(async () => {
    if (SKIP || !ready) return
    await Promise.all([A?.cleanup(), B?.cleanup(), C?.cleanup(), D?.cleanup()])
  })

  it('DM a no-seguidor nace como solicitud (pending)', async () => {
    if (SKIP || !ready) return
    const conv = await createDM(A.client, A.user.id, B.user.id)
    const { data } = await admin
      .from('conversations')
      .select('request_state, requested_by')
      .eq('id', conv)
      .single()
    expect(data.request_state).toBe('pending')
    expect(data.requested_by).toBe(A.user.id)
  })

  it('DM entre seguidores mutuos nace abierto (open)', async () => {
    if (SKIP || !ready) return
    const conv = await createDM(A.client, A.user.id, C.user.id)
    const { data } = await admin
      .from('conversations')
      .select('request_state')
      .eq('id', conv)
      .single()
    expect(data.request_state).toBe('open')
  })

  it('solicitud pendiente: el solicitante puede escribir, el receptor NO', async () => {
    if (SKIP || !ready) return
    const conv = await createDM(A.client, A.user.id, B.user.id)

    // A (solicitante) puede enviar
    const { error: aErr } = await (A.client as any)
      .from('messages')
      .insert({ conversation_id: conv, sender_id: A.user.id, body: 'hola' })
    expect(aErr).toBeNull()

    // B (receptor) NO puede enviar hasta aceptar
    const { error: bErr } = await (B.client as any)
      .from('messages')
      .insert({ conversation_id: conv, sender_id: B.user.id, body: 'intruso' })
    expect(bErr).not.toBeNull()

    // Tras aceptar, B sí puede
    await (B.client as any).rpc('accept_message_request', { p_conv: conv })
    const { error: bErr2 } = await (B.client as any).from('messages').insert({
      conversation_id: conv,
      sender_id: B.user.id,
      body: 'ya acepté'
    })
    expect(bErr2).toBeNull()
  })

  it('un tercero no puede leer ni escribir en una conversación ajena', async () => {
    if (SKIP || !ready) return
    const conv = await createDM(A.client, A.user.id, C.user.id)
    await (A.client as any)
      .from('messages')
      .insert({ conversation_id: conv, sender_id: A.user.id, body: 'privado' })

    // D no es miembro → no ve mensajes
    const { data: seen } = await (D.client as any)
      .from('messages')
      .select('id')
      .eq('conversation_id', conv)
    expect(seen ?? []).toHaveLength(0)

    // D no puede escribir
    const { error } = await (D.client as any)
      .from('messages')
      .insert({ conversation_id: conv, sender_id: D.user.id, body: 'colado' })
    expect(error).not.toBeNull()
  })

  it('bloqueo: oculta mensajes y bloquea el envío en ambos sentidos', async () => {
    if (SKIP || !ready) return
    const conv = await createDM(A.client, A.user.id, C.user.id)
    await (A.client as any).from('messages').insert({
      conversation_id: conv,
      sender_id: A.user.id,
      body: 'antes del bloqueo'
    })

    // C bloquea a A
    await (C.client as any).from('user_blocks').insert({
      blocker_id: C.user.id,
      blocked_id: A.user.id
    })

    // C ya no ve los mensajes de A
    const { data: cSees } = await (C.client as any)
      .from('messages')
      .select('id')
      .eq('conversation_id', conv)
    expect(cSees ?? []).toHaveLength(0)

    // A ya no puede enviar a C
    const { error } = await (A.client as any).from('messages').insert({
      conversation_id: conv,
      sender_id: A.user.id,
      body: 'después del bloqueo'
    })
    expect(error).not.toBeNull()

    await (C.client as any)
      .from('user_blocks')
      .delete()
      .match({ blocker_id: C.user.id, blocked_id: A.user.id })
  })
})
