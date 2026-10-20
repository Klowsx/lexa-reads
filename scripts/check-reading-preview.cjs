const assert = require('node:assert/strict')
const { mkdirSync } = require('node:fs')
const { chromium } = require(
  require.resolve('playwright', {
    paths: [process.env.LEXA_BROWSER_MODULES || process.cwd()]
  })
)
const { fixture } = require('./check-auth-preview.cjs')
const base = process.env.LEXA_READING_PREVIEW_URL || 'http://localhost:8082'
const errors = []
const book = {
  id: 'a67be1e7-28f1-47c6-9167-cb8077177b0e',
  google_books_id: 'reading-preview',
  title: 'Los días de la biblioteca',
  authors: ['Elena de prueba'],
  cover_url: null,
  page_count: 240,
  genres: ['Ficción'],
  published_year: 2025,
  description:
    'Una lectura para comprobar el registro personal, las fechas y la puntuación desde cada entrada de la aplicación.',
  language: 'es',
  published_date: '2025-01-01',
  publisher: 'Biblioteca',
  isbn_13: null
}

// Añade datos sintéticos sobre el cliente real; las reglas SQL se verifican por separado en Supabase.
async function readingFixture(browser, width = 390) {
  const f = await fixture(browser, { signedIn: true, completed: true })
  await f.page.setViewportSize({ width, height: 844 })
  f.page.setDefaultTimeout(20000)
  f.page.on('pageerror', (error) => errors.push(error.message))
  const today = new Date().toLocaleDateString('en-CA')
  const state = {
    record: null,
    failNext: false,
    failLoad: false,
    requests: [],
    today,
    calls: 0
  }
  await f.context.route('**/rest/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const name = url.pathname.split('/').pop()
    const select = url.searchParams.get('select') || ''
    const isObject = request.headers().accept?.includes('object+json')
    state.requests.push({ name, select, method: request.method() })
    let body = []
    let status = 200
    let count = 0
    if (name === 'save_reading_record') {
      state.calls++
      if (state.failNext) {
        state.failNext = false
        return route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Fallo simulado' })
        })
      }
      const { p_changes: changes, p_today: day } = request.postDataJSON()
      const previous = state.record
      const nextStatus = changes.status ?? previous?.status ?? 'want_to_read'
      const next = {
        id: 'reading-row',
        user_id: f.session.user.id,
        book_id: book.id,
        rating: null,
        tags: ['favoritos'],
        started_at: null,
        finished_at: null,
        ...previous,
        status: nextStatus
      }
      if (nextStatus !== previous?.status) {
        if (nextStatus === 'want_to_read') next.started_at = null
        if (
          nextStatus === 'reading' &&
          (!next.started_at || previous?.status === 'read')
        )
          next.started_at = day
        next.finished_at = nextStatus === 'read' ? day : null
      }
      Object.assign(next, changes)
      state.record = next
      f.state.profile.books_read_count = nextStatus === 'read' ? 1 : 0
      body = next
    } else if (name === 'library_summary') {
      body = state.record
        ? [
            {
              status: state.record.status,
              total: 1,
              tags: state.record.tags ?? []
            }
          ]
        : []
    } else if (name === 'search_library') {
      const filters = request.postDataJSON()
      body =
        state.record?.status === filters.p_status
          ? [{ ...state.record, books: book }]
          : []
    } else if (name === 'books') body = isObject ? book : [book]
    else if (name === 'user_books') {
      if (state.failLoad) {
        status = 503
        body = { message: 'Lectura no disponible' }
      } else if (url.searchParams.has('created_at'))
        body = Array.from({ length: 5 }, () => ({
          book_id: book.id,
          books: book
        }))
      else {
        const filter = url.searchParams.get('status')?.replace('eq.', '')
        let rows =
          state.record && (!filter || state.record.status === filter)
            ? [{ ...state.record, books: book }]
            : []
        if (url.searchParams.has('finished_at')) {
          const year = new Date().getFullYear()
          rows = rows.filter((row) => row.finished_at?.startsWith(`${year}-`))
        }
        count = rows.length
        body = isObject ? (rows[0] ?? null) : rows
      }
    } else if (name === 'lists') {
      body = url.searchParams.has('slug')
        ? {
            id: 'list-preview',
            user_id: f.session.user.id,
            name: 'Lecturas de prueba',
            slug: 'lecturas-preview',
            visibility: 'public',
            books_count: 1,
            likes_count: 0,
            accent_color: null,
            items: [{ id: 'list-book-preview', position: 1, book }]
          }
        : []
    } else if (name === 'activity_feed')
      body = [
        {
          id: 'feed-preview',
          user: {
            id: f.session.user.id,
            username: 'user_preview',
            display_name: 'Lectura'
          },
          book,
          activity_type: 'started_book',
          likes_count: 0,
          created_at: new Date().toISOString()
        }
      ]
    else if (name === 'users') {
      if (
        url.searchParams.get('id')?.startsWith('eq.') ||
        url.searchParams.has('username')
      )
        return route.fallback()
      body = []
    } else if (name === 'notification_preferences') return route.fallback()
    if (request.method() === 'HEAD')
      return route.fulfill({
        status: 200,
        headers: {
          'content-range': `0-0/${count}`,
          'access-control-expose-headers': 'content-range'
        }
      })
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body)
    })
  })
  return { ...f, reading: state }
}

