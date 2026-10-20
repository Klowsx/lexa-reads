const assert = require('node:assert/strict')
const { mkdirSync } = require('node:fs')
const { chromium } = require(
  require.resolve('playwright', {
    paths: [process.env.LEXA_BROWSER_MODULES || process.cwd()]
  })
)
const { fixture } = require('./check-auth-preview.cjs')
const base = process.env.LEXA_REVIEWS_PREVIEW_URL || 'http://localhost:8082'
const bookId = 'e4ceab5e-254f-4686-92cb-9118c85a4afe'
const reviewId = 'ec5d2999-8c5d-4315-9482-96ba2ed45299'
const commentId = '003c5d83-7a32-487d-b95e-d097e06045ff'
const secret =
  'SPOILER DE PRUEBA: el final no debe aparecer sin consentimiento.'
const book = {
  id: bookId,
  google_books_id: 'reviews-preview',
  title: 'El libro de las reseñas',
  authors: ['Autora de prueba'],
  page_count: 220,
  cover_url: null,
  genres: ['Ficción'],
  description: 'Una lectura para verificar reseñas y conversaciones.'
}
const errors = []

// Simula solo HTTP para recorrer la aplicación; los permisos se prueban además en SQL real.
async function reviewsFixture(browser, options = {}) {
  const f = await fixture(browser, { signedIn: true, completed: true })
  f.page.setDefaultTimeout(20000)
  f.page.on('pageerror', (error) => errors.push(error.message))
  const user = {
    id: f.session.user.id,
    username: 'user_preview',
    display_name: 'Lectura'
  }
  const stamp = '2026-10-20T12:00:00Z'
  const state = {
    review: options.empty
      ? null
      : {
          id: reviewId,
          user_id: user.id,
          book_id: bookId,
          user_book_id: null,
          body: secret,
          contains_spoilers: true,
          is_published: true,
          deleted_at: null,
          edited_at: null,
          created_at: stamp,
          updated_at: stamp,
          likes_count: 0,
          comments_count: 1
        },
    comments: [
      {
        id: commentId,
        user_id: user.id,
        target_type: 'review',
        target_id: reviewId,
        parent_id: null,
        body: 'Un comentario inicial sin spoilers.',
        contains_spoilers: false,
        created_at: stamp,
        deleted_at: null,
        user
      }
    ],
    failSave: false,
    failSend: false,
    failDelete: false,
    unavailable: false,
    failComments: false,
    requests: [],
    saves: 0,
    sends: 0
  }
  await f.context.route('**/rest/v1/**', async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      name = url.pathname.split('/').pop()
    state.requests.push({ name, method: request.method() })
    const visible =
      state.review && !state.review.deleted_at && !state.unavailable
    let body = [],
      status = 200
    const failure = (message) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ message })
      })
    if (name === 'reviews') {
      if (request.method() === 'POST' || request.method() === 'PATCH') {
        state.saves++
        if (state.failSave) {
          state.failSave = false
          return failure('Fallo de guardado simulado')
        }
        state.review = {
          id: reviewId,
          user_id: user.id,
          book_id: bookId,
          user_book_id: null,
          created_at: stamp,
          edited_at: null,
          deleted_at: null,
          is_published: true,
          likes_count: 0,
          comments_count: state.comments.length,
          ...state.review,
          ...request.postDataJSON()
        }
        body = state.review
      } else if (url.searchParams.has('id')) {
        if (!visible) {
          status = 406
          body = { code: 'PGRST116', message: 'No disponible' }
        } else body = state.review
      } else if (
        url.searchParams.has('user_id') &&
        url.searchParams.has('book_id')
      )
        body = visible ? state.review : null
      else
        body = visible
          ? [
              {
                ...state.review,
                users: user,
                books: book,
                user_books: { rating: 4.5 }
              }
            ]
          : []
    } else if (name === 'books')
      body =
        url.searchParams.has('id') || url.searchParams.has('google_books_id')
          ? book
          : [book]
    else if (name === 'activity_feed') {
      const activity = {
        id: '760e8c0c-b4ba-41ac-8dd1-f31f4c5115ad',
        activity_type: 'wrote_review',
        user,
        book,
        likes_count: 0,
        created_at: stamp,
        review_id: reviewId,
        review: visible ? state.review : null
      }
      body = url.searchParams.has('id') ? activity : visible ? [activity] : []
    } else if (name === 'comments') {
      if (request.method() === 'POST') {
        state.sends++
        if (state.failSend) {
          state.failSend = false
          return failure('Fallo de envío simulado')
        }
        const comment = {
          id: '004c5d83-7a32-487d-b95e-d097e06045ff',
          created_at: stamp,
          deleted_at: null,
          user,
          ...request.postDataJSON()
        }
        state.comments.push(comment)
        body = comment
      } else if (state.failComments)
        return failure('Comentarios no disponibles')
      else body = state.comments.filter((c) => !c.deleted_at)
    } else if (name === 'remove_own_content') {
      if (state.failDelete) {
        state.failDelete = false
        return failure('Fallo de borrado simulado')
      }
      const params = request.postDataJSON()
      if (params.p_type === 'review') state.review.deleted_at = stamp
      else state.comments = state.comments.filter((c) => c.id !== params.p_id)
      body = true
    } else if (name === 'user_books')
      body = request.headers().accept?.includes('object+json') ? null : []
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
          'content-range': '0-0/0',
          'access-control-expose-headers': 'content-range'
        }
      })
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body)
    })
  })
  return { ...f, social: state }
}

