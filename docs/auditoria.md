# Auditoría técnica — Lexa Reads (2ª ronda)

> Revisión profunda de seguridad, arquitectura, datos, privacidad, performance y store-readiness.
> Fecha: **2026-06-04** · Rama: `master`
> Alcance: `app/`, `src/`, `supabase/migrations/` (001–018), `supabase/functions/` (4), config (`app.json`, `eas.json`, `package.json`).
>
> **Metodología:** lectura directa del código y reconstrucción del **estado final** de RLS cruzando las migraciones, las Edge Functions, el cliente Supabase, los stores, `google-books.ts`/`nyt-books.ts` y el árbol de `_layout`. `pnpm tsc --noEmit` pasa limpio.

## Veredicto general

La 1ª ronda de auditoría quedó **cerrada en código** (ver §"Resuelto en la 1ª ronda"). En esta 2ª pasada encontré **dos problemas nuevos de seguridad que la propia 1ª ronda introdujo o pasó por alto**, ambos ya corregidos en código:

1. 🔴 **Escalado de privilegios a admin** — la migración 012 añadió `users.is_admin` pero nadie protegió la columna: cualquier usuario podía hacerse administrador con un `UPDATE`.
2. 🟠 **`search_path` mutable** en ~15 funciones `SECURITY DEFINER` — vector clásico de secuestro de funciones y warning del linter de Supabase.

Más una mejora de fiabilidad de cliente (sesión > 2 KB en Android) y varios puntos de hardening/observabilidad documentados. **La arquitectura sigue siendo sólida** y respeta CLAUDE.md.

## Leyenda de severidad

| Nivel | Significado                                                  |
| ----- | ------------------------------------------------------------ |
| 🔴 P0 | Seguridad / abuso explotable. Arreglar ya.                   |
| 🟠 P1 | Compliance bloqueante de stores o privacidad.                |
| 🟡 P2 | Bug de datos / fiabilidad.                                   |
| 🟢 P3 | UX / accesibilidad / pulido.                                 |
| 🔵 P4 | Deuda técnica / consistencia / performance / observabilidad. |

---

## 🔴 NEW-1 · Escalado de privilegios: cualquiera puede hacerse `is_admin` — ✅ RESUELTO

**Archivos:** `001_initial_schema.sql:475` (policy) + `012_books_insert_hardening.sql:24` (`is_admin`) → corregido en `017_privilege_and_search_path_hardening.sql`

**Problema:** la policy de UPDATE de `users` es `FOR UPDATE USING (auth.uid() = id)`. **RLS no puede restringir columnas**, así que la policy autoriza actualizar _cualquier_ columna de la propia fila — incluida `is_admin`, que la migración 012 introdujo sin ninguna protección. Un usuario autenticado podía ejecutar:

```sql
UPDATE users SET is_admin = true WHERE id = auth.uid();
```

y con ello obtener, vía las policies de 012/015:

- **Lectura/resolución de TODOS los reportes** (`reports`) → PII y reportes de otros usuarios.
- **UPDATE/DELETE del catálogo global `books`** → vandalismo del catálogo compartido.

El mismo agujero permitía **inflar los contadores desnormalizados** (`followers_count`, `following_count`, `books_read_count`, `reviews_count`), que según CLAUDE.md §11 solo deben tocarlos los triggers.

**Fix aplicado (migración 017):** como RLS no filtra columnas, se usan **privilegios por columna** (`REVOKE UPDATE (col)`), que sí lo hacen:

```sql
REVOKE UPDATE (is_admin) ON public.users FROM anon, authenticated;
REVOKE UPDATE (followers_count, following_count, books_read_count, reviews_count)
  ON public.users FROM anon, authenticated;
```

Las funciones de contador y `handle_new_user` son `SECURITY DEFINER` (owner = `postgres`) y **bypasean** el REVOKE → siguen manteniendo los contadores. La promoción de un admin se hace por SQL Editor / `service_role` (también bypasea). El cliente deja de poder tocar esas columnas; un `UPDATE` normal de perfil (bio, display_name, etc.) sigue funcionando porque no las referencia.

De paso se blindó `account_deletion_requests`: se revoca el UPDATE de `scheduled_delete_at`, `processed_at` y `user_id` (el usuario solo debe poder **cancelar** su solicitud, no posponer/evadir el hard-delete).

- Corregido en código: bloqueo de `is_admin` y contadores a nivel de columna (migración 017).
- Añadido test de regresión: `rls.test.ts` cubre la auto-promoción y el inflado de contadores.
- El despliegue de `017` en el SQL Editor (rol `postgres`) se controla en [Pendientes](pendientes.md).

---

## 🟠 NEW-2 · `search_path` mutable en funciones `SECURITY DEFINER` — ✅ RESUELTO

**Archivos:** `001` (6 fns), `002` (4 fns), `003` (1 fn), `011` (4 fns) → corregido en `017`

