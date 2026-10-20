const assert = require('node:assert/strict')
const { mkdirSync } = require('node:fs')
const { chromium } = require(
  require.resolve('playwright', {
    paths: [process.env.LEXA_BROWSER_MODULES || process.cwd()]
  })
)
const { fixture } = require('./check-auth-preview.cjs')
const base = process.env.LEXA_LISTS_PREVIEW_URL || 'http://localhost:8082'
const errors = []

// Simula únicamente el transporte HTTP; basic-lists.sql prueba los permisos reales.
async function listsFixture(browser) {
  const f = await fixture(browser, { signedIn: true, completed: true })
  const books = [
    {
      id: '00000000-0000-4000-8000-000000000001',
      google_books_id: 'list-book-1',
      title: 'Los días de la memoria',
      authors: ['Elena Ríos'],
      cover_url: null
    },
    {
      id: '00000000-0000-4000-8000-000000000002',
      google_books_id: 'list-book-2',
      title: 'La casa de las palabras',
      authors: ['María Valdés'],
      cover_url: null
    },
    {
      id: '00000000-0000-4000-8000-000000000003',
      google_books_id: 'list-book-3',
      title: 'Un lugar al que volver',
      authors: ['Andrés Molina'],
      cover_url: null
    }
  ]
  const state = { lists: [], fail: false, failRead: false, adds: 0 }
  const list = {
    id: '00000000-0000-4000-8000-000000000010',
    user_id: f.state.profile.id,
    slug: 'lecturas-que-se-quedan',
    name: 'Lecturas que se quedan',
    description: 'Historias a las que vuelvo, aunque ya conozca el final.',
    visibility: 'private',
    books_count: 2,
    likes_count: 0,
    is_featured: false,
    accent_color: null,
    created_at: '2026-10-20T10:00:00Z',
    items: books.slice(0, 2).map((book, i) => ({
      id: 'relation-' + i,
      position: i,
      book,
      added_at: '2026-10-20T10:00:00Z'
    }))
  }
  state.lists.push(list)
  f.page.on('pageerror', (e) => errors.push(e.message))
  await f.context.route('**/rest/v1/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      table = url.pathname.split('/').pop(),
      method = req.method(),
      select = url.searchParams.get('select') || ''
    const body =
      method === 'POST' || method === 'PATCH' ? req.postDataJSON() : null
    const reply = (data, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(data)
      })
    if (
      !['lists', 'list_books', 'add_list_book', 'list_likes', 'books'].includes(
        table
      )
    )
      return route.fallback()
    if (state.fail && method !== 'GET')
      return reply({ message: 'Fallo controlado', code: '42501' }, 403)
    if (state.failRead && table === 'lists')
      return reply({ message: 'Fallo de lectura', code: 'bad' }, 400)
    if (table === 'list_likes') return reply([])
    if (table === 'books') return reply(books)
    if (table === 'add_list_book') {
      const l = state.lists.find((x) => x.id === body.target_list),
        book = books.find((b) => b.id === body.target_book)
      if (!l.items.some((x) => x.book.id === book.id)) {
        l.items.push({
          id: 'relation-' + book.id,
          position: l.items.length,
          book
        })
        l.books_count++
      }
      state.adds++
      return reply(null)
    }
    if (table === 'list_books') {
      if (method === 'DELETE') {
        for (const l of state.lists) {
          const id = url.searchParams.get('id')?.slice(3),
            i = l.items.findIndex((x) => x.id === id)
          if (i !== -1) {
            l.items.splice(i, 1)
            l.books_count--
            return reply({ id })
          }
        }
      }
      const bookId = url.searchParams.get('book_id')?.slice(3)
      return reply(
        state.lists.flatMap((l) =>
          l.items
            .filter((x) => x.book.id === bookId)
            .map((x) => ({
              id: x.id,
              list_id: l.id,
              lists: { user_id: l.user_id }
            }))
        )
      )
    }
    if (table === 'lists') {
      if (method === 'POST') {
        const l = {
          ...body,
          id: 'created-list',
          created_at: '2026-10-20',
          items: [],
          preview_books: [],
          books_count: 0,
          likes_count: 0,
          is_featured: false
        }
        state.lists.push(l)
        return reply(l)
      }
      const id = url.searchParams.get('id')?.slice(3),
        slug = url.searchParams.get('slug')?.slice(3)
      if (method === 'PATCH') {
        const l = state.lists.find((x) => x.id === id)
        Object.assign(l, body)
        return reply({ ...l, preview_books: [] })
      }
      if (method === 'DELETE') {
        state.lists = state.lists.filter((x) => x.id !== id)
        return reply({ id })
      }
      const rows = state.lists
        .filter((x) => !slug || x.slug === slug)
        .map((x) => ({
          ...x,
          preview_books: x.items.map((i) => ({
            book: i.book,
            position: i.position,
            id: i.id
          }))
        }))
      if (select.includes('items:')) return reply(rows)
      return reply(rows)
    }
  })
  return { ...f, state, books, list }
}

