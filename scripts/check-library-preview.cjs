const assert = require('node:assert/strict')
const { mkdirSync } = require('node:fs')
const { chromium } = require(
  require.resolve('playwright', {
    paths: [process.env.LEXA_BROWSER_MODULES || process.cwd()]
  })
)
const { fixture } = require('./check-auth-preview.cjs')
const base = process.env.LEXA_LIBRARY_PREVIEW_URL || 'http://localhost:8082'
const errors = []

// Alimenta el cliente real con páginas sintéticas; SQL comprueba filtros y permisos por separado.
async function libraryFixture(browser, width = 390) {
  const f = await fixture(browser, { signedIn: true, completed: true })
  await f.page.setViewportSize({ width, height: 844 })
  f.page.setDefaultTimeout(20000)
  f.page.on('pageerror', (e) => errors.push(e.message))
  const rows = Array.from({ length: 55 }, (_, i) => ({
    id: `00000000-0000-0000-0000-${String(55 - i).padStart(12, '0')}`,
    status: 'reading',
    created_at: '2026-10-20T10:00:00Z',
    user_id: f.session.user.id,
    rating: i % 2 ? 4.5 : null,
    tags: i === 54 ? ['reserva'] : ['favoritos'],
    books: {
      id: `00000000-0000-0000-0001-${String(i).padStart(12, '0')}`,
      title: `Lectura ${String(i + 1).padStart(2, '0')}`,
      authors: [i === 54 ? 'Autora del final' : 'Elena de prueba'],
      cover_url: null
    }
  }))
  const state = {
    calls: [],
    failMore: false,
    failInitial: false,
    failSummary: false,
    rows
  }
  await f.context.route('**/rest/v1/**', async (route) => {
    const name = new URL(route.request().url()).pathname.split('/').pop()
    let body
    if (name === 'library_summary') {
      if (state.failSummary)
        return route.fulfill({
          status: 400,
          json: { message: 'Fallo del resumen' }
        })
      body = [
        {
          status: 'reading',
          total: state.rows.length,
          tags: ['favoritos', 'reserva']
        }
      ]
    } else if (name === 'search_library') {
      const p = route.request().postDataJSON()
      state.calls.push(p)
      if (state.failInitial || (state.failMore && p.p_before_id))
        return route.fulfill({
          status: 400,
          json: { message: 'Fallo de página' }
        })
      body = state.rows
        .filter(
          (r) =>
            r.status === p.p_status &&
            (!p.p_search ||
              `${r.books.title} ${r.books.authors.join(' ')}`
                .toLowerCase()
                .includes(p.p_search.toLowerCase())) &&
            (p.p_rating === 'all' ||
              (p.p_rating === 'rated' ? r.rating != null : r.rating == null)) &&
            (!p.p_tag || r.tags.includes(p.p_tag)) &&
            (!p.p_before_id || r.id < p.p_before_id)
        )
        .slice(0, 25)
    } else return route.fallback()
    return route.fulfill({ json: body })
  })
  return { ...f, library: state }
}

// Desplaza únicamente el listado virtualizado para activar la siguiente página.
async function scrollShelf(page) {
  await page.evaluate(() => {
    const list = [...document.querySelectorAll('div')]
      .filter(
        (el) =>
          el.scrollHeight > el.clientHeight + 100 &&
          ['auto', 'scroll'].includes(getComputedStyle(el).overflowY)
      )
      .sort((a, b) => b.scrollHeight - a.scrollHeight)[0]
    if (!list) throw new Error('No se encontró una lista desplazable')
    list.scrollTop = list.scrollHeight
  })
}

// Espera un resultado observable sin depender de un tiempo fijo de red o animación.
async function eventually(check) {
  const until = Date.now() + 20000
  while (!check()) {
    if (Date.now() > until)
      throw new Error('No se cumplió la condición esperada')
    await new Promise((r) => setTimeout(r, 100))
  }
}

