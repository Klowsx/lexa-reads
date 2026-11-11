# Runbook de despliegue — Lexa Reads

> Pasos que **no se pueden hacer desde el repo** (requieren acceso al dashboard de
> Supabase, Apple/Google y el hosting del dominio) más los que
> se dejaron **solo documentados a propósito** (PostHog / crash reporting).
> Hacer en este orden. Última actualización: 2026-11-10 (Panamá).

Estado actual: el acceso EAS propietario funciona y el entorno `preview` contiene
las dos variables públicas de Supabase. `delete-account` v3 y `send-push` v2 están
activos. Las migraciones de noviembre corrigen los permisos efectivos de columnas,
el arranque de DM y la firma de eventos. La evidencia está en
[la adopción de Stitch](stitch-adoption.md); los pasos históricos siguientes no
deben repetirse sin comprobar el estado remoto.

Leyenda: 🔴 bloqueante de seguridad · 🟠 bloqueante de tiendas · 🔵 recomendado.

---

## 1. 🔴 Aplicar migraciones `012`–`018` (SQL Editor, rol `postgres`)

Aplicar **en orden** en Supabase → SQL Editor (corre como `postgres`, necesario
para los `REVOKE` de `017` y el `DELETE FROM auth.users` de `013`).

| Migración                                     | Qué hace                                                                      | Notas                        |
| --------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------- |
| `012_books_insert_hardening.sql`              | Atribución `added_by` + `is_admin` + moderación de `books`                    | —                            |
| `013_account_hard_delete.sql`                 | Hard-delete real (cascada + audit trail)                                      | Requiere `postgres`          |
| `014_privacy_and_blocks.sql`                  | Privacidad unificada + bloqueo bidireccional                                  | —                            |
| `015_reports_moderation.sql`                  | Policies admin sobre `reports`                                                | —                            |
| `016_content_length_limits.sql`               | CHECK de longitud en comments/reviews/bio                                     | —                            |
| `017_privilege_and_search_path_hardening.sql` | **REVOKE de `is_admin`/contadores** + `search_path` en funciones DEFINER      | Requiere `postgres`          |
| `018_notifications_dedupe.sql`                | Índice único parcial + trigger de follower preciso                            | —                            |
| `019_messaging_enums.sql`                     | `ADD VALUE` a notification_type y report_target_type                          | **Antes** de 020             |
| `020_messaging.sql`                           | Mensajería: conversations/messages/club_topics, RLS, RPCs, triggers, realtime | Requiere `postgres` (REVOKE) |
| `021_notification_prefs_messaging.sql`        | `push_dm` / `push_club` en notification_preferences                           | —                            |

**Verificación post-aplicación:**

- `Database → Advisors`: no debe quedar el warning **"Function Search Path Mutable"**.
- La migración 017 por sí sola no basta: un permiso UPDATE de tabla prevalece sobre REVOKE por columna. Aplicar `20261111000141_correct_client_column_privileges.sql` y ejecutar `supabase/tests/client-column-privileges.sql` y `supabase/tests/account-lifecycle.sql` completos. Ambos pasaron contra Lexa con rollback.
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

`delete-account` requiere sus dos archivos de runtime, `index.ts` y `handler.ts`,
y mantiene `verify_jwt=true`. `export-user-data` conserva verificación JWT.

`send-push` autentica por firma HMAC propia y usa `verify_jwt=false`; no debe
recibir credenciales del cliente. Supabase inyecta `SUPABASE_URL`,
`SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` automáticamente.

La firma se prepara con `20261110152107_push_webhook_vault.sql` y se sustituye
por `20261111000734_sign_push_events_without_queue_secrets.sql`. En instalaciones
nuevas desplegar el handler final, aplicar las dos migraciones en orden y no
intercalar pruebas de envío. No reutilizar el antiguo header `x-webhook-secret`
ni configurar `WEBHOOK_SECRET`: la versión final los rechaza.

