// Revisa las rutas públicas con un navegador aislado y guarda capturas locales de comprobación.
async function main() {
  const { chromium } = require(require.resolve("playwright", { paths: [process.env.LEXA_BROWSER_MODULES || process.cwd()] }));
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ["/", "/login", "/register", "/forgot-password"]) {
      await page.goto(`http://localhost:8081${route}`, { waitUntil: "networkidle" });
      await page.getByText(route === "/" ? "Haz sitio a tus lecturas." : route === "/login" ? "Vuelve a tu biblioteca" : route === "/register" ? "Empieza tu biblioteca" : "Retoma tus lecturas", { exact: true }).waitFor();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (overflow) throw new Error(`Desbordamiento horizontal en ${route}, ${width}px`);
      await page.screenshot({ path: `.expo/auth-preview/${width}-${route.slice(1) || "welcome"}.png`, fullPage: true });
      console.log(`${width}px ${route}: sin desbordamiento`);
    }
  }
  await verifyOnboarding(browser);
  await verifyAccess(browser);
  await browser.close();
  if (errors.length) throw new Error(errors.join("\n"));
}

// Comprueba registro con y sin sesión y recuperación completa con un servidor simulado.
async function verifyAccess(browser) {
  for (const immediateSession of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const user = { id: "b9677395-5b2f-4be7-8fa6-3b528cd071f4", email: "lectura@example.test", role: "authenticated", aud: "authenticated", app_metadata: {}, user_metadata: {} };
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = [Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url"), Buffer.from(JSON.stringify({ sub: user.id, exp })).toString("base64url"), "preview"].join(".");
    const session = { user, access_token: token, refresh_token: "preview", expires_in: 3600, expires_at: exp, token_type: "bearer" };
    await context.route("https://*.supabase.co/**", async (route) => {
      const url = route.request().url();
      let body = {};
      if (url.includes("/signup")) body = immediateSession ? session : { user };
      else if (url.includes("/verify") || url.includes("/token")) body = session;
      else if (url.includes("/auth/v1/user")) body = { user };
      else if (url.includes("/rest/v1/users")) body = { ...user, display_name: "Lectura", username: "lector", onboarding_step: 1, onboarding_completed: false, favorite_genres: [], reading_goal: 12 };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    });
    const page = await context.newPage();
    await page.goto("http://localhost:8081/register");
    await page.getByLabel("Nombre", { exact: true }).fill("Lectura");
    await page.getByLabel("Correo", { exact: true }).fill(user.email);
    await page.getByLabel("Contraseña", { exact: true }).fill("SoloPrueba2026");
    await page.getByRole("checkbox").click();
    await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
    if (immediateSession) {
      await page.waitForURL("**/onboarding/genres");
      await page.getByRole("button", { name: "Usar otra cuenta", exact: true }).click();
      await page.getByText("Haz sitio a tus lecturas.", { exact: true }).waitFor();
    } else {
      await page.waitForURL("**/confirm-email?*");
      await page.getByText("Un último vistazo al correo", { exact: true }).waitFor();
      await page.screenshot({ path: ".expo/auth-preview/390-confirm-email.png" });
      await page.getByRole("button", { name: "Ya confirmé, iniciar sesión" }).click();
      await page.waitForURL("**/login?*");
      if (await page.getByLabel("Correo", { exact: true }).inputValue() !== user.email) throw new Error("Se perdió el correo al confirmar");
      await page.getByText("¿Olvidaste tu contraseña?", { exact: true }).click();
      await page.getByLabel("Correo", { exact: true }).fill(user.email);
      await page.getByRole("button", { name: "Enviar código", exact: true }).click();
      await page.waitForURL("**/verify-recovery?*");
      await page.getByLabel("Código de verificación", { exact: true }).fill("123456");
      await page.getByRole("button", { name: "Verificar", exact: true }).click();
      await page.waitForURL("**/new-password");
      await page.getByLabel("Nueva contraseña", { exact: true }).fill("OtraPrueba2026");
      await page.getByLabel("Confirmar contraseña", { exact: true }).fill("OtraPrueba2026");
      await page.getByRole("button", { name: "Guardar contraseña", exact: true }).click();
      await page.waitForURL("**/success");
      await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
      await page.waitForURL("**/login");
    }
    console.log(`Registro ${immediateSession ? "con sesión y cambio de cuenta" : "sin sesión y recuperación completa"}: verificado`);
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("http://localhost:8081/login");
    await page.getByText("Vuelve a tu biblioteca", { exact: true }).waitFor();
    await page.screenshot({ path: ".expo/auth-preview/390-login-dark.png" });
    await context.close();
  }
}

// Simula únicamente las respuestas de red para verificar saltos, reanudación y conflictos sin crear cuentas reales.
async function verifyOnboarding(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const id = "b9677395-5b2f-4be7-8fa6-3b528cd071f4";
  const user = { id, email: "lectura@example.test", role: "authenticated", aud: "authenticated", app_metadata: {}, user_metadata: {} };
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = [Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url"), Buffer.from(JSON.stringify({ sub: id, exp, role: "authenticated" })).toString("base64url"), "preview"].join(".");
  const session = { access_token: token, refresh_token: "preview", expires_at: exp, expires_in: 3600, token_type: "bearer", user };
  let profile = { ...user, username: "user_preview", display_name: "Lector de prueba", favorite_genres: [], reading_goal: 12, onboarding_step: 1, onboarding_completed: false };
  let completionAttempts = 0;
  await context.addInitScript((session) => localStorage.setItem("sb-nvgygpsuqltjfexsjwoq-auth-token", JSON.stringify(session)), session);
  await context.route("https://*.supabase.co/**", async (route) => {
    const url = route.request().url();
    let body = [];
    let status = 200;
    if (url.includes("/auth/v1/")) body = user;
    else if (url.includes("/rest/v1/users")) {
      if (route.request().method() === "PATCH") profile = { ...profile, ...route.request().postDataJSON() };
      body = profile;
    } else if (url.includes("/rpc/is_username_available")) body = true;
    else if (url.includes("/rpc/complete_onboarding")) {
      completionAttempts++;
      if (completionAttempts === 1) { status = 409; body = { code: "23505", message: "duplicate" }; }
      else { profile = { ...profile, username: route.request().postDataJSON().p_username, onboarding_completed: true }; body = profile; }
    }
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  const page = await context.newPage();
  await page.goto("http://localhost:8081/login");
  await page.getByText("¿Qué te gusta leer?", { exact: true }).waitFor();
  await page.screenshot({ path: ".expo/auth-preview/390-genres.png" });
  await page.getByRole("button", { name: "Saltar este paso", exact: true }).click();
  await page.waitForURL("**/onboarding/goal");
  // Reabre desde el acceso público y comprueba que el guard usa el paso persistido.
  await page.goto("http://localhost:8081/login");
  await page.waitForURL("**/onboarding/goal");
  await page.screenshot({ path: ".expo/auth-preview/390-goal.png" });
  await page.getByRole("button", { name: "Saltar este paso", exact: true }).click();
  await page.waitForURL("**/onboarding/username");
  await page.goto("http://localhost:8081/login");
  await page.waitForURL("**/onboarding/username");
  await page.getByRole("textbox", { name: "Nombre de usuario" }).fill("lectora_prueba");
  await page.getByText("Disponible:", { exact: false }).waitFor();
  await page.screenshot({ path: ".expo/auth-preview/390-username.png" });
  await page.getByRole("button", { name: "Entrar a Lexa", exact: true }).click();
  await page.getByText("Este nombre acaba de ser elegido. Prueba otro.", { exact: true }).waitFor();
  await page.getByRole("textbox", { name: "Nombre de usuario" }).fill("lectora_libre");
  await page.getByText("Disponible:", { exact: false }).waitFor();
  await page.getByRole("button", { name: "Entrar a Lexa", exact: true }).click();
  await page.waitForURL("**/feed");
  if (!profile.onboarding_completed || profile.favorite_genres.length !== 0 || profile.reading_goal !== 12) throw new Error("No se conservaron las preferencias omitidas");
  console.log("Onboarding: saltos, reanudación, conflicto de nombre y finalización verificados con respuestas simuladas");
  await context.close();
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