// Espera a que termine la escritura y la invalidación antes de continuar con otro gesto.
async function saved(page) {
  await page.getByText('Lectura guardada', { exact: true }).last().waitFor()
  await page
    .getByRole('button', { name: 'Leído', exact: true })
    .last()
    .click({ trial: true })
}

// Comprueba edición, medias estrellas, retirada, fechas históricas y reversión de errores en la ficha.
async function detail(browser) {
  const f = await readingFixture(browser)
  const { page, reading: state } = f
  try {
    await page.goto(base + '/book/' + book.google_books_id)
    await page.getByRole('button', { name: 'Pendiente', exact: true }).waitFor()
    for (const label of [
      'Pendiente',
      'Leyendo',
      'Leído',
      'Abandonado',
      'Leído'
    ]) {
      await page.getByRole('button', { name: label, exact: true }).click()
      await saved(page)
    }
    assert.equal(state.record.finished_at, state.today)
    const calls = state.calls
    await page.getByRole('button', { name: 'Leído', exact: true }).click()
    assert.equal(state.calls, calls)
    await page
      .getByRole('button', {
        name: 'Puntuar con 4 de 5 estrellas',
        exact: true
      })
      .click()
    await saved(page)
    await page
      .getByRole('button', {
        name: 'Puntuar con 3.5 de 5 estrellas',
        exact: true
      })
      .click()
    await saved(page)
    assert.equal(state.record.rating, 3.5)
    await page
      .getByRole('button', { name: 'Quitar puntuación', exact: true })
      .click()
    await saved(page)
    assert.equal(state.record.rating, null)
    await page
      .getByRole('button', { name: 'Quitar puntuación', exact: true })
      .waitFor({ state: 'hidden' })
    await page
      .getByRole('button', { name: 'Editar fechas de lectura', exact: true })
      .click()
    await page
      .getByLabel('Fecha de inicio (opcional)', { exact: true })
      .fill('2025-01-01')
    await page
      .getByLabel('Fecha de finalización', { exact: true })
      .fill('2025-12-31')
    await page
      .getByRole('button', { name: 'Guardar fechas', exact: true })
      .click()
    await saved(page)
    await page
      .getByText('Cuenta para tu meta de 2025.', { exact: true })
      .waitFor()
    await page
      .getByRole('button', {
        name: 'Puntuar con 5 de 5 estrellas',
        exact: true
      })
      .click()
    await saved(page)
    assert.equal(state.record.finished_at, '2025-12-31')
    state.failNext = true
    await page
      .getByRole('button', { name: 'Quitar puntuación', exact: true })
      .click()
    await page.getByText(/No se guardaron los cambios/).waitFor()
    assert.equal(state.record.rating, 5)
    await page
      .getByRole('button', { name: 'Quitar puntuación', exact: true })
      .waitFor()
    await page
      .getByRole('button', { name: 'Editar fechas de lectura', exact: true })
      .click()
    await page
      .getByLabel('Fecha de finalización', { exact: true })
      .fill('2024-12-31')
    await page
      .getByText(
        'La finalización debe ser el mismo día o después del inicio.',
        { exact: true }
      )
      .waitFor()
    assert.equal(
      await page
        .getByRole('button', { name: 'Guardar fechas', exact: true })
        .isDisabled(),
      true
    )
    await page
      .getByLabel('Fecha de finalización', { exact: true })
      .fill('2025-12-30')
    await page.screenshot({ path: '.expo/reading-preview/detail-dates.png' })
    await page
      .getByRole('button', { name: 'Guardar fechas', exact: true })
      .click()
    await saved(page)
    await page
      .getByRole('button', { name: 'Cambiar estado de lectura', exact: true })
      .click()
    await page.getByText('Tu lectura', { exact: true }).waitFor()
    await page
      .getByRole('button', { name: 'Pendiente', exact: true })
      .last()
      .click()
    await saved(page)
    assert.equal(state.record.started_at, null)
    assert.equal(state.record.finished_at, null)
    await page.getByRole('button', { name: 'Cerrar', exact: true }).click()
    const refreshed = state.requests.some(
      (r) => r.name === 'users' && r.method === 'GET'
    )
    assert.equal(refreshed, true)
    console.log(
      'Ficha: cuatro estados, nota completa/media, retirada, fechas, validación y rollback correctos'
    )
  } finally {
    await f.context.close()
  }
}

