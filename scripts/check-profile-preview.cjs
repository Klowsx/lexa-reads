const assert = require('node:assert/strict')
const { mkdirSync } = require('node:fs')
const { chromium } = require(
  require.resolve('playwright', {
    paths: [process.env.LEXA_BROWSER_MODULES || process.cwd()]
  })
)
const { fixture } = require('./check-auth-preview.cjs')
const base = process.env.LEXA_PROFILE_PREVIEW_URL || 'http://localhost:8082'
const errors = []

// Simula la API HTTP para recorrer el cliente sin modificar cuentas reales; SQL comprueba los permisos.
async function profileFixture(browser, width = 390) {
  const f = await fixture(browser, { signedIn: true, completed: true })
  await f.page.setViewportSize({ width, height: 900 })
  f.page.setDefaultTimeout(20000)
  f.page.on('pageerror', (e) => errors.push(e.message))
  Object.assign(f.state.profile, {
    display_name: 'Lucía Serrano',
    bio: 'Leo entre el café de la mañana y el último tren. Cuentos, memoria y alguna novela que no termina.',
    favorite_genres: ['realismo', 'clasico'],
    books_read_count: 18,
    reviews_count: 7,
    followers_count: 26,
    following_count: 41,
    is_private: true,
    created_at: '2025-02-01T12:00:00Z'
  })
  const target = {
    ...f.state.profile,
    id: 'a67be1e7-28f1-47c6-9167-cb8077177b0e',
    username: 'ines_lee',
    display_name: 'Inés Molina',
    bio: 'Historias pequeñas que se quedan mucho tiempo. Leyendo desde Bogotá.',
    is_private: true
  }
  const book = {
    id: 'a67be1e7-28f1-47c6-9167-cb8077177b0f',
    google_books_id: 'profile-preview',
    title: 'El verano que vuelve',
    authors: ['Clara Vidal'],
    cover_url: null,
    page_count: 240
  }
  const list = {
    id: 'list-preview',
    user_id: target.id,
    name: 'Libros para volver',
    slug: 'libros-para-volver',
    description: 'Lecturas que merecen otra visita.',
    visibility: 'public',
    books_count: 4,
    likes_count: 2,
    is_featured: false,
    preview_books: [],
    accent_color: null
  }
  const state = {
    target,
    relation: null,
    failFollow: false,
    failResponse: false,
    failSave: false,
    missing: false,
    requests: [
      {
        follow_id: 'request-1',
        created_at: '2026-10-20T10:00:00Z',
        requester: target
      }
    ],
    calls: [],
    protectedReads: 0,
    followWrites: 0
  }
  await f.context.route('**/rest/v1/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      name = url.pathname.split('/').pop(),
      select = url.searchParams.get('select') || '',
      method = req.method()
    const object = req.headers().accept?.includes('object+json')
    const eq = (key) => url.searchParams.get(key)?.replace('eq.', '')
    state.calls.push({ name, select, method })
    let body = []
    if (name === 'users') {
      if (method === 'PATCH') {
        if (state.failSave)
          return route.fulfill({
            status: 400,
            json: { message: 'Fallo al guardar' }
          })
        Object.assign(f.state.profile, req.postDataJSON())
        body = f.state.profile
      } else {
        const user =
          eq('username') === target.username || eq('id') === target.id
            ? state.missing
              ? null
              : target
            : f.state.profile
        body = object ? user : user ? [user] : []
      }
    } else if (name === 'follows') {
      if (method === 'POST') {
        state.followWrites++
        if (state.failFollow)
          return route.fulfill({
            status: 400,
            json: { message: 'Seguimiento no guardado' }
          })
        state.relation = target.is_private ? 'pending' : 'accepted'
        body = { status: state.relation }
      } else if (method === 'DELETE' && eq('id')) {
        if (state.failResponse)
          return route.fulfill({
            status: 400,
            json: { message: 'Respuesta no guardada' }
          })
        state.requests = []
      } else if (method === 'DELETE') {
        state.relation = null
      } else if (method === 'PATCH') {
        if (state.failResponse)
          return route.fulfill({
            status: 400,
            json: { message: 'Respuesta no guardada' }
          })
        state.requests = []
        f.state.profile.followers_count++
        body = { id: 'request-1' }
      } else if (select.includes('requester:')) body = state.requests
      else if (select.includes('person:'))
        body = [
          {
            id: 'connection-1',
            created_at: '2026-10-20T10:00:00Z',
            person: f.state.profile
          },
          {
            id: 'connection-2',
            created_at: '2026-10-20T10:00:00Z',
            person: target
          }
        ]
      else
        body = state.relation
          ? [{ id: 'follow-preview', status: state.relation }]
          : []
    } else if (name === 'user_books') {
      if (eq('user_id') === target.id) state.protectedReads++
      body = [
        {
          id: 'read-preview',
          user_id: eq('user_id'),
          status: eq('status') ?? 'read',
          rating: 4.5,
          current_page: 88,
          finished_at: '2026-10-01',
          books: book
        }
      ]
    } else if (name === 'lists') {
      if (eq('user_id') === target.id) state.protectedReads++
      body = [{ ...list, user_id: eq('user_id') }]
    } else if (name === 'notification_preferences') return route.fallback()
    else if (name === 'user_blocks') body = []
    if (method === 'HEAD')
      return route.fulfill({
        status: 200,
        headers: {
          'content-range': '0-0/8',
          'access-control-expose-headers': 'content-range'
        }
      })
    return route.fulfill({ json: body })
  })
  return { ...f, social: state }
}