// Verifica que un spoiler está ausente del DOM, puede revelarse y vuelve a ocultarse.
async function spoilerOnPage(page) {
  await page
    .getByRole('button', { name: 'Mostrar spoiler', exact: true })
    .first()
    .waitFor()
  assert.equal(await page.getByText(secret, { exact: true }).count(), 0)
  await page
    .getByRole('button', { name: 'Mostrar spoiler', exact: true })
    .first()
    .click()
  await page.getByText(secret, { exact: true }).waitFor()
  await page
    .getByRole('button', { name: 'Ocultar spoiler', exact: true })
    .first()
    .click()
  await page.getByText(secret, { exact: true }).waitFor({ state: 'hidden' })
}

// Recorre feed, reseñas propias, perfil ajeno y ficha del libro sin exponer previews.
async function surfaces(browser) {
  const f = await reviewsFixture(browser)
  try {
    for (const path of [
      '/feed',
      '/my-reviews',
      '/user-reviews/user_preview',
      '/book/' + book.google_books_id
    ]) {
      await f.page.goto(base + path)
      if (path.startsWith('/book/'))
        await f.page.getByText('Reseñas', { exact: true }).click()
      await spoilerOnPage(f.page)
    }
    await f.page.screenshot({ path: '.expo/reviews-preview/book.png' })
    console.log(
      'Spoilers ocultos y revelado explícito en feed, Mis reseñas, perfil y ficha'
    )
  } finally {
    await f.context.close()
  }
}

// Publica, edita con fallo recuperable y elimina tras confirmar; una edición no crea otra reseña.
async function editor(browser) {
  const f = await reviewsFixture(browser, { empty: true })
  const { page, social } = f
  try {
    await page.setViewportSize({ width: 320, height: 844 })
    await page.goto(base + '/review/new?bookId=' + bookId)
    const input = page.getByLabel('Tu reseña', { exact: true })
    await input.fill('          ')
    assert.equal(
      await page
        .getByRole('button', { name: 'Publicar reseña', exact: true })
        .isDisabled(),
      true
    )
    await input.fill(secret)
    await page.getByLabel('Contiene spoilers', { exact: true }).click()
    await page
      .getByRole('button', { name: 'Publicar reseña', exact: true })
      .click()
    await page.waitForURL('**/book/' + book.google_books_id)
    assert.equal(social.review.contains_spoilers, true)
    assert.equal(social.saves, 1)
    await page.goto(base + '/review/new?bookId=' + bookId)
    await input.waitFor()
    await input.fill(secret + ' Edición conservada tras un fallo.')
    social.failSave = true
    await page
      .getByRole('button', { name: 'Guardar cambios', exact: true })
      .click()
    await page.getByText(/No se guardó la reseña/).waitFor()
    assert.equal(
      await input.inputValue(),
      secret + ' Edición conservada tras un fallo.'
    )
    await page.getByRole('button', { name: 'Cerrar', exact: true }).click()
    await page.getByText('¿Salir sin guardar?', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
    assert.equal(
      await input.inputValue(),
      secret + ' Edición conservada tras un fallo.'
    )
    await page.screenshot({ path: '.expo/reviews-preview/editor-error.png' })
    await page
      .getByRole('button', { name: 'Guardar cambios', exact: true })
      .click()
    await page.waitForURL('**/book/' + book.google_books_id)
    assert.equal(social.review.id, reviewId)
    await page.getByText('Reseñas', { exact: true }).click()
    await page.getByText('Eliminar', { exact: true }).first().click()
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
    assert.equal(social.review.deleted_at, null)
    await page.getByText('Eliminar', { exact: true }).first().click()
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click()
    await page
      .getByText('Eliminar reseña', { exact: true })
      .waitFor({ state: 'hidden' })
    assert.notEqual(social.review.deleted_at, null)
    console.log(
      'Registro, edición, error con borrador conservado y eliminación confirmada: correctos'
    )
  } finally {
    await f.context.close()
  }
}

// Protege el hilo completo, conserva borradores al fallar y permite retirar solo comentarios propios.
async function comments(browser) {
  const f = await reviewsFixture(browser)
  const { page, social } = f
  try {
    await page.goto(base + '/comments/' + reviewId + '?type=review')
    await page
      .getByRole('button', { name: 'Mostrar conversación', exact: true })
      .waitFor()
    assert.equal(
      social.requests.some((r) => r.name === 'comments'),
      false
    )
    await page
      .getByRole('button', { name: 'Mostrar conversación', exact: true })
      .click()
    await page
      .getByText('Un comentario inicial sin spoilers.', { exact: true })
      .waitFor()
    const input = page.getByLabel('Escribe un comentario', { exact: true })
    await input.fill('Un comentario nuevo con un final secreto.')
    await page.getByLabel('Contiene spoilers', { exact: true }).click()
    social.failSend = true
    await page
      .getByRole('button', { name: 'Enviar comentario', exact: true })
      .click()
    await page.getByText(/No se pudo enviar/).waitFor()
    assert.equal(
      await input.inputValue(),
      'Un comentario nuevo con un final secreto.'
    )
    await page
      .getByRole('button', { name: 'Enviar comentario', exact: true })
      .click()
    await page.waitForFunction(
      () =>
        document.querySelector('input[aria-label="Escribe un comentario"]')
          ?.value === ''
    )
    assert.equal(social.sends, 2)
    assert.equal(
      await page
        .getByText('Un comentario nuevo con un final secreto.', { exact: true })
        .count(),
      0
    )
    await page
      .getByRole('button', { name: 'Mostrar spoiler', exact: true })
      .click()
    await page
      .getByText('Un comentario nuevo con un final secreto.', { exact: true })
      .waitFor()
    await page
      .getByRole('button', { name: 'Eliminar comentario', exact: true })
      .last()
      .click()
    social.failDelete = true
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click()
    await page
      .getByText('No se pudo eliminar el comentario. Puedes reintentarlo.', {
        exact: true
      })
      .waitFor()
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click()
    await page
      .getByRole('button', { name: 'Cancelar', exact: true })
      .waitFor({ state: 'hidden' })
    assert.equal(social.comments.length, 1)
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 844 })
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth
        ),
        false
      )
      await page.screenshot({
        path: `.expo/reviews-preview/comments-${width}.png`
      })
    }
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.waitForFunction(
      () => document.querySelector('svg[stroke="#F0EAE2"]') !== null
    )
    await page.screenshot({ path: '.expo/reviews-preview/comments-dark.png' })
    console.log(
      'Comentarios: protección del hilo, publicación, spoiler individual y reintento de borrado correctos'
    )
  } finally {
    await f.context.close()
  }
}

