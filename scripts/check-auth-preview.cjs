const assert = require('node:assert/strict')
const { Buffer } = require('node:buffer')
const { mkdirSync } = require('node:fs')
const { chromium } = require(
  require.resolve('playwright', {
    paths: [process.env.LEXA_BROWSER_MODULES || process.cwd()]
  })
)
const base = process.env.LEXA_AUTH_PREVIEW_URL || 'http://localhost:8082'
const storageKey = 'sb-nvgygpsuqltjfexsjwoq-auth-token'
const recoveryKey = 'lexa.auth.recovery-user'
const errors = []

// Aísla las respuestas de autenticación para no enviar correos ni modificar cuentas reales.
async function fixture(browser, options = {}) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'es-ES'
  })
  const user = {
    id: 'b9677395-5b2f-4be7-8fa6-3b528cd071f4',
    email: 'lectura@example.test',
    role: 'authenticated',
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {}
  }
  const exp = Math.floor(Date.now() / 1000) + 3600
  const token = [
    Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url'),
    Buffer.from(
      JSON.stringify({ sub: user.id, exp, role: 'authenticated' })
    ).toString('base64url'),
    'preview'
  ].join('.')
  const session = {
    user,
    access_token: token,
    refresh_token: 'preview-refresh',
    expires_in: 3600,
    expires_at: exp,
    token_type: 'bearer'
  }
  const state = {
    profile: {
      id: user.id,
      username: 'user_preview',
      display_name: 'Lectura',
      favorite_genres: [],
      reading_goal: 12,
      onboarding_step: 1,
      onboarding_completed: !!options.completed
    },
    confirmRequired: options.confirmRequired !== false,
    confirmed: false,
    rejectUser: options.rejectUser || false,
    expired: !!options.expired,
    failLogout: false,
    passwordUpdates: 0,
    completionAttempts: 0,
    availabilityError: false,
    conflict: false,
    reserved: new Set(['ocupado']),
    refreshes: 0,
    logoutScope: null,
    signupRedirect: null,
    recoveryRedirect: null
  }
  if (options.signedIn)
    await context.addInitScript(
      ({ key, session, recovery }) => {
        if (!sessionStorage.getItem('fixture-seeded')) {
          sessionStorage.setItem('fixture-seeded', 'yes')
          localStorage.setItem(key, JSON.stringify(session))
          if (recovery)
            localStorage.setItem(
              'lexa.auth.recovery-user',
              JSON.stringify({
                userId: session.user.id,
                passwordUpdated: false
              })
            )
        }
      },
      {
        key: storageKey,
        session: options.refreshAtStartup
          ? { ...session, expires_at: 1 }
          : session,
        recovery: !!options.recovery
      }
    )

  await context.route('https://*.supabase.co/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname
    let body = []
    let status = 200
    if (path.endsWith('/signup')) {
      state.signupRedirect = url.searchParams.get('redirect_to')
      body = state.confirmRequired ? { user, session: null } : session
    } else if (path.endsWith('/token')) {
      if (url.searchParams.get('grant_type') === 'refresh_token')
        state.refreshes++
      if (
        url.searchParams.get('grant_type') === 'password' &&
        state.confirmRequired &&
        !state.confirmed
      ) {
        status = 400
        body = { code: 'email_not_confirmed', msg: 'Email not confirmed' }
      } else body = session
    } else if (path.endsWith('/recover')) {
      state.recoveryRedirect = url.searchParams.get('redirect_to')
      body = {}
    } else if (path.endsWith('/resend')) body = {}
    else if (path.endsWith('/logout')) {
      state.logoutScope = url.searchParams.get('scope')
      if (state.failLogout) {
        status = 400
        body = { code: 'unexpected_failure', msg: 'Retry logout' }
      } else {
        status = 204
        body = undefined
      }
    } else if (path.endsWith('/auth/v1/user')) {
      if (state.rejectUser) return route.abort('failed')
      if (state.expired) {
        status = 401
        body = { code: 'session_not_found', msg: 'Session not found' }
      } else {
        if (request.method() === 'PUT') state.passwordUpdates++
        body = user
      }
    } else if (path.endsWith('/users')) {
      if (request.method() === 'PATCH')
        Object.assign(state.profile, request.postDataJSON())
      body = state.profile
    } else if (path.endsWith('/is_username_available')) {
      if (state.availabilityError) {
        status = 400
        body = { code: 'unavailable', message: 'Preview unavailable' }
      } else body = !state.reserved.has(request.postDataJSON().p_username)
    } else if (path.endsWith('/complete_onboarding')) {
      state.completionAttempts++
      const username = request.postDataJSON().p_username
      if (state.conflict) {
        state.conflict = false
        state.reserved.add(username)
        status = 409
        body = { code: '23505', message: 'Preview conflict' }
      } else {
        Object.assign(state.profile, {
          username,
          onboarding_completed: true,
          onboarding_step: 3
        })
        body = state.profile
      }
    } else if (path.endsWith('/notification_preferences'))
      body = { consent_given_at: '2026-01-01' }
    if (status >= 400 && path.includes('/auth/v1/') && body?.code)
      body.error_code = body.code
    await route.fulfill({
      status,
      contentType: 'application/json',
      // Supabase usa esta versión para interpretar los códigos de error del API real.
      headers: {
        'x-supabase-api-version': '2024-01-01',
        'access-control-expose-headers': 'x-supabase-api-version'
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  })
  const page = await context.newPage()
  page.setDefaultNavigationTimeout(45000)
  page.on('pageerror', (error) => errors.push(error.message))
  return { context, page, state, session }
}

// Recorre los formularios públicos en tamaños pequeños y comprueba que se puede llegar al contenido.
async function publicScreens(browser) {
  const { context, page } = await fixture(browser)
  try {
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 844 })
      for (const [path, heading] of [
        ['/login', 'Vuelve a tu biblioteca'],
        ['/register', 'Empieza tu biblioteca'],
        ['/forgot-password', 'Retoma tus lecturas']
      ]) {
        await page.goto(base + path)
        await page.getByText(heading, { exact: true }).waitFor()
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth
          ),
          false
        )
        await page.screenshot({
          path: '.expo/auth-preview/' + width + '-' + path.slice(1) + '.png',
          fullPage: true
        })
      }
    }
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto(base + '/login')
    await page.getByText('Vuelve a tu biblioteca', { exact: true }).waitFor()
    await page.screenshot({ path: '.expo/auth-preview/login-dark.png' })
  } finally {
    await context.close()
  }
}

