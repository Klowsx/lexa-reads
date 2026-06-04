# Runbook de despliegue — Lexa Reads

> Pasos que **no se pueden hacer desde el repo** (requieren acceso al dashboard de
> Supabase, Google/NYT Cloud, Apple/Google y el hosting del dominio) más los que
> se dejaron **solo documentados a propósito** (PostHog / crash reporting).
> Hacer en este orden. Última actualización: 2026-06-04.

Leyenda: 🔴 bloqueante de seguridad · 🟠 bloqueante de tiendas · 🔵 recomendado.

---

## 1. 🔴 Aplicar migraciones `012`–`018` (SQL Editor, rol `postgres`)

Aplicar **en orden** en Supabase → SQL Editor (corre como `postgres`, necesario
para los `REVOKE` de `017` y el `DELETE FROM auth.users` de `013`).

| Migración | Qué hace | Notas |
|-----------|----------|-------|
| `012_books_insert_hardening.sql` | Atribución `added_by` + `is_admin` + moderación de `books` | — |
| `013_account_hard_delete.sql` | Hard-delete real (cascada + audit trail) | Requiere `postgres` |
| `014_privacy_and_blocks.sql` | Privacidad unificada + bloqueo bidireccional | — |
| `015_reports_moderation.sql` | Policies admin sobre `reports` | — |
| `016_content_length_limits.sql` | CHECK de longitud en comments/reviews/bio | — |
| `017_privilege_and_search_path_hardening.sql` | **REVOKE de `is_admin`/contadores** + `search_path` en funciones DEFINER | Requiere `postgres` |
| `018_notifications_dedupe.sql` | Índice único parcial + trigger de follower preciso | — |
| `019_messaging_enums.sql` | `ADD VALUE` a notification_type y report_target_type | **Antes** de 020 |
| `020_messaging.sql` | Mensajería: conversations/messages/club_topics, RLS, RPCs, triggers, realtime | Requiere `postgres` (REVOKE) |
| `021_notification_prefs_messaging.sql` | `push_dm` / `push_club` en notification_preferences | — |

**Verificación post-aplicación:**
- `Database → Advisors`: no debe quedar el warning **"Function Search Path Mutable"**.
- Probar como usuario normal (no admin): `UPDATE users SET is_admin = true WHERE id = auth.uid();` debe **no** cambiar el valor (sigue `false`).
- Correr los tests de RLS con `SUPABASE_SERVICE_ROLE_KEY` seteada: `pnpm jest src/__tests__/features/auth/rls.test.ts`.
- **Realtime:** confirmar que `messages` está en `Database → Replication → supabase_realtime` (la migración 020 lo añade; si el entorno no tenía la publicación, añadirlo a mano). Sin esto el chat no actualiza en vivo (solo al refrescar).
- **Mensajería:** verificar que un no-admin NO puede `UPDATE reading_club_members SET role='owner'` ni `state='active'` directo (REVOKE de 020); la aprobación/rol van por los RPCs `approve_club_member`/`set_club_member_role`.

---

## 2. 🔴 Regenerar tipos de la base

Tras aplicar las migraciones, los tipos del cliente quedan desfasados
(`added_by`, `is_admin`, `push_token` no existen aún en `database.ts`; hay
varios `as any` que desaparecen al regenerar):

```bash
pnpm gen:types     # supabase gen types typescript --project-id nvgygpsuqltjfexsjwoq > src/types/database.ts
pnpm tsc --noEmit  # debe seguir pasando limpio
```

Luego quitar los `as any` ya innecesarios (p. ej. en `usePushOptIn.ts`,
`rls.test.ts` el `@ts-expect-error` de `is_admin`, y el `const sb = supabase as any`
de `src/features/chat/chat.queries.ts` y `src/features/clubs/clubs.queries.ts`,
que existen porque las tablas de mensajería aún no están en `database.ts`).

---

## 3. 🔴 Desplegar Edge Functions y secrets

```bash
supabase functions deploy send-push
supabase functions deploy nyt-bestsellers
supabase functions deploy delete-account
supabase functions deploy export-user-data
```

Secrets (Supabase → Edge Functions → Secrets, o CLI):

```bash
supabase secrets set WEBHOOK_SECRET=<valor-aleatorio-largo>
supabase secrets set NYT_API_KEY=<key-de-developer.nytimes.com>
```

- `WEBHOOK_SECRET`: sin él, `send-push` rechaza TODO (fail-closed) → las push
  no llegan hasta configurarlo. Generar con `openssl rand -hex 32`.
