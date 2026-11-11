import assert from 'node:assert/strict'
import { deleteAccountHandler } from './handler.ts'

// Solo sustituye el transporte del SDK real; no usa cuentas, JWT ni servicios existentes.
const ORIGIN = 'https://lexa-account-test.invalid'
const ACTOR = '10000000-0000-4000-8000-000000000001'
const TOKEN = 'synthetic-access-token'

// Comprueba el protocolo sin llegar a crear clientes ni necesitar configuración de Supabase.
Deno.test(
  'delete-account: OPTIONS, método y autorización inválida',
  async () => {
    for (const [method, authorization, status] of [
      ['OPTIONS', undefined, 200],
      ['GET', undefined, 405],
      ['POST', undefined, 401],
      ['POST', 'Basic synthetic', 401],
      ['POST', 'Bearer ', 401]
    ] as const) {
      const response = await deleteAccountHandler(
        new Request(ORIGIN, {
          method,
          headers: authorization ? { Authorization: authorization } : undefined
        })
      )
      assert.equal(response.status, status)
      assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*')
      await response.text()
    }
  }
)

// Valida la integración del handler con el SDK: getUser, idempotencia y JWT del cierre global.
Deno.test(
  'delete-account: revoca con JWT validado al crear y al reintentar',
  async () => {
    const originalFetch = globalThis.fetch
    // Se escriben solo valores sintéticos; no se leen ni conservan variables del entorno anfitrión.
    Deno.env.set('SUPABASE_URL', ORIGIN)
    Deno.env.set('SUPABASE_ANON_KEY', 'synthetic-anon-key')
    Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'synthetic-service-key')
    try {
      for (const existing of [false, true]) {
        const calls: string[] = []
        globalThis.fetch = async (input, init) => {
          const request = new Request(input, init)
          const url = new URL(request.url)
          assert.equal(url.origin, ORIGIN)
          calls.push(`${request.method} ${url.pathname}`)
          if (url.pathname === '/auth/v1/user') {
            assert.equal(
              request.headers.get('Authorization'),
              `Bearer ${TOKEN}`
            )
            return Response.json({ id: ACTOR })
          }
          if (url.pathname === '/rest/v1/account_deletion_requests') {
            if (request.method === 'GET') {
              assert.equal(url.searchParams.get('user_id'), `eq.${ACTOR}`)
              return Response.json(
                existing ? [{ id: 'synthetic-request' }] : []
              )
            }
            assert.equal(request.method, 'POST')
            assert.deepEqual(await request.json(), { user_id: ACTOR })
            return new Response(null, { status: 201 })
          }
          assert.equal(url.pathname, '/auth/v1/logout')
          assert.equal(request.method, 'POST')
          assert.equal(url.searchParams.get('scope'), 'global')
          // Esta aserción falla con el UUID usado antes de la corrección.
          assert.equal(request.headers.get('Authorization'), `Bearer ${TOKEN}`)
          return new Response(null, { status: 204 })
        }
        const response = await deleteAccountHandler(
          new Request(ORIGIN, {
            method: 'POST',
            headers: { Authorization: `bEaReR ${TOKEN}` }
          })
        )
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), {
          ok: true,
          alreadyRequested: existing
        })
        assert.deepEqual(calls, [
          'GET /auth/v1/user',
          'GET /rest/v1/account_deletion_requests',
          ...(!existing ? ['POST /rest/v1/account_deletion_requests'] : []),
          'POST /auth/v1/logout'
        ])
      }
    } finally {
      globalThis.fetch = originalFetch
      Deno.env.delete('SUPABASE_URL')
      Deno.env.delete('SUPABASE_ANON_KEY')
      Deno.env.delete('SUPABASE_SERVICE_ROLE_KEY')
    }
  }
)