// Completa el registro con los mismos campos accesibles usados por la aplicación.
async function register(page) {
  await page.goto(base + '/register')
  await page.getByLabel('Nombre', { exact: true }).fill('Lectura de prueba')
  await page
    .getByLabel('Correo', { exact: true })
    .fill(' lectura@example.test ')
  await page.getByLabel('Contraseña', { exact: true }).fill('Lectura2026')
  await page.getByRole('checkbox').click({ position: { x: 8, y: 8 } })
  await page.screenshot({ path: '.expo/auth-preview/register-filled.png' })
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
}

// Diferencia confirmación de recuperación y valida errores y carreras de nombre antes de entrar.
async function signupAndOnboarding(browser) {
  const { context, page, state, session } = await fixture(browser)
  try {
    await register(page)
    await page.waitForURL('**/confirm-email?*')
    assert.ok(state.signupRedirect.includes('auth-callback'))
    assert.ok(state.signupRedirect.includes('flow=signup'))
    await page
      .getByRole('button', { name: 'Ya confirmé, iniciar sesión', exact: true })
      .click()
    await page.waitForURL('**/login?*')
    await page.getByLabel('Contraseña', { exact: true }).fill('Lectura2026')
    await page
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click()
    await page
      .getByText('Confirma tu correo antes de iniciar sesión', { exact: true })
      .waitFor({ timeout: 7000 })
      .catch(async (error) => {
        await page.screenshot({ path: '.expo/auth-preview/login-error.png' })
        console.log(
          'Estado del acceso simulado:',
          await page.locator('body').innerText()
        )
        throw error
      })
    await page
      .getByText('Revisar o reenviar la confirmación', { exact: true })
      .waitFor()
    state.confirmed = true
    await page.goto(
      base +
        '/auth-callback?flow=signup#access_token=' +
        session.access_token +
        '&refresh_token=preview-refresh&type=signup'
    )
    await page.waitForURL('**/onboarding/genres')
    await page
      .getByRole('button', {
        name: 'Dejar gustos y meta para después',
        exact: true
      })
      .click()
    await page.waitForURL('**/onboarding/username')
    await page.reload()
    await page.getByText('Tu firma de lector', { exact: true }).waitFor()
    state.availabilityError = true
    await page
      .getByLabel('Nombre de usuario', { exact: true })
      .fill('lectora_prueba')
    await page
      .getByRole('button', { name: 'Volver a comprobar', exact: true })
      .waitFor({ timeout: 15000 })
    state.availabilityError = false
    await page
      .getByRole('button', { name: 'Volver a comprobar', exact: true })
      .click()
    await page.getByText('Disponible:', { exact: false }).waitFor()
    await page.getByLabel('Nombre de usuario', { exact: true }).fill('ocupado')
    await page
      .getByText('Este nombre ya está en uso.', { exact: true })
      .waitFor()
    await page
      .getByLabel('Nombre de usuario', { exact: true })
      .fill('lectora_libre')
    await page.getByText('Disponible:', { exact: false }).waitFor()
    await page.screenshot({ path: '.expo/auth-preview/username.png' })
    state.conflict = true
    await page
      .getByRole('button', { name: 'Entrar a Lexa', exact: true })
      .click()
    await page
      .getByText('Este nombre acaba de ser elegido. Prueba otro.', {
        exact: true
      })
      .waitFor()
    await page
      .getByLabel('Nombre de usuario', { exact: true })
      .fill('otra_lectora')
    await page.getByText('Disponible:', { exact: false }).waitFor()
    await page
      .getByRole('button', { name: 'Entrar a Lexa', exact: true })
      .click()
    await page.waitForURL('**/feed')
    assert.equal(state.profile.onboarding_completed, true)
    assert.equal(state.profile.favorite_genres.length, 0)
    assert.equal(state.profile.reading_goal, 12)
    assert.equal(
      await page.evaluate((key) => localStorage.getItem(key), recoveryKey),
      null
    )
    console.log(
      'Registro con confirmación, salto de preferencias, reanudación y conflicto de usuario: correctos'
    )
  } finally {
    await context.close()
  }
}