**Problema:** todas las funciones `SECURITY DEFINER` de las migraciones 001–011 (`update_*_count`, `handle_new_user`, `notify_*`, `immutable_array_to_string`) se crearon **sin `SET search_path`**. Una función DEFINER corre con los privilegios de su dueño; si su `search_path` es mutable, un atacante que pueda crear objetos en un esquema visible (p. ej. uno temporal) puede **secuestrar la resolución de nombres** (tablas/funciones) y ejecutar código con privilegios elevados. Es el warning **"Function Search Path Mutable"** del linter de Supabase. Las funciones de 013/014 ya lo fijaban; estas no.

**Fix aplicado (migración 017):** `ALTER FUNCTION ... SET search_path = public, pg_temp` en las ~15 funciones restantes (`pg_temp` al final para que un esquema temporal no intercepte la resolución). No cambia el cuerpo ni invalida el índice que usa `immutable_array_to_string`.

- Corregido en código: `search_path` fijado en las funciones DEFINER (migración 017).
- El despliegue de `017` y la comprobación de Advisors se controlan en [Pendientes](pendientes.md).

---

## 🟡 NEW-3 · Sesión de Supabase > 2 KB puede no persistir en Android — ✅ RESUELTO

**Archivo:** `src/lib/supabase.ts`

**Problema:** el adaptador de `expo-secure-store` guardaba la sesión entera en una sola clave. El Keystore de Android **avisa/falla con valores > 2048 bytes**; la sesión de Supabase (JWT + refresh token, a veces con claims extra de OAuth) puede superarlo → la sesión **no persiste y el usuario es deslogueado al reabrir la app**.

**Fix aplicado:** adaptador con **fragmentación**: si el valor supera ~2000 bytes, se trocea en `${key}.0..N` y la clave base guarda un descriptor `chunks:N`. Lectura, escritura (con limpieza de fragmentos huérfanos si la sesión encoge) y borrado son transparentes para Supabase. Compatible con valores legados no fragmentados.

- Corregido en código: adaptador SecureStore con fragmentación (`src/lib/supabase.ts`).

---

## 🔵 NEW-4 · API keys de terceros embebidas en el cliente — ✅ RESUELTO (NYT)

**Archivos:** `src/lib/nyt-books.ts`, `src/lib/google-books.ts:47` → Edge Function `supabase/functions/nyt-bestsellers/index.ts`

**Problema:** `EXPO_PUBLIC_NYT_API_KEY` y `EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY` se **empaquetan en el bundle JS** y se envían a cada dispositivo → extraíbles trivialmente. Cualquiera puede sacar la key de NYT y **quemar tu cuota** o hacer que te rate-limiteen/baneen.

**Fix aplicado (NYT):** nueva Edge Function `nyt-bestsellers` que guarda la key como **secret del servidor** (`Deno.env.get("NYT_API_KEY")`), exige usuario autenticado, valida la lista contra una whitelist y devuelve **solo los ISBNs**. `nyt-books.ts` ahora la invoca con `supabase.functions.invoke` y resuelve cada ISBN con el flujo cache-first de `google-books.ts` (preserva CLAUDE.md §4). El cliente ya **no lleva ninguna key de NYT**; `.env.example` lo refleja.

- Corregido en código: proxy de NYT vía Edge Function (`nyt-bestsellers`) y cliente sin la key.
- El despliegue de la función, su secreto y la restricción de la key de Google Books se controlan en [Pendientes](pendientes.md).

---

## 🔵 NEW-5 · PostHog instalado pero nunca inicializado — ⏸️ DOCUMENTADO (excluido a propósito)

**Archivos:** `package.json` (`posthog-react-native`), `app/_layout.tsx`, `src/lib/crash-reporting.ts`

**Problema:** `posthog-react-native` está en dependencias y `crash-reporting.ts` expone `setCrashReporter`, **pero no hay `PostHogProvider`/`init` en el árbol** y `setCrashReporter` nunca se llama → el `ErrorBoundary` solo loguea a consola, **no llega ningún crash/evento a producción**. La app saldría a tiendas **a ciegas**.

**Decisión:** se deja **sin implementar a propósito** (igual que Sentry). El paso a paso completo (env, `PostHogProvider` gated por `ConsentModal`, conexión de `setCrashReporter`, eventos clave) queda documentado en **`docs/despliegue.md §8`**.

- La inicialización de PostHog y la conexión de `setCrashReporter` se controlan en [Pendientes](pendientes.md).

---

## 🔵 NEW-6 · `ON CONFLICT DO NOTHING` de notificaciones era un no-op — ✅ RESUELTO

**Archivo:** `supabase/migrations/011_notifications.sql` (los 4 `notify_*`) → corregido en `018_notifications_dedupe.sql`

**Problema:** los triggers insertan con `ON CONFLICT DO NOTHING`, pero `notifications` **no tenía ningún índice/constraint UNIQUE** (`001:252` solo crea un índice no único) → la cláusula nunca encontraba conflicto y **no aportaba idempotencia**. Además `notify_new_follower` corría en `AFTER INSERT OR UPDATE` (cualquier UPDATE de la fila lo re-disparaba).