- `NYT_API_KEY`: la usa la nueva función `nyt-bestsellers` (NEW-4). El cliente
  ya no lleva ninguna key de NYT.
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` ya las
  inyecta Supabase automáticamente en las functions.

---

## 4. 🔴 Database Webhook de `send-push`

En Supabase → Database → Webhooks, el webhook que dispara `send-push` en
`INSERT` sobre `notifications` debe enviar el header:

```
x-webhook-secret: <el mismo valor de WEBHOOK_SECRET>
```

Sin este header (o con valor distinto) la función responde `403`.

---

## 5. 🔴 Promover el primer admin

El cliente ya **no puede** tocar `is_admin` (migración 017). Promover por SQL
Editor (corre como `postgres`, bypasea el REVOKE):

```sql
UPDATE users SET is_admin = true WHERE username = 'tu_usuario';
```

El admin habilita la cola de moderación de reportes — ver `docs/moderacion.md`.

---

## 6. 🟠 Deep links: publicar archivos de asociación

Plantillas en `public/.well-known/` (ver su `README.md`). Antes del submit:

- **iOS** — `apple-app-site-association`: rellenar `TEAMID` (Apple Developer →
  Membership) en `TEAMID.com.lexareads.app`. Servir en
  `https://lexareads.app/.well-known/apple-app-site-association`
  con `Content-Type: application/json` y **sin** extensión.
- **Android** — `assetlinks.json`: rellenar el `sha256_cert_fingerprints` con
  el SHA-256 de la firma de release (`eas credentials` o Play Console → App
  signing). Servir en `https://lexareads.app/.well-known/assetlinks.json`.
- Verificar: [Apple AASA validator] y `https://developers.google.com/digital-asset-links/tools/generator`.

---

## 7. 🔵 Restringir la key de Google Books

`EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY` viaja en el bundle (NEW-4). En Google Cloud
Console → Credenciales → la API key:
- Restringir a la **Books API** únicamente.
- Poner una **cuota** diaria razonable para limitar el abuso si se extrae.
- (Opcional, más seguro) proxificarla también vía Edge Function, igual que NYT.

---

## 8. 🔵 PostHog + crash reporting  ⚠️ NO IMPLEMENTADO — pendiente a propósito

> Decisión: **sin Sentry**. PostHog ya está en dependencias
> (`posthog-react-native`) pero **nunca se inicializa**, así que hoy el
> `ErrorBoundary` solo loguea a consola y **no llega ningún crash/evento a
> producción** (NEW-5). Esto se dejó sin cablear; documentado aquí en detalle.

### 8.1 Variables de entorno

Añadir a `.env.local` y a los secrets de EAS (build):

```
EXPO_PUBLIC_POSTHOG_KEY=phc_xxx
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com   # o eu
```

### 8.2 Inicialización en `app/_layout.tsx`

Envolver el árbol con `PostHogProvider` **por dentro** del `ErrorBoundary` y
**respetar el consentimiento** (`ConsentModal` ya existe): no capturar hasta que
el usuario acepte. Esquema:

```tsx
import { PostHogProvider } from "posthog-react-native";

// dentro de RootLayout, envolviendo QueryClientProvider:
<PostHogProvider
  apiKey={process.env.EXPO_PUBLIC_POSTHOG_KEY!}
  options={{
    host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
    // No arrancar la captura hasta tener consentimiento:
    defaultOptIn: false,            // lusar posthog.optIn() tras aceptar el ConsentModal
    enableSessionReplay: false,     // privacidad por defecto
  }}
  autocapture={{ captureLifecycleEvents: true, captureScreens: true }}
>
  {/* ...resto del árbol... */}
</PostHogProvider>
```

En el handler de aceptación del `ConsentModal`, llamar `posthog.optIn()`; en el
de rechazo, `posthog.optOut()`.

### 8.3 Conectar el crash reporter

`src/lib/crash-reporting.ts` ya expone el punto de enganche `setCrashReporter`.
En el arranque (una vez que hay cliente PostHog y consentimiento):

```tsx
import { usePostHog } from "posthog-react-native";
import { setCrashReporter } from "~/lib/crash-reporting";

// en un efecto de arranque, con el cliente ya disponible:
setCrashReporter((error, context) => {
  posthog.captureException(error, context);
});
```

El `ErrorBoundary` raíz ya llama `logError`, que reenvía al reporter en cuanto
esté conectado. No hace falta tocar el `ErrorBoundary`.

### 8.4 Eventos clave (Fase F del roadmap)

Mínimo recomendado para producción: `signup_completed`, `book_added`,
`review_published`, `follow_created`, `search_performed`, `push_opt_in`.

### 8.5 Verificación

- Forzar un error de render en dev → debe aparecer en PostHog → Error tracking.
- Confirmar que **sin** consentimiento no se envía ningún evento.

---

## Checklist final (Go / No-Go)

- [ ] Migraciones `012`–`018` aplicadas; Advisors sin "Search Path Mutable"
- [ ] `pnpm gen:types` + `pnpm tsc --noEmit` limpio; `as any` retirados
- [ ] 4 Edge Functions desplegadas
- [ ] `WEBHOOK_SECRET` y `NYT_API_KEY` seteados
- [ ] Webhook de `send-push` con header `x-webhook-secret`
- [ ] Al menos un admin promovido
- [ ] `apple-app-site-association` y `assetlinks.json` publicados y verificados
- [ ] Key de Google Books restringida en Cloud Console
- [ ] (Si se hace) PostHog inicializado, gated por consentimiento, crash reporter conectado
- [ ] `pnpm jest` (incluye RLS con service-role) en verde