// Comprueba el otro ajuste de Supabase y el cierre local desde el onboarding.
async function immediateSignup(browser) {
  const { context, page, state } = await fixture(browser, {
    confirmRequired: false
  })
  try {
    await register(page)
    await page.waitForURL('**/onboarding/genres')
    await page
      .getByRole('button', { name: 'Usar otra cuenta', exact: true })
      .click()
    await page.waitForURL('**/login')
    assert.equal(state.logoutScope, 'local')
    assert.equal(
      await page.evaluate((key) => localStorage.getItem(key), storageKey),
      null
    )
    console.log(
      'Registro sin confirmación y cierre de la sesión local: correctos'
    )
  } finally {
    await context.close()
  }
}

// Reabre una recuperación y reintenta solo el cierre si la contraseña ya cambió.
async function recovery(browser) {
  const { context, page, state, session } = await fixture(browser, {
    completed: true
  })
  try {
    await page.goto(base + '/forgot-password')
    await page
      .getByLabel('Correo', { exact: true })
      .fill('lectura@example.test')
    await page
      .getByRole('button', { name: 'Enviar enlace', exact: true })
      .click()
    await page.waitForURL('**/recovery-sent?*')
    assert.ok(state.recoveryRedirect.includes('flow=recovery'))
    await page.goto(
      base +
        '/auth-callback?flow=recovery#access_token=' +
        session.access_token +
        '&refresh_token=preview-refresh&type=recovery'
    )
    await page.waitForURL('**/new-password')
    await page.reload()
    await page.getByLabel('Nueva contraseña', { exact: true }).waitFor()
    await page.goto(base + '/feed')
    await page.waitForURL('**/new-password')
    await page
      .getByLabel('Nueva contraseña', { exact: true })
      .waitFor({ timeout: 7000 })
      .catch(async (error) => {
        await page.screenshot({ path: '.expo/auth-preview/recovery-error.png' })
        console.log(
          'Estado de la recuperación simulada:',
          await page.locator('body').innerText()
        )
        console.log('Ruta:', new URL(page.url()).pathname)
        throw error
      })
    await page
      .getByLabel('Nueva contraseña', { exact: true })
      .fill('NuevaLectura2026')
    await page
      .getByLabel('Confirmar contraseña', { exact: true })
      .fill('NuevaLectura2026')
    state.failLogout = true
    await page
      .getByRole('button', { name: 'Guardar contraseña', exact: true })
      .click()
    await page
      .getByText(
        'La contraseña cambió, pero falta cerrar la sesión. Vuelve a intentarlo.',
        { exact: true }
      )
      .waitFor()
    assert.equal(state.passwordUpdates, 1)
    await page.reload()
    await page
      .getByText('Tu contraseña está actualizada', { exact: true })
      .waitFor()
    await page.screenshot({ path: '.expo/auth-preview/recovery-resume.png' })
    state.failLogout = false
    await page
      .getByRole('button', { name: 'Finalizar recuperación', exact: true })
      .click()
    await page.waitForURL('**/success')
    assert.equal(state.passwordUpdates, 1)
    assert.equal(state.logoutScope, 'global')
    assert.equal(
      await page.evaluate((key) => localStorage.getItem(key), storageKey),
      null
    )
    assert.equal(
      await page.evaluate((key) => localStorage.getItem(key), recoveryKey),
      null
    )
    console.log(
      'Recuperación, protección del feed, reanudación y reintento de cierre: correctos'
    )
  } finally {
    await context.close()
  }
}