// Un contenido retirado no muestra un falso vacío ni deja un formulario operativo.
async function unavailable(browser) {
  const f = await reviewsFixture(browser)
  f.social.unavailable = true
  try {
    await f.page.goto(base + '/comments/' + reviewId + '?type=review')
    await f.page.getByText('Contenido no disponible', { exact: true }).waitFor()
    assert.equal(
      await f.page.getByLabel('Escribe un comentario', { exact: true }).count(),
      0
    )
    assert.equal(
      f.social.requests.some((r) => r.name === 'comments'),
      false
    )
    console.log('Contenido retirado: comentarios y envío inaccesibles')
  } finally {
    await f.context.close()
  }
}

// Distingue un error del listado de un hilo vacío y permite recuperarlo con Reintentar.
async function commentError(browser) {
  const f = await reviewsFixture(browser)
  f.social.review.contains_spoilers = false
  f.social.failComments = true
  try {
    await f.page.goto(base + '/comments/' + reviewId + '?type=review')
    await f.page
      .getByText(
        'No pudimos cargar los comentarios. Tu borrador se conserva.',
        { exact: true }
      )
      // Los GET con 503 agotan primero los reintentos del SDK y después los de TanStack Query.
      .waitFor({ timeout: 60000 })
    assert.equal(
      await f.page
        .getByText('Todavía no hay comentarios', { exact: true })
        .count(),
      0
    )
    f.social.failComments = false
    await f.page
      .getByRole('button', { name: 'Reintentar', exact: true })
      .click()
    await f.page
      .getByText('Un comentario inicial sin spoilers.', { exact: true })
      .waitFor()
    console.log(
      'Fallo de carga de comentarios: error explícito y recuperación correctos'
    )
  } catch (error) {
    console.error(
      'Estado de carga:',
      await f.page.locator('body').innerText(),
      JSON.stringify(f.social.requests)
    )
    await f.page.screenshot({
      path: '.expo/reviews-preview/comments-load-failure.png'
    })
    throw error
  } finally {
    await f.context.close()
  }
}

// Garantiza aislamiento y cierre del navegador también ante errores del recorrido.
async function main() {
  mkdirSync('.expo/reviews-preview', { recursive: true })
  const browser = await chromium.launch({
    channel: process.env.LEXA_BROWSER_CHANNEL || 'msedge',
    headless: true
  })
  try {
    for (const [name, run] of Object.entries({
      surfaces,
      editor,
      comments,
      unavailable,
      commentError
    }))
      if (
        !process.env.LEXA_REVIEWS_SCENARIO ||
        process.env.LEXA_REVIEWS_SCENARIO === name
      )
        await run(browser)
    assert.deepEqual(errors, [])
    console.log(
      'Reseñas, spoilers y comentarios verificados en navegador con HTTP simulado.'
    )
  } finally {
    await browser.close()
  }
}
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