// Recorre las acciones esenciales, fallos recuperables y persistencia al recargar.
async function main() {
  mkdirSync('.expo/lists-preview', { recursive: true })
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const f = await listsFixture(browser),
    p = f.page
  p.setDefaultTimeout(25000)
  await p.goto(base + '/list/' + f.list.slug)
  await p
    .getByRole('heading', { name: f.list.name, exact: true })
    .waitFor({ timeout: 120000 })
  await p.getByRole('button', { name: 'Añadir libros', exact: true }).click()
  await p.getByRole('textbox', { name: 'Buscar un libro' }).fill('lugar')
  await p
    .getByRole('button', { name: 'Añadir Un lugar al que volver', exact: true })
    .waitFor()
  f.state.fail = true
  await p
    .getByRole('button', { name: 'Añadir Un lugar al que volver', exact: true })
    .click()
  await p.getByText('No pudimos añadir el libro.', { exact: false }).waitFor()
  assert.equal(f.list.books_count, 2)
  f.state.fail = false
  await p
    .getByRole('button', { name: 'Añadir Un lugar al que volver', exact: true })
    .click()
  await p
    .getByRole('button', {
      name: 'Ya añadido: Un lugar al que volver',
      exact: true
    })
    .waitFor()
  assert.equal(f.list.books_count, 3)
  await p.getByRole('button', { name: 'Listo', exact: true }).click()
  await p
    .getByRole('button', {
      name: 'Quitar La casa de las palabras de la lista',
      exact: true
    })
    .click()
  f.state.fail = true
  await p.getByRole('button', { name: 'Quitar', exact: true }).click()
  await p.getByText('No pudimos quitar el libro. Inténtalo de nuevo.').waitFor()
  f.state.fail = false
  await p.getByRole('button', { name: 'Quitar', exact: true }).click()
  await p
    .getByRole('button', { name: 'Quitar', exact: true })
    .waitFor({ state: 'hidden' })
  assert.equal(f.list.books_count, 2)
  await p.getByRole('button', { name: 'Editar lista', exact: true }).click()
  await p
    .getByRole('textbox', { name: 'Nombre', exact: true })
    .fill('Libros para volver')
  await p
    .getByRole('textbox', { name: 'Descripción', exact: true })
    .fill('Lecturas favoritas para una tarde tranquila.')
  f.state.fail = true
  await p.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await p.getByText('No pudimos guardar la lista.', { exact: false }).waitFor()
  assert.equal(
    await p.getByRole('textbox', { name: 'Nombre', exact: true }).inputValue(),
    'Libros para volver'
  )
  f.state.fail = false
  await p.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await p
    .getByRole('heading', { name: 'Libros para volver', exact: true })
    .waitFor()
  assert.equal(f.list.slug, 'lecturas-que-se-quedan')
  for (const width of [320, 390, 1280]) {
    await p.setViewportSize({ width, height: 900 })
    await p.screenshot({
      path: '.expo/lists-preview/detail-' + width + '.png',
      fullPage: true
    })
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false
    )
  }
  await p.goto(
    base +
      '/book/add-to-list?bookId=' +
      f.books[0].id +
      '&bookTitle=' +
      encodeURIComponent(f.books[0].title)
  )
  const check = p.getByRole('checkbox', {
    name: 'Libros para volver',
    exact: true
  })
  await check.waitFor()
  assert.equal(await check.getAttribute('aria-checked'), 'true')
  await check.click()
  await p.waitForFunction(
    () =>
      document
        .querySelector('[role=checkbox]')
        ?.getAttribute('aria-checked') === 'false'
  )
  await p.reload()
  await check.waitFor()
  assert.equal(await check.getAttribute('aria-checked'), 'false')
  await check.click()
  await p.waitForFunction(
    () =>
      document
        .querySelector('[role=checkbox]')
        ?.getAttribute('aria-checked') === 'true'
  )
  await p.getByRole('button', { name: 'Nueva lista', exact: true }).click()
  await p
    .getByRole('textbox', { name: 'Nombre', exact: true })
    .fill('Lecturas del domingo')
  await p.getByRole('radio', { name: 'Privada', exact: true }).waitFor()
  await p.setViewportSize({ width: 390, height: 900 })
  await p.screenshot({
    path: '.expo/lists-preview/new-light.png',
    fullPage: true
  })
  await p.getByRole('button', { name: 'Crear lista', exact: true }).click()
  await p
    .getByRole('checkbox', { name: 'Lecturas del domingo', exact: true })
    .waitFor()
  assert(p.url().includes('bookId='))
  await p
    .getByRole('checkbox', { name: 'Lecturas del domingo', exact: true })
    .click()
  await p.waitForFunction(
    () =>
      document
        .querySelector('[role="checkbox"][aria-label="Lecturas del domingo"]')
        ?.getAttribute('aria-checked') === 'true'
  )
  assert.equal(f.state.lists[1].books_count, 1)
  await p.screenshot({
    path: '.expo/lists-preview/selector.png',
    fullPage: true
  })
  await p.goto(base + '/list/' + f.state.lists[1].slug)
  await p.getByRole('button', { name: 'Eliminar lista', exact: true }).click()
  f.state.fail = true
  await p.getByRole('button', { name: 'Eliminar', exact: true }).click()
  await p
    .getByText('No pudimos eliminar la lista. Inténtalo de nuevo.')
    .waitFor()
  f.state.fail = false
  await p.getByRole('button', { name: 'Eliminar', exact: true }).click()
  await p.waitForURL('**/profile')
  assert.equal(f.state.lists.length, 1)
  await p.goto(base + '/list/inexistente')
  await p.getByText('Esta lista no existe o no tienes acceso.').waitFor()
  f.state.failRead = true
  await p.goto(base + '/list/' + f.list.slug)
  await p.getByRole('button', { name: 'Reintentar', exact: true }).waitFor()
  f.state.failRead = false
  await p.getByRole('button', { name: 'Reintentar', exact: true }).click()
  await p.getByRole('heading', { name: f.list.name, exact: true }).waitFor()
  await p.getByRole('button', { name: 'Editar lista', exact: true }).click()
  await p
    .getByRole('textbox', { name: 'Nombre', exact: true })
    .fill('Borrador sin guardar')
  await p.getByRole('button', { name: 'Volver', exact: true }).click()
  await p.getByRole('button', { name: 'Cancelar', exact: true }).last().click()
  assert.equal(
    await p.getByRole('textbox', { name: 'Nombre', exact: true }).inputValue(),
    'Borrador sin guardar'
  )
  await p.getByRole('button', { name: 'Volver', exact: true }).click()
  await p
    .getByRole('button', { name: 'Descartar cambios', exact: true })
    .click()
  await p.getByRole('heading', { name: f.list.name, exact: true }).waitFor()
  f.list.user_id = 'another-reader'
  await p.goto(base + '/list/edit/' + f.list.slug)
  await p.getByText('Esta lista no está disponible para editar.').waitFor()
  f.list.user_id = f.state.profile?.id || f.session.user.id
  await p.goto(base + '/list/' + f.list.slug)
  await p.getByRole('heading', { name: f.list.name, exact: true }).waitFor()
  await p.evaluate(() => localStorage.setItem('theme.mode', 'dark'))
  await p.emulateMedia({ colorScheme: 'dark' })
  await p.reload()
  await p.getByRole('heading', { name: f.list.name, exact: true }).waitFor()
  await p.screenshot({
    path: '.expo/lists-preview/detail-dark.png',
    fullPage: true
  })
  f.list.items = []
  f.list.books_count = 0
  await p.reload()
  await p.getByText('Lista vacía', { exact: true }).waitFor()
  await p.screenshot({
    path: '.expo/lists-preview/empty-dark.png',
    fullPage: true
  })
  assert.deepEqual(errors, [])
  await browser.close()
  console.log(
    'Listas: crear, editar, añadir/quitar, errores, persistencia, contexto y tamaños correctos.'
  )
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