// Comprueba páginas reales del cliente, búsqueda fuera de la primera página, errores y tamaños.
async function main() {
  mkdirSync('.expo/library-preview', { recursive: true })
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const f = await libraryFixture(browser)
    const { page, library: s } = f
    await page.goto(base + '/library', { timeout: 120000 })
    await page
      .getByRole('button', { name: 'Lectura 01, Elena de prueba', exact: true })
      .waitFor({ timeout: 120000 })
    assert.equal(s.calls.length, 1)
    await page.screenshot({ path: '.expo/library-preview/library-light.png' })
    await page
      .getByRole('textbox', { name: 'Buscar por título o autor' })
      .fill('Autora del final')
    await page
      .getByRole('button', {
        name: 'Lectura 55, Autora del final',
        exact: true
      })
      .waitFor()
    assert.equal(s.calls.at(-1).p_before_id, undefined)
    await page
      .getByRole('button', { name: 'Limpiar filtros', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Sin puntuación', exact: true })
      .click()
    await eventually(() => s.calls.at(-1)?.p_rating === 'unrated')
    await page
      .getByRole('button', {
        name: 'Filtrar por etiqueta reserva',
        exact: true
      })
      .click()
    await page
      .getByRole('button', {
        name: 'Lectura 55, Autora del final',
        exact: true
      })
      .waitFor()
    await page
      .getByRole('button', { name: 'Con puntuación', exact: true })
      .click()
    await page
      .getByText('No encontramos coincidencias', { exact: true })
      .waitFor()
    await page
      .getByRole('button', { name: 'Limpiar filtros', exact: true })
      .last()
      .click()
    await page
      .getByRole('button', { name: 'Lectura 01, Elena de prueba', exact: true })
      .waitFor()
    s.failMore = true
    await scrollShelf(page)
    await page
      .getByText(
        'No pudimos cargar más libros. Los que ya tienes siguen aquí.',
        { exact: true }
      )
      .waitFor()
    s.failMore = false
    await page.getByRole('button', { name: 'Reintentar', exact: true }).click()
    await eventually(() => s.calls.filter((p) => p.p_before_id).length >= 4)
    // FlashList recalcula el alto después de insertar una página; volvemos a desplazar hasta el final observable.
    const end = page.getByText('55 libros en esta selección', { exact: true })
    const deadline = Date.now() + 20000
    while (!(await end.isVisible())) {
      if (Date.now() > deadline)
        throw new Error(
          'La biblioteca no llegó a la última página: ' +
            JSON.stringify(s.calls)
        )
      await scrollShelf(page)
      await page.waitForTimeout(200)
    }
    const cursors = s.calls
      .filter((p) => p.p_before_id)
      .map((p) => p.p_before_id)
    assert.ok(new Set(cursors).size >= 2)
    await page.getByRole('tab', { name: 'Leídos', exact: true }).click()
    await page
      .getByText('Tus próximas lecturas terminadas', { exact: true })
      .waitFor()
    await page
      .getByRole('button', { name: 'Buscar libros', exact: true })
      .waitFor()
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 844 })
      await page.getByRole('tab', { name: 'Leyendo', exact: true }).click()
      await page
        .getByRole('button', {
          name: 'Lectura 01, Elena de prueba',
          exact: true
        })
        .waitFor()
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth
        ),
        false
      )
      await page.screenshot({
        path: `.expo/library-preview/library-${width}.png`
      })
    }
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.waitForFunction(
      () => document.querySelector('svg')?.getAttribute('stroke') === '#9E9488'
    )
    await page.screenshot({ path: '.expo/library-preview/library-dark.png' })
    await f.context.close()
    const broken = await libraryFixture(browser)
    broken.library.failInitial = true
    await broken.page.goto(base + '/library')
    await broken.page
      .getByRole('button', { name: 'Reintentar', exact: true })
      .waitFor()
    assert.equal(
      await broken.page
        .getByText('¿Qué estás leyendo?', { exact: true })
        .count(),
      0
    )
    broken.library.failInitial = false
    await broken.page
      .getByRole('button', { name: 'Reintentar', exact: true })
      .click()
    await broken.page
      .getByRole('button', { name: 'Lectura 01, Elena de prueba', exact: true })
      .waitFor()
    await broken.context.close()
    const summaryError = await libraryFixture(browser, 320)
    summaryError.library.failSummary = true
    summaryError.library.rows = []
    await summaryError.page.goto(base + '/library')
    await summaryError.page
      .getByText('No pudimos actualizar los totales y las etiquetas.', {
        exact: true
      })
      .waitFor()
    await summaryError.page
      .getByText('¿Qué estás leyendo?', { exact: true })
      .waitFor()
    summaryError.library.failSummary = false
    await summaryError.page
      .getByRole('button', { name: 'Reintentar', exact: true })
      .click()
    await summaryError.page
      .getByText('No pudimos actualizar los totales y las etiquetas.', {
        exact: true
      })
      .waitFor({ state: 'detached' })
    await summaryError.context.close()
    assert.deepEqual(errors, [])
    console.log(
      'Biblioteca: filtros, cursor, vacíos, errores recuperables y diseño adaptable verificados.'
    )
  } finally {
    await browser.close()
  }
}
main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