// Distingue una interrupción de red de una sesión revocada y ofrece una salida para enlaces rotos.
async function restoration(browser) {
  const refreshed = await fixture(browser, {
    signedIn: true,
    completed: true,
    refreshAtStartup: true,
    recovery: true
  })
  try {
    await refreshed.page.goto(base + '/feed')
    await refreshed.page.waitForURL('**/new-password')
    await refreshed.page
      .getByLabel('Nueva contraseña', { exact: true })
      .waitFor()
    assert.ok(refreshed.state.refreshes >= 1)
  } finally {
    await refreshed.context.close()
  }
  const first = await fixture(browser, {
    signedIn: true,
    completed: true,
    rejectUser: true
  })
  try {
    await first.page.goto(base + '/feed')
    await first.page
      .getByText(
        'No pudimos comprobar tu sesión. Revisa tu conexión y vuelve a intentarlo.',
        { exact: true }
      )
      .waitFor({ timeout: 20000 })
    await first.page.screenshot({
      path: '.expo/auth-preview/session-retry.png'
    })
    first.state.rejectUser = false
    await first.page
      .getByRole('button', { name: 'Volver a intentar', exact: true })
      .click()
    await first.page
      .getByText(
        'No pudimos comprobar tu sesión. Revisa tu conexión y vuelve a intentarlo.',
        { exact: true }
      )
      .waitFor({ state: 'hidden' })
    assert.ok(
      await first.page.evaluate((key) => localStorage.getItem(key), storageKey)
    )
  } finally {
    await first.context.close()
  }
  const second = await fixture(browser, {
    signedIn: true,
    completed: true,
    expired: true
  })
  try {
    await second.page.goto(base + '/feed')
    await second.page.waitForURL(/\/$/)
    assert.equal(
      await second.page.evaluate(
        (key) => localStorage.getItem(key),
        storageKey
      ),
      null
    )
    await second.page.goto(
      base + '/auth-callback?flow=recovery#error=access_denied'
    )
    await second.page
      .getByText('Necesitas otro enlace', { exact: true })
      .waitFor()
    assert.equal(await second.page.evaluate(() => location.hash), '')
    await second.page.goto(base + '/new-password')
    await second.page
      .getByText('Necesitas un enlace válido', { exact: true })
      .waitFor()
    assert.equal(
      await second.page.getByLabel('Nueva contraseña', { exact: true }).count(),
      0
    )
    console.log('Sesión interrumpida/revocada y enlaces inválidos: correctos')
  } finally {
    await second.context.close()
  }
}

// Ejecuta escenarios aislados y cierra el navegador también cuando una comprobación falla.
async function main() {
  mkdirSync('.expo/auth-preview', { recursive: true })
  const browser = await chromium.launch({
    channel: process.env.LEXA_BROWSER_CHANNEL || 'msedge',
    headless: true
  })
  try {
    const scenarios = {
      screens: publicScreens,
      signup: signupAndOnboarding,
      immediate: immediateSignup,
      recovery,
      restoration
    }
    for (const [name, check] of Object.entries(scenarios)) {
      if (
        !process.env.LEXA_AUTH_SCENARIO ||
        process.env.LEXA_AUTH_SCENARIO === name
      )
        await check(browser)
    }
    assert.deepEqual(errors, [])
    console.log(
      process.env.LEXA_AUTH_SCENARIO
        ? 'Escenario ' +
            process.env.LEXA_AUTH_SCENARIO +
            ' verificado con respuestas HTTP simuladas.'
        : 'Vista previa de acceso verificada en claro/oscuro y 320, 390 y 1280 px. Solo se simularon respuestas HTTP.'
    )
  } finally {
    await browser.close()
  }
}

module.exports = { fixture }

if (require.main === module)
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
