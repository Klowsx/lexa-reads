# Pendientes — Lexa Reads

> **Qué falta** para lanzar y después. Fuente única de "lo que queda".
> Producto/DB/arquitectura → `STACK.md` · seguridad → `auditoria.md` · despliegue → `despliegue.md` · moderación → `moderacion.md`.
> El MVP (Fase 1) está construido y conectado a Supabase salvo lo de abajo.

Leyenda: 🔴 estructural / bloqueante real · 🟠 debería entrar antes de lanzar · 🔵 nice-to-have · ⏸️ diferido a propósito.

---

## Features de MVP que faltan

### 🟠 Google OAuth (login)

Hoy solo hay email/contraseña; `STACK §2` lo marca como MVP. Es el método de registro #1 en móvil → sin él se pierde conversión en onboarding.

**Implementación (cliente):** ✅ Hecho. Flujo con `expo-web-browser` + `supabase.auth.signInWithOAuth` en `src/features/auth/auth.queries.ts`, botón conectado en `login.tsx`/`register.tsx`, deep link handler en `app/_layout.tsx`. Redirect `lexa://auth/callback` (el scheme ya está en `app.json`).

> ⚠️ **No funciona en Expo Go Android** — Google OAuth requiere el SHA-1 del certificado de firma de la app. Expo Go usa el certificado de Expo, no el de `com.lexareads.app`. Para probar en Android se necesita un **development build** (`npx eas build --profile development`). En iOS simulator funciona sin configuración extra.

**Setup de dashboard (one-time) — ⏸️ BLOQUEADO hasta builds reales:**

1. **Supabase** → Authentication → Providers → Google: activar y pegar `Client ID` + `Client Secret`. En Redirect URLs: `lexa://auth/callback` (prod) y `https://<project>.supabase.co/auth/v1/callback` (web).
2. **Google Cloud Console** → APIs & Services → Credentials:
   - **Web client**: Authorized redirect URIs → callback de Supabase (`https://<project>.supabase.co/auth/v1/callback`).
   - **iOS client** (tipo iOS): Bundle ID = `com.lexareads.app`.
   - **Android client** (tipo Android): Package name = `com.lexareads.app`. **SHA-1 certificate fingerprint**: generar con `npx eas build --profile development --platform android` (EAS lo muestra al final del build) o con `eas credentials`.

### 🟠 Escaneo de ISBN por cámara

`expo-camera` ya está en deps y `getBookByIsbn()` (en `google-books.ts`) está listo y validado — **solo falta la UI**. Diferenciador real vs. teclear títulos; `STACK §2` lo lista como MVP.

**Implementación:** botón en `SearchBar` → pantalla con `CameraView` (barcode `ean13`/`upc`) → al detectar, `getBookByIsbn(code)` → navegar a `book/[id]`.

### 🟠 Sugerencias de follow en onboarding

Evita el "cold start": hoy un usuario nuevo entra a un feed vacío. `STACK §2` pide "sigue ≥5 para continuar" como último step del onboarding.

**Implementación:** step en `app/(auth)/onboarding/` con query a usuarios más seguidos / con más en común; gate de ≥5 follows antes de entrar al feed.

### 🔵 Fallback a Open Library

Cuando Google Books no encuentra el libro. `STACK §2` lo menciona; hoy solo Google Books. Iría dentro de `google-books.ts` (manteniéndolo como única puerta de catálogo).

### 🔵 i18n completo

i18n está cableado pero quedan strings hardcodeados en pantallas. Tarea mecánica: mover a `src/locales/{es,en}.json`.

---

## Infraestructura, calidad y operación (nivel pro)

Huecos estructurales detectados (2026-06-04). Ordenados por impacto. Lo de arriba
es producto; esto es lo que sostiene el producto en producción.

### 🔴 CI + linting (no existe)

No hay `.github/workflows`, ni ESLint/Prettier, ni script `lint`. Hoy nada impide
mergear código que rompe `tsc` y el estilo es manual.
**Hacer:** GitHub Actions que corra `pnpm tsc --noEmit` + lint + `pnpm jest` en cada PR;
configurar `eslint` (preset expo) + `prettier` + script `lint`.

### 🔴 Cobertura de tests delgada

**Avance (2026-06-04):** añadidos `src/__tests__/features/chat/messaging.rls.test.ts`
y `clubs.rls.test.ts` (DM/solicitudes/bloqueo + privacidad/roles/moderación de club,
patrón `rls.test.ts`); se auto-saltan si la migración 020 no está desplegada. `jest.config.js`
ahora ignora `.claude/` (worktrees de agentes que duplicaban tests).
**Pendiente:** flujos **Maestro E2E** del camino crítico; tests de hooks/optimistic
(useSendMessage, etc.); **mantener la BD de test migrada en CI** (hoy varios RLS fallan
en local solo porque las migraciones 012–021 no están aplicadas en esa instancia — no son
bugs de código, son deploy-gated).

