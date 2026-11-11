import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import { ModuleKind, transpileModule } from 'typescript'

const notificationId = '00000000-0000-4000-8000-000000000001'
const recipient = '00000000-0000-4000-8000-000000000002'
const token = 'ExpoPushToken[local_test_token]'
const source = readFileSync(
  resolve(process.cwd(), 'supabase/functions/send-push/index.ts'),
  'utf8'
)
const compiled = transpileModule(source, {
  compilerOptions: { module: ModuleKind.CommonJS }
}).outputText

// Ejecuta el handler real con base de datos y proveedor aislados: nunca abre conexiones.
function harness() {
  const notification = {
    id: notificationId,
    recipient_id: recipient,
    actor_id: null,
    type: 'dm_message',
    reference_id: null,
    reference_type: 'message',
    read_at: null
  }
  const preferences = {
    push_token: token,
    consent_given_at: '2026-11-10T00:00:00Z',
    push_dm: true
  }
  const rows: Record<string, { data: any; error: any }> = {
    notifications: { data: notification, error: null },
    notification_preferences: { data: preferences, error: null },
    users: {
      data: { id: recipient, username: 'lector', deleted_at: null },
      error: null
    },
    user_blocks: { data: [], error: null }
  }
  const eq = jest.fn()
  const update = jest.fn()
  const or = jest.fn()
  const from = jest.fn((table: string) => {
    let updating = false
    let selectedId = ''
    const chain: any = {
      select: jest.fn(() => chain),
      eq: jest.fn((column, value) => {
        if (column === 'id') selectedId = value
        eq(table, column, value)
        return chain
      }),
      update: jest.fn((values) => {
        updating = true
        update(table, values)
        return chain
      }),
      maybeSingle: jest.fn(
        async () => rows[`${table}:${selectedId}`] ?? rows[table]
      ),
      or: jest.fn((condition) => {
        or(condition)
        return chain
      }),
      limit: jest.fn(async () => rows[table]),
      then: (resolveValue: (value: unknown) => void) =>
        resolveValue(updating ? { error: null } : rows[table])
    }
    return chain
  })
  const rpc = jest.fn(async () => ({ data: true, error: null as unknown }))
  const provider = jest.fn(
    async (_url: string, _options: { body: string }) => ({
      ok: true,
      json: async () => ({ data: { status: 'ok' } })
    })
  )
  let handler: (request: any) => Promise<Response> = async () => {
    throw new Error('No handler')
  }
  runInNewContext(compiled, {
    exports: {},
    require: () => ({ createClient: () => ({ from, rpc }) }),
    Deno: {
      env: {
        get: (name: string) =>
          name === 'SUPABASE_URL' ? 'https://test.invalid' : 'local-test-key'
      },
      serve: (value: typeof handler) => {
        handler = value
      }
    },
    fetch: provider,
    Response,
    AbortSignal: { timeout: jest.fn() }
  })
  // Construye exclusivamente eventos sintéticos, incluso cuando intenta suplantar destinatarios.
  const request = (
    payload: any = {
      type: 'INSERT',
      schema: 'public',
      table: 'notifications',
      record: { id: notificationId }
    },
    method = 'POST',
    signature: string | null = 'a'.repeat(64),
    issuedAt = '1794268800'
  ) => ({
    method,
    headers: {
      get: (name: string) =>
        name === 'x-push-signature'
          ? signature
          : name === 'x-push-issued-at'
            ? issuedAt
            : null
    },
    json: async () => payload
  })
  return { handler, request, rows, rpc, provider, eq, update, from, or }
}