// Recorre las entradas existentes y verifica el mismo editor en claro/oscuro y pantallas pequeñas.
async function entries(browser) {
  for (const entry of ['search', 'library', 'feed', 'list']) {
    const f = await readingFixture(browser, entry === 'search' ? 320 : 390)
    const { page, reading: state } = f
    try {
      if (entry === 'library')
        state.record = {
          id: 'reading-row',
          user_id: f.session.user.id,
          book_id: book.id,
          status: 'reading',
          started_at: state.today,
          finished_at: null,
          rating: 2.5
        }
      const path = entry === 'list' ? '/list/lecturas-preview' : '/' + entry
      await page.goto(base + path)
      if (entry === 'search') {
        await page
          .getByRole('button', {
            name: 'Guardar o valorar ' + book.title,
            exact: true
          })
          .click()
      } else if (entry === 'feed')
        await page
          .getByRole('button', { name: 'Vistazo al libro', exact: true })
          .click()
      else if (entry === 'list')
        await page
          .getByRole('button', {
            name: 'Registrar lectura: ' + book.title,
            exact: true
          })
          .click()
      else await page.getByText(book.title, { exact: true }).first().click()
      await page.getByText('Tu lectura', { exact: true }).waitFor()
      await page.getByRole('button', { name: 'Leído', exact: true }).click()
      await saved(page)
      assert.equal(state.record.status, 'read')
      assert.equal(state.record.finished_at, state.today)
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth
        ),
        false
      )
      await page.screenshot({ path: `.expo/reading-preview/${entry}.png` })
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.waitForFunction(
        () =>
          document
            .querySelector('[aria-label="Puntuar con 1 de 5 estrellas"] svg')
            ?.getAttribute('stroke') === '#F0EAE2'
      )
      await page.screenshot({ path: `.expo/reading-preview/${entry}-dark.png` })
      if (entry === 'list') {
        await page.setViewportSize({ width: 1280, height: 900 })
        await page.screenshot({
          path: '.expo/reading-preview/desktop-dark.png'
        })
      }
      console.log(
        `Entrada ${entry}: estado y fechas guardados desde la hoja compartida`
      )
    } catch (error) {
      await page.screenshot({
        path: `.expo/reading-preview/${entry}-failure.png`
      })
      console.error(
        'Entrada fallida:',
        entry,
        await page.locator('body').innerText()
      )
      throw error
    } finally {
      await f.context.close()
    }
  }
}

// Verifica que las entradas del perfil funcionan y que la meta cambia al volver sin recargar la aplicación.
async function goal(browser) {
  const f = await readingFixture(browser)
  const { page, reading: state } = f
  state.record = {
    id: 'reading-row',
    user_id: f.session.user.id,
    book_id: book.id,
    status: 'reading',
    started_at: state.today,
    finished_at: null,
    rating: 3
  }
  try {
    await page.goto(base + '/profile')
    await page.getByText('0 de 12 libros', { exact: true }).waitFor()
    await page
      .getByRole('button', { name: new RegExp('^' + book.title) })
      .first()
      .click()
    await page.waitForURL('**/book/' + book.google_books_id)
    await page.getByRole('button', { name: 'Leído', exact: true }).click()
    await saved(page)
    await page.goBack()
    await page.getByText('1 de 12 libros', { exact: true }).waitFor()
    await page
      .getByRole('button', { name: new RegExp('^' + book.title) })
      .first()
      .click()
    await page.waitForURL('**/book/' + book.google_books_id)
    await page
      .getByRole('button', { name: 'Editar fechas de lectura', exact: true })
      .click()
    await page
      .getByLabel('Fecha de inicio (opcional)', { exact: true })
      .fill('')
    await page
      .getByLabel('Fecha de finalización', { exact: true })
      .fill('2025-12-31')
    await page
      .getByRole('button', { name: 'Guardar fechas', exact: true })
      .click()
    await saved(page)
    await page.goBack()
    await page.getByText('0 de 12 libros', { exact: true }).waitFor()
    await page.screenshot({ path: '.expo/reading-preview/goal.png' })
    console.log(
      'Perfil y meta: navegación de lecturas actuales/recientes y contador anual actualizado sin recargar'
    )
  } catch (error) {
    console.error(await page.locator('body').innerText())
    throw error
  } finally {
    await f.context.close()
  }
}

// Arranca un navegador aislado y garantiza su cierre incluso si falla una comprobación.
async function main() {
  mkdirSync('.expo/reading-preview', { recursive: true })
  const browser = await chromium.launch({
    channel: process.env.LEXA_BROWSER_CHANNEL || 'msedge',
    headless: true
  })
  try {
    await detail(browser)
    await entries(browser)
    await goal(browser)
    assert.deepEqual(errors, [])
    console.log('Registro de lectura verificado con respuestas HTTP simuladas.')
  } finally {
    await browser.close()
  }
}
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