**Fix aplicado (migración 018):**

1. Índice **único parcial** `uq_notifications_unread_dedup (recipient_id, actor_id, type, reference_id) WHERE read_at IS NULL` → da semántica al `ON CONFLICT DO NOTHING` sin tocar los triggers: no se apilan notificaciones idénticas **sin leer**; si el usuario ya la leyó, una nueva interacción sí notifica.
2. Trigger de follower precisado a `AFTER INSERT OR UPDATE OF status`.

- Corregido en código: idempotencia real de notificaciones (migración 018).
- El despliegue de `018` se controla en [Pendientes](pendientes.md).

---

## Resuelto en la 1ª ronda (2026-06-03) — referencia

Cerrado **en código**; pendiente solo de **despliegue** (ver abajo). Detalle histórico en el control de versiones.

| ID          | Hallazgo                                            | Fix                                         |
| ----------- | --------------------------------------------------- | ------------------------------------------- |
| S-1         | `send-push` sin validar origen del webhook          | secreto `x-webhook-secret` (fail-closed)    |
| S-2         | Inyección en filtro PostgREST por ISBN              | guarda de formato en `getBookByIsbn`        |
| S-3         | Catálogo `books` con INSERT abierto                 | migración 012 (atribución + admin)          |
| C-1         | Hard-delete no borraba contenido ni `auth.users`    | migración 013 (cascada real)                |
| C-2         | Reseñas ignoraban `is_private`                      | migración 014 (modelo unificado)            |
| C-3         | Bloqueo unidireccional                              | migración 014 (`is_blocked_with`)           |
| C-4         | Sin moderación de reportes                          | migración 015 + `docs/moderacion.md`        |
| D-1/P-1     | Optimistic likes con `useState` + invalidate global | caché + `useOptimisticLike`                 |
| D-2         | Cursor solo por `created_at`                        | cursor compuesto `(created_at, id)`         |
| D-3         | `ADD VALUE` de enum + uso en misma migración        | `011_notification_enum.sql` separado        |
| D-4         | Sin límites de longitud de contenido                | migración 016 + zod                         |
| O-1         | Sin ErrorBoundary                                   | `ErrorBoundary` raíz + `crash-reporting.ts` |
| UX-1        | Cero accesibilidad                                  | pase de a11y en superficies núcleo          |
| UX-2        | Sin `QueryBoundary`/skeletons                       | infra + feed/library/book/profile           |
| A-1/A-2/A-3 | Docs desfasados / auth web / deep links             | sincronizados / documentado / plantillas    |

> i18n (UX-3): sigue **parcial** — extracción mecánica de strings hardcodeados pendiente.

---

## Pendientes de despliegue (no de código)

**Runbook completo y a detalle: `docs/despliegue.md`.** Resumen:

1. Aplicar migraciones `012` → `018` en orden (SQL Editor, rol `postgres`; `017` lo requiere por los REVOKE, `013` por el DELETE en `auth.users`).
2. `pnpm gen:types` + retirar los `as any` que sobran.
3. Desplegar las 4 Edge Functions (incl. la nueva `nyt-bestsellers`) y setear secrets `WEBHOOK_SECRET` y `NYT_API_KEY`.
4. Configurar el header `x-webhook-secret` en el Database Webhook de `send-push`.
5. Promover al menos un admin por SQL (el cliente ya no puede tras 017).
6. Publicar y verificar `apple-app-site-association` y `assetlinks.json`.
7. Restringir la key de Google Books en Cloud Console.
8. _(Excluido a propósito)_ PostHog + `setCrashReporter` — documentado en `docs/despliegue.md §8`.

## Features y pre-submit aún abiertos

Ver **`docs/pendientes.md`** (features de MVP que faltan + pre-submit + diferido).

---

## Orden de ataque sugerido

| Orden | Item                                   | Estado                                                           |
| ----: | -------------------------------------- | ---------------------------------------------------------------- |
|     1 | **NEW-1** escalado a admin             | ✅ Código (falta aplicar `017`)                                  |
|     2 | **NEW-2** search_path                  | ✅ Código (falta aplicar `017`)                                  |
|     3 | **NEW-3** SecureStore > 2 KB           | ✅ Código                                                        |
|     4 | **NEW-4** keys de terceros (proxy NYT) | ✅ Código (falta desplegar función + secret)                     |
|     5 | **NEW-6** dedupe notificaciones        | ✅ Código (falta aplicar `018`)                                  |
|     6 | **NEW-5** PostHog init                 | ⏸️ Excluido a propósito — documentado en `docs/despliegue.md §8` |

> Regla (CLAUDE.md): cada fix de RLS debe probarse contra una instancia real de Supabase. Los tests de `src/__tests__/features/auth/rls.test.ts` (con `SUPABASE_SERVICE_ROLE_KEY`) ya cubren NEW-1.