---

## 4. 🔴 Database Webhook de `send-push`

El trigger `lexa_private.enqueue_notification_push` encola solo INSERT de
notificaciones persistidas con el ID y los headers `x-push-signature` y
`x-push-issued-at`. El destino es fijo y la clave permanece en Vault. No crear
otro webhook de dashboard, pues duplicaría el productor.

La RPC pública de verificación es invoker y solo permite a `service_role`
comprobar firmas. La ventana es cinco minutos, con treinta segundos de tolerancia
futura. Una firma permite repetir ese mismo evento durante la ventana; no hay
reintentos durables, deduplicación ni comprobación de recibos de Expo todavía.

Las ACL de la cola administrada de pg_net no se pudieron retirar con `postgres`.
La solución evita transportar allí la clave maestra y rota la usada inicialmente.
`supabase/tests/push-webhook-deployed.sql` verifica firma válida, adulteraciones,
caducidad y permisos sin cambiar Vault, devolver claves ni invocar HTTP.
`push-webhook.sql` utiliza una clave sintética dentro de rollback y es solo local.

Sin firma, el endpoint responde 403. La comprobación de entrega a dispositivo
sigue pendiente; no confundir un ticket aceptado de Expo con entrega efectiva.

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
- **Android** — `assetlinks.json` contiene la huella real del certificado de la
  distribución interna EAS. Se verificó el APK `8882369d` mediante la biblioteca
  oficial [apksig](https://android.googlesource.com/platform/tools/apksig): firma v2
  válida, sin advertencias. Es una huella de preview; antes de publicar en Play,
  añadir la del certificado de **App signing** de Play Console si es diferente.
  Servir el archivo en `https://lexareads.app/.well-known/assetlinks.json`.
- El dominio no resolvió por DNS en la comprobación del 10 de noviembre. Preparar
  los archivos locales no publica la asociación; falta configurar DNS/hosting
  y verificar los endpoints reales con sus tipos de contenido correctos.
- Verificar: [Apple AASA validator] y `https://developers.google.com/digital-asset-links/tools/generator`.

---

## 7. 🔴 Activar el catálogo comunitario

Aplicar en orden `20261021011109_community_books.sql` y
`20261021020000_book_metadata_cover_votes.sql` antes de publicar esta versión.
Crean la búsqueda paginada, el vocabulario compartido, las descripciones es/en,
el bucket `book-covers`, la votación y un job de `pg_cron` que fija la ganadora
cada hora al cumplirse siete días. Después, regenerar tipos con `pnpm gen:types`
y comprobar el alta, las sugerencias de términos, las propuestas, un cambio de
voto y la corrección de moderación.

---

## 8. 🔵 PostHog + crash reporting ⚠️ NO IMPLEMENTADO — pendiente a propósito

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
import { PostHogProvider } from 'posthog-react-native'

// dentro de RootLayout, envolviendo QueryClientProvider:
;<PostHogProvider
  apiKey={process.env.EXPO_PUBLIC_POSTHOG_KEY!}
  options={{
    host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
    // No arrancar la captura hasta tener consentimiento:
    defaultOptIn: false, // lusar posthog.optIn() tras aceptar el ConsentModal
    enableSessionReplay: false // privacidad por defecto
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
import { usePostHog } from 'posthog-react-native'
import { setCrashReporter } from '~/lib/crash-reporting'

// en un efecto de arranque, con el cliente ya disponible:
setCrashReporter((error, context) => {
  posthog.captureException(error, context)
})
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

## Criterios de salida

Antes de una beta, este runbook debe completarse con las migraciones, tipos,
funciones, secretos, webhook, administrador y enlaces profundos descritos arriba.
También deben validarse el catálogo, las pruebas configuradas y, si se activa,
la observabilidad protegida por consentimiento. El estado verificable de cada
uno se mantiene en [Pendientes](pendientes.md).