// Espera que las mutaciones y sus invalidaciones terminen antes de comprobar el resultado visible.
async function eventually(check) {
  const limit = Date.now() + 20000
  while (!check()) {
    if (Date.now() > limit) throw new Error('Estado esperado no alcanzado')
    await new Promise((r) => setTimeout(r, 100))
  }
}

// Comprueba privacidad sin consultas anticipadas, seguimiento persistido, errores y edición del perfil.
async function main() {
  mkdirSync('.expo/profile-preview', { recursive: true })
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const f = await profileFixture(browser)
    const { page, social: s } = f
    await page.goto(base + '/user/ines_lee', { timeout: 120000 })
    await page
      .getByRole('button', { name: 'Solicitar seguimiento', exact: true })
      .waitFor({ timeout: 120000 })
    await page
      .getByText(
        'Sus lecturas, reseñas y listas están reservadas a seguidores aceptados. Solicita seguir esta cuenta para verlas.',
        { exact: true }
      )
      .waitFor()
    assert.equal(s.protectedReads, 0)
    await page.screenshot({ path: '.expo/profile-preview/private-light.png' })
    s.failFollow = true
    await page
      .getByRole('button', { name: 'Solicitar seguimiento', exact: true })
      .click()
    await page
      .getByText('No pudimos actualizar el seguimiento. Vuelve a intentarlo.', {
        exact: true
      })
      .waitFor()
    s.failFollow = false
    await page
      .getByRole('button', { name: 'Solicitar seguimiento', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Cancelar solicitud', exact: true })
      .waitFor()
    assert.equal(s.protectedReads, 0)
    await page.reload()
    await page
      .getByRole('button', { name: 'Cancelar solicitud', exact: true })
      .waitFor()
    await page
      .getByRole('button', { name: 'Cancelar solicitud', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Solicitar seguimiento', exact: true })
      .waitFor()
    s.relation = 'accepted'
    await page.reload()
    await page.getByRole('button', { name: 'Siguiendo', exact: true }).waitFor()
    await page.getByText('Libros para volver', { exact: true }).waitFor()
    assert.ok(s.protectedReads > 0)
    await page.screenshot({ path: '.expo/profile-preview/accepted-light.png' })
    await page.getByRole('button', { name: '7 Reseñas', exact: true }).click()
    s.relation = null
    await page.goBack()
    await page
      .getByRole('button', { name: 'Solicitar seguimiento', exact: true })
      .waitFor()
    assert.equal(
      await page.getByText('Libros para volver', { exact: true }).count(),
      0
    )
    s.relation = 'accepted'
    await page.reload()
    await page.getByRole('button', { name: 'Siguiendo', exact: true }).waitFor()
    await page.getByRole('button', { name: 'Siguiendo', exact: true }).click()
    await page
      .getByRole('button', { name: 'Dejar de seguir', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Solicitar seguimiento', exact: true })
      .waitFor()
    assert.equal(
      await page.getByText('Libros para volver', { exact: true }).count(),
      0
    )
    s.target.is_private = false
    await page.goto(base + '/followers?username=user_preview&tab=followers')
    await page.getByRole('button', { name: 'Seguir', exact: true }).waitFor()
    assert.equal(
      await page.getByRole('button', { name: 'Seguir', exact: true }).count(),
      1
    )
    await page.getByRole('button', { name: 'Seguir', exact: true }).click()
    await page.getByRole('button', { name: 'Siguiendo', exact: true }).waitFor()
    s.target.is_private = true
    await page.goto(base + '/followers?username=ines_lee&tab=followers')
    s.relation = null
    await page.reload()
    await page.getByText('Cuenta privada', { exact: true }).waitFor()
    assert.equal(
      await page.getByRole('button', { name: 'Seguir', exact: true }).count(),
      0
    )
    await page.goto(base + '/profile')
    await page
      .getByText('Solicitudes de seguimiento', { exact: true })
      .waitFor()
    s.failResponse = true
    await page
      .getByRole('button', {
        name: 'Aceptar solicitud de @ines_lee',
        exact: true
      })
      .click()
    await page
      .getByText(
        'No pudimos responder. La solicitud sigue aquí para reintentar.',
        { exact: true }
      )
      .waitFor()
    s.failResponse = false
    await page
      .getByRole('button', {
        name: 'Aceptar solicitud de @ines_lee',
        exact: true
      })
      .click()
    await page
      .getByText('Solicitudes de seguimiento', { exact: true })
      .waitFor({ state: 'detached' })
    s.requests = [
      {
        follow_id: 'request-2',
        created_at: '2026-10-20T10:00:00Z',
        requester: s.target
      }
    ]
    await page.reload()
    await page
      .getByRole('button', {
        name: 'Rechazar solicitud de @ines_lee',
        exact: true
      })
      .click()
    await page
      .getByText('Solicitudes de seguimiento', { exact: true })
      .waitFor({ state: 'detached' })
    assert.equal(f.state.profile.followers_count, 27)
    await page
      .getByRole('button', { name: 'Editar perfil', exact: true })
      .click()
    await page
      .getByRole('switch', { name: 'Cuenta privada', exact: true })
      .click()
    await page
      .getByRole('textbox', { name: 'Nombre', exact: true })
      .fill('Lucía de los libros')
    s.failSave = true
    await page
      .getByRole('button', { name: 'Guardar cambios', exact: true })
      .click()
    await page.getByRole('textbox', { name: 'Nombre', exact: true }).waitFor()
    await eventually(() =>
      s.calls.some((c) => c.name === 'users' && c.method === 'PATCH')
    )
    s.failSave = false
    await page
      .getByRole('button', { name: 'Guardar cambios', exact: true })
      .click()
    await page
      .getByRole('textbox', { name: 'Nombre', exact: true })
      .waitFor({ state: 'detached' })
    assert.equal(f.state.profile.display_name, 'Lucía de los libros')
    assert.equal(f.state.profile.is_private, false)
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      await page.screenshot({ path: `.expo/profile-preview/own-${width}.png` })
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth
        ),
        false
      )
    }
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.waitForFunction(
      () => document.querySelector('svg')?.getAttribute('stroke') === '#F0EAE2'
    )
    await page.screenshot({ path: '.expo/profile-preview/own-dark.png' })
    s.missing = true
    await page.goto(base + '/user/ines_lee')
    await page.getByText('Perfil no disponible', { exact: true }).waitFor()
    await f.context.close()
    assert.deepEqual(errors, [])
    console.log(
      'Perfil: privacidad, seguimiento/cancelación, solicitudes, errores, edición y diseño adaptable verificados.'
    )
  } finally {
    await browser.close()
  }
}
main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