### 🔴 Antiabuso / rate-limiting

App social **con DMs** sin límites = imán de spam. No hay rate-limit en envío de
mensajes, Edge Functions ni signup; sin captcha. Apple/Play lo evalúan en apps UGC.
**Hacer:** límite de frecuencia de mensajes (p. ej. en RLS/trigger o Edge), rate-limit
en functions, captcha/turnstile en registro.

### 🔴 Legal incompleto (bloqueante de tiendas) — ✅ en código

**Hecho (2026-06-04):** documentos fuente en `public/legal/` (`terms.md`, `eula.md`,
`community-guidelines.md`) con cláusula de **tolerancia cero** (Apple §1.2); enlazados
desde **Registro** (consentimiento) y **Ajustes → Legal** (`eula`/`communityGuidelines`
en i18n + URLs en `settings.tsx`).
**Pendiente (deploy/legal):** revisar con abogado y rellenar los `<...>`; **publicar**
en `lexareads.app/{terms,eula,community}` (ver `public/legal/README.md`); crear el
documento de **privacidad** (hoy solo es URL, sin contenido en el repo).

### 🟠 Ciclo de vida del push token — ✅ en código (caso síncrono)

**Hecho:** `send-push` ahora inspecciona el _ticket_ de Expo y, ante
`DeviceNotRegistered`/`InvalidCredentials`/`MismatchSenderId`, **limpia el `push_token`**
en `notification_preferences`.
**Pendiente (opcional):** job programado que consulte los _receipts_ asíncronos por
ticket-id (el `DeviceNotRegistered` post-entrega) para una limpieza completa.

### 🟠 Observabilidad (activa)

PostHog instalado pero sin inicializar (ver `auditoria.md` NEW-5), sin crash reporting
real, sin alertas (SLA de reportes, uptime).
**Hacer:** init PostHog + `setCrashReporter` (gated por consentimiento, ver `despliegue.md §8`);
alerta de reportes `pending` > 12h.

### 🔵 Resiliencia offline

Sin persistencia de TanStack Query ni banner de "sin conexión"; el chat se siente roto
sin red. (STACK lo tiene en Fase 3, pero un mínimo conviene antes.)

### 🔵 Otros

- **Forced-update / OTA:** sin gate de versión mínima ni estrategia documentada de EAS Update.
- **Moderación automática:** solo reportes manuales; falta filtro básico de groserías en username/mensajes.
- **Backups/PITR** de Supabase y **monitoreo/uptime** sin configurar (dashboard, no código).
- **N+1 en bandeja de DMs** (`chat.queries.ts` `fetchDMInbox`): optimizar con RPC o denormalizando el último mensaje.

---

## Pre-submit (Fase G)

- [ ] Smoke test en device real iOS + Android con build EAS dev
- [ ] App Store Connect: privacy nutrition labels · Play Console: data safety form
- [ ] Iconos + splash en todas las resoluciones · screenshots de tienda (5–8 por idioma)
- [ ] Build production EAS + TestFlight + Internal Testing
- [ ] E2E con Maestro: signup → search → add → review → like
- [ ] Test de carga del feed (1k seguidos × 50 actividades)
- [ ] Pasos de `despliegue.md` (migraciones, secrets, deep links, admin)

---

## Diferido a propósito (no son huecos del MVP)

Hay **tablas creadas vacías** para estas (decisión de `STACK §3/§4`). No construir sin feedback real.

- **Fase 2:** import de Goodreads (CSV — _primera prioridad_, canal de adquisición), wrap-up anual + stats, retos de lectura (`reading_challenge`), recomendaciones entre amigos (`book_recommendations`), progreso/diario/citas (`reading_sessions`, `book_notes`).
- **Fase 3:** clubes de lectura + mensajería (DMs y chat de club) — **✅ núcleo implementado**, ver `clubs-y-chat.md` (pendiente desplegar migraciones 019–021 + `gen:types`); buddy reads (`buddy_reads`), recomendaciones con IA, quotes con imagen, versión web, modo offline.

> ⚠️ Los tipos de notificación `recommendation_received` y `reading_challenge_completed` ya existen en el enum y en `send-push`, pero **nada los dispara** hasta Fase 2 (código adelantado, no rompe nada).