describe('send-push: autorización, consentimiento y ciclo del token', () => {
  it('rechaza método u origen sin consultar datos ni enviar', async () => {
    const h = harness()
    expect((await h.handler(h.request(undefined, 'GET'))).status).toBe(405)
    expect((await h.handler(h.request(undefined, 'POST', null))).status).toBe(
      403
    )
    h.rpc.mockResolvedValueOnce({ data: false, error: null })
    expect((await h.handler(h.request())).status).toBe(403)
    expect(h.from).not.toHaveBeenCalled()
    expect(h.provider).not.toHaveBeenCalled()
  })
  it.each([
    ['invalid', '1794268800'],
    ['a'.repeat(64), 'not-an-epoch'],
    ['a'.repeat(64), '9999999999999']
  ])(
    'rechaza headers no firmados o fecha mal formada',
    async (signature, issuedAt) => {
      const h = harness()
      expect(
        (await h.handler(h.request(undefined, 'POST', signature, issuedAt)))
          .status
      ).toBe(403)
      expect(h.rpc).not.toHaveBeenCalled()
      expect(h.provider).not.toHaveBeenCalled()
    }
  )
  it('envía a la RPC solo ID, fecha y firma y nunca acepta el header secreto anterior', async () => {
    const h = harness()
    await h.handler(h.request())
    expect(h.rpc).toHaveBeenCalledWith('verify_push_webhook_event', {
      p_notification_id: notificationId,
      p_issued_at: 1794268800,
      p_signature: 'a'.repeat(64)
    })
    const legacy = h.request()
    legacy.headers.get = (name: string) =>
      name === 'x-webhook-secret' ? 'old-secret' : null
    expect((await h.handler(legacy)).status).toBe(403)
    expect(h.rpc).toHaveBeenCalledTimes(1)
  })
  it('falla cerrado si no se puede verificar Vault', async () => {
    const h = harness()
    h.rpc.mockResolvedValueOnce({
      data: false,
      error: { message: 'unavailable' }
    })
    expect((await h.handler(h.request())).status).toBe(503)
    expect(h.from).not.toHaveBeenCalled()
  })
  it.each([
    {
      type: 'UPDATE',
      schema: 'public',
      table: 'notifications',
      record: { id: notificationId }
    },
    {
      type: 'INSERT',
      schema: 'other',
      table: 'notifications',
      record: { id: notificationId }
    },
    {
      type: 'INSERT',
      schema: 'public',
      table: 'users',
      record: { id: notificationId }
    },
    {
      type: 'INSERT',
      schema: 'public',
      table: 'notifications',
      record: { id: 'invalid' }
    }
  ])('rechaza sobres adulterados', async (payload) => {
    const h = harness()
    expect((await h.handler(h.request(payload))).status).toBe(400)
    expect(h.from).not.toHaveBeenCalled()
    expect(h.provider).not.toHaveBeenCalled()
  })
  it('usa destinatario, tipo y referencias canónicas y no contenido privado del evento', async () => {
    const h = harness()
    const response = await h.handler(
      h.request({
        type: 'INSERT',
        schema: 'public',
        table: 'notifications',
        record: {
          id: notificationId,
          recipient_id: 'forged',
          type: 'new_follower',
          body: 'PRIVATE TEXT'
        }
      })
    )
    expect(response.status).toBe(200)
    expect(h.eq).toHaveBeenCalledWith(
      'notification_preferences',
      'user_id',
      recipient
    )
    const body = JSON.parse(h.provider.mock.calls[0][1].body)
    expect(body.to).toBe(token)
    expect(body.data.type).toBe('dm_message')
    expect(body.body).toBe('Te envió un mensaje')
    expect(JSON.stringify(body)).not.toContain('PRIVATE TEXT')
    expect(await response.text()).toBe('Accepted')
  })
  it.each([
    null,
    { push_token: token, consent_given_at: null, push_dm: true },
    { push_token: token, consent_given_at: 'today', push_dm: false },
    { push_token: token, consent_given_at: 'today', push_dm: null },
    { push_token: 'declined', consent_given_at: 'today', push_dm: true },
    { push_token: 'arbitrary-token', consent_given_at: 'today', push_dm: true }
  ])(
    'no envía sin consentimiento, habilitación explícita y token válido',
    async (prefs) => {
      const h = harness()
      h.rows.notification_preferences.data = prefs
      expect((await h.handler(h.request())).status).toBe(200)
      expect(h.provider).not.toHaveBeenCalled()
    }
  )
  it.each(['notifications', 'notification_preferences'])(
    'no envía si falla la consulta %s',
    async (table) => {
      const h = harness()
      h.rows[table].error = { message: 'query failed' }
      expect((await h.handler(h.request())).status).toBe(503)
      expect(h.provider).not.toHaveBeenCalled()
    }
  )
  it.each([null, { read_at: 'today' }, { type: '__proto__' }])(
    'omite notificación ausente, leída o tipo desconocido',
    async (patch) => {
      const h = harness()
      h.rows.notifications.data = patch
        ? { ...h.rows.notifications.data, ...patch }
        : null
      expect((await h.handler(h.request())).status).toBe(200)
      expect(h.provider).not.toHaveBeenCalled()
    }
  )
  it.each([null, { id: recipient, deleted_at: 'today' }])(
    'omite destinatarios ausentes o eliminados',
    async (profile) => {
      const h = harness()
      h.rows.users.data = profile
      expect((await h.handler(h.request())).status).toBe(200)
      expect(h.provider).not.toHaveBeenCalled()
    }
  )
  it.each([null, { username: 'lector', deleted_at: 'today' }])(
    'omite actores ausentes o eliminados',
    async (profile) => {
      const h = harness()
      h.rows.notifications.data.actor_id =
        '00000000-0000-4000-8000-000000000003'
      h.rows['users:00000000-0000-4000-8000-000000000003'] = {
        data: profile,
        error: null
      }
      expect((await h.handler(h.request())).status).toBe(200)
      expect(h.provider).not.toHaveBeenCalled()
    }
  )
  it.each([null, [{ id: 'block' }]])(
    'no envía si la relación está bloqueada o no pudo comprobarse',
    async (blocks) => {
      const h = harness()
      const actor = '00000000-0000-4000-8000-000000000003'
      h.rows.notifications.data.actor_id = actor
      h.rows.user_blocks.data = blocks
      expect((await h.handler(h.request())).status).toBe(200)
      expect(h.or).toHaveBeenCalledWith(
        `and(blocker_id.eq.${actor},blocked_id.eq.${recipient}),and(blocker_id.eq.${recipient},blocked_id.eq.${actor})`
      )
      expect(h.provider).not.toHaveBeenCalled()
    }
  )
  it.each(['users', 'user_blocks'])(
    'falla cerrado si no se pudo revalidar %s',
    async (table) => {
      const h = harness()
      h.rows.notifications.data.actor_id =
        '00000000-0000-4000-8000-000000000003'
      h.rows[table].error = { message: 'query failed' }
      expect((await h.handler(h.request())).status).toBe(503)
      expect(h.provider).not.toHaveBeenCalled()
    }
  )
  it('envía tras revalidar actor y ausencia de bloqueos con datos canónicos', async () => {
    const h = harness()
    h.rows.notifications.data.actor_id = '00000000-0000-4000-8000-000000000003'
    expect((await h.handler(h.request())).status).toBe(200)
    const body = JSON.parse(h.provider.mock.calls[0][1].body)
    expect(body.title).toBe('@lector')
    expect(body.body).toBe('Te envió un mensaje')
    expect(h.or).toHaveBeenCalledTimes(1)
  })
  it.each(['InvalidCredentials', 'MismatchSenderId'])(
    'conserva token cuando falla configuración %s',
    async (error) => {
      const h = harness()
      h.provider.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { status: 'error', details: { error } } })
      } as any)
      expect((await h.handler(h.request())).status).toBe(502)
      expect(h.update).not.toHaveBeenCalled()
    }
  )
  it('limpia solo el token que Expo declaró DeviceNotRegistered', async () => {
    const h = harness()
    h.provider.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { status: 'error', details: { error: 'DeviceNotRegistered' } }
      })
    } as any)
    expect((await h.handler(h.request())).status).toBe(200)
    expect(h.update).toHaveBeenCalledWith('notification_preferences', {
      push_token: null
    })
    expect(h.eq).toHaveBeenCalledWith(
      'notification_preferences',
      'push_token',
      token
    )
  })
})
