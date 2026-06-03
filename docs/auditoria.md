# Auditoría técnica — Lexa Reads

> Revisión profunda de seguridad, compliance, arquitectura, datos, UX/accesibilidad y performance.
> Fecha: 2026-06-03 · Rama: `master`
> Alcance: código de `app/`, `src/`, `supabase/migrations/`, `supabase/functions/`, config (`app.json`, `package.json`).
>
> **Metodología:** lectura directa del código (no solo de los docs, que están desactualizados — ver A-1).
> Se leyeron las 11 migraciones para reconstruir el **estado final** de RLS, las 3 Edge Functions,
> el query-client, los stores, `google-books.ts`, el feed, y patrones de optimistic update.

## Veredicto general

El proyecto está **mucho más maduro de lo que dicen los docs** (`roadmap.md`/`gaps-produccion.md` hablan de "scaffolding", pero el MVP está casi completo y conectado a Supabase). La arquitectura respeta CLAUDE.md con disciplina: separación `app/`↔`src/`, server-state en TanStack, `google-books.ts` como única puerta, `flash-list`, tokens en `expo-secure-store`, RLS por SQL. **El RLS final (tras migración 007/008) está bien resuelto** y respeta bloqueos y privacidad en el feed.

Lo que falta no es estructura sino **endurecimiento**: un hueco de seguridad en una Edge Function, asimetrías de privacidad, un "hard-delete" que no borra de verdad, optimistic updates que se desincronizan, y cero accesibilidad.

## Leyenda de severidad

| Nivel | Significado |
|-------|-------------|
| 🔴 P0 | Seguridad / abuso explotable. Arreglar ya. |
| 🟠 P1 | Compliance bloqueante de stores o privacidad de usuarios. |
| 🟡 P2 | Bug de datos / confiabilidad. Degrada la experiencia o corrompe estado. |
| 🟢 P3 | UX / accesibilidad / pulido. |
| 🔵 P4 | Deuda técnica / consistencia / performance. |

---

## 🔴 P0 — Seguridad  ✅ RESUELTO (2026-06-03)

> Los tres hallazgos de seguridad fueron corregidos. Quedan **dos pasos de despliegue** (no de código) marcados abajo: setear `WEBHOOK_SECRET` y regenerar `database.ts`.

### S-1 · `send-push` no valida el origen del webhook — ✅ Resuelto
**Archivo:** `supabase/functions/send-push/index.ts`
**Problema:** la función confiaba ciegamente en `payload.record` (`recipient_id`, `actor_id`, `type`) sin verificar ningún secreto. Las Edge Functions son URLs públicas; quien descubriera la URL podía `POST`ear un `record` arbitrario y **disparar push notifications a cualquier usuario suplantando a otro**.
**Fix aplicado:** la función ahora rechaza con `403` toda invocación sin el header `x-webhook-secret` correcto, leído de `Deno.env.get("WEBHOOK_SECRET")`:
```ts
const secret = Deno.env.get("WEBHOOK_SECRET");
if (!secret || req.headers.get("x-webhook-secret") !== secret) {
  return new Response("Forbidden", { status: 403 });
}
```
- [x] Validar secreto en `send-push`
- [ ] **Despliegue:** `supabase secrets set WEBHOOK_SECRET=<valor>` y configurar el header `x-webhook-secret: <valor>` en el Database Webhook que dispara la función (en el dashboard de Supabase). Sin esto, la función rechazará TODO (fail-closed) — es seguro pero las push dejan de llegar hasta configurarlo.

### S-2 · Inyección en filtros PostgREST por ISBN — ✅ Resuelto
**Archivo:** `src/lib/google-books.ts` (`getBookByIsbn`)
**Problema:** `.or(\`isbn_10.eq.${isbn},isbn_13.eq.${isbn}\`)` interpolaba `isbn` crudo dentro del string de filtro de PostgREST; comas o caracteres especiales podían romper o manipular el filtro.
**Fix aplicado:** guarda de formato al inicio de `getBookByIsbn` — un ISBN válido es 10 o 13 dígitos, cualquier otra cosa retorna `null` antes de tocar la query:
```ts
if (!/^\d{10}(\d{3})?$/.test(isbn)) return null;
```
- [x] Validar formato ISBN antes de `getBookByIsbn`

### S-3 · Catálogo `books` sin moderación (INSERT abierto) — ✅ Resuelto
**Archivos:** `supabase/migrations/001_initial_schema.sql:494` → reemplazada en `supabase/migrations/012_books_insert_hardening.sql`
**Problema:** `WITH CHECK (auth.role() = 'authenticated')` dejaba a cualquier usuario insertar filas arbitrarias en el catálogo **global y compartido**, sin atribución ni forma de moderar (no había UPDATE/DELETE policy) → contaminación con títulos basura/ofensivos visibles para todos.
**Fix aplicado (migración 012):**
1. `books.added_by uuid DEFAULT auth.uid()` → toda fila queda **atribuida** a quien la insertó.
2. INSERT exige `added_by = auth.uid()` (nadie inserta a nombre de otro). **No rompe** el flujo cache-first de `google-books.ts`: el cliente no setea `added_by`, el DEFAULT lo rellena antes del WITH CHECK.
3. `users.is_admin boolean` + policies de **UPDATE/DELETE solo para admins** → un moderador puede corregir/borrar entradas contaminadas.
- [x] Cerrar y atribuir el INSERT a `books` + habilitar moderación
- [ ] **Despliegue:** aplicar `012_books_insert_hardening.sql` en el SQL Editor y regenerar tipos (`pnpm gen:types`) — `database.ts` aún no refleja `added_by`/`is_admin` (el cliente no los usa, así que no rompe el typecheck).

> **Nota:** estos fixes deben probarse contra Supabase real. Buen candidato para estrenar el agente `test-writer` (RLS de `books`: un no-admin no puede UPDATE/DELETE; un INSERT con `added_by` ajeno es rechazado).

---

## 🟠 P1 — Compliance & Privacidad  ✅ RESUELTO (2026-06-03)

> Los cuatro hallazgos quedaron cubiertos por las migraciones **013, 014, 015** y el runbook `docs/moderacion.md`. Todo es RLS/SQL — **transparente para el cliente** (las queries solo devuelven menos filas), no hubo que tocar hooks. Pendiente de **despliegue**: aplicar las migraciones en orden y regenerar tipos.

### C-1 · El "hard-delete" de cuentas no borra el contenido ni `auth.users` — ✅ Resuelto
**Archivos:** `supabase/migrations/010_compliance.sql` → reemplazado por `supabase/migrations/013_account_hard_delete.sql`
**Problema:** el `pg_cron` solo **anonimizaba la fila `users`**; no tocaba `reviews.body`, `comments.body`, `user_books`, `lists`, ni la fila `auth.users` (el email quedaba retenido para siempre), y nunca marcaba la solicitud como procesada. No cumplía el "derecho al olvido".
**Fix aplicado (migración 013):**
1. Nueva función `hard_delete_due_accounts()` (`SECURITY DEFINER`) que hace `DELETE FROM auth.users` de las cuentas vencidas → **cascada** a `users` y de ahí a `reviews`, `comments`, `user_books`, `lists`, `follows`, likes, etc. Libera el email y borra el contenido.
2. `account_deletion_requests.processed_at` + FK cambiado a `ON DELETE SET NULL` → la solicitud **sobrevive anonimizada** (sin `user_id`) como prueba de cumplimiento.
3. Cron reprogramado para llamar a la función (reemplaza el anonimizador de 010).
- [x] Borrar contenido del usuario en el hard-delete (vía cascada)
- [x] Eliminar la fila `auth.users` (liberar el email)
- [x] Marcar la solicitud como procesada
- [ ] **Despliegue:** aplicar `013` desde el **SQL Editor** (rol `postgres`) para que la función tenga privilegios de DELETE sobre `auth.users`.
> **Decisión de producto a confirmar:** se eligió **borrado total** (los comentarios del usuario en hilos ajenos también desaparecen). Si prefieres **anonimizar** comentarios para no romper hilos, dilo y ajusto la función (scrub de `comments.body` en vez de cascada).

### C-2 · Las reseñas ignoran `is_private` del autor — ✅ Resuelto
**Archivos:** `supabase/migrations/007_rls_fixes.sql:67` → corregido en `014_privacy_and_blocks.sql`
**Problema:** la SELECT de `reviews` no chequeaba `users.is_private` → cuenta privada ocultaba biblioteca y feed pero **dejaba las reseñas públicas**.
**Fix aplicado (migración 014):** **modelo de privacidad unificado** vía la función `can_view_user_content(target)` = *dueño, o perfil público, o seguidor aceptado*. Se aplica igual a `reviews` y `user_books`. El `activity_feed` conserva su semántica de timeline (solo a quienes sigues).
- [x] Reseñas respetan `is_private`
- [x] Modelo unificado: **privado = dueño + seguidores aceptados** (aplicado a `user_books` y `reviews`)

### C-3 · El bloqueo es unidireccional — ✅ Resuelto
**Archivos:** `007_rls_fixes.sql` → corregido en `014_privacy_and_blocks.sql`
**Problema:** las policies solo chequeaban *"si X me bloqueó, no veo a X"*, no el inverso.
**Fix aplicado (migración 014):** función `is_blocked_with(other)` que detecta el bloqueo en **ambos sentidos**, aplicada a las SELECT de `users`, `user_books`, `reviews`, `activity_feed` **y `comments`**.
- [x] Bloqueo bidireccional en `users`, `user_books`, `reviews`, `activity_feed` y `comments`

### C-4 · Falta panel/proceso para resolver reportes ≤24h — ✅ Resuelto
**Archivos:** `015_reports_moderation.sql` + `docs/moderacion.md`
**Problema:** existía la tabla `reports` pero solo el reportante veía sus reportes; no había forma de que un moderador viera/resolviera la cola.
**Fix aplicado:** policies de `SELECT`/`UPDATE` para `users.is_admin` sobre `reports` (migración 015) + **runbook operativo** (`docs/moderacion.md`) con el flujo vía Supabase Studio, acciones de moderación, y queries para medir el SLA de 24h.
- [x] Habilitar moderación de reportes (policies admin)
- [x] Documentar el proceso (runbook)
- [ ] **Despliegue:** promover al menos un admin (`UPDATE users SET is_admin = true WHERE username = '...'`).
- [ ] *(Recomendado)* alerta automática de reportes `pending` > 12h (ver runbook).

---

## 🟡 P2 — Confiabilidad & Datos

### D-1 · Optimistic updates con `useState` local → desincronización con el servidor
**Archivo:** `src/features/feed/hooks/useToggleActivityLike.ts` (y análogos de like)
**Problema:** el hook mantiene `liked`/`count` en `useState` **sembrado desde props**, no en la caché de TanStack. Dos consecuencias:
1. Tras `onSettled` se hace `invalidateQueries(["feed"])` → el feed refetchea y el `FeedCard` recibe props nuevas, **pero `useState` ignora el nuevo valor inicial** → el corazón puede quedar desincronizado del servidor hasta que el componente se desmonte.
2. Viola CLAUDE.md §8 (optimistic = snapshot de **caché** → revert → invalidate), que existe justo para evitar esto.

**Fix:** mover el optimismo a la caché con `setQueryData` sobre `["feed"]` en `onMutate`, revertir en `onError`, y **no** invalidar todo el feed en cada like (ver P-1).
- [ ] Refactor de likes a optimistic sobre caché (activity + review + list)

### D-2 · Cursor de paginación solo usa `created_at` (pierde filas en los bordes)
**Archivos:** `src/features/feed/feed.queries.ts:74` (`.lt("created_at", cursor)`) y `fetchComments:237` (`.gt("created_at", cursor)`)
**Problema:** CLAUDE.md §6 exige cursor `(created_at, id)`. El query ordena por `created_at, id` pero **filtra solo por `created_at`**. Si dos filas comparten timestamp justo en el límite de página (común cuando los triggers insertan en lote en `activity_feed`), se **saltan filas** o se duplican.
**Fix:** cursor compuesto:
```ts
// guardar { created_at, id } como cursor
query = query.or(`created_at.lt.${c.created_at},and(created_at.eq.${c.created_at},id.lt.${c.id})`)
```
- [ ] Cursor compuesto en feed
- [ ] Cursor compuesto en comentarios

### D-3 · `ALTER TYPE ... ADD VALUE` y uso del valor en la misma migración
**Archivo:** `supabase/migrations/011_notifications.sql:11`
**Problema:** `ALTER TYPE notification_type ADD VALUE 'comment_received'` y luego, en la misma migración, un trigger que **usa** ese valor. En Postgres, un valor de enum recién agregado no puede usarse en la misma transacción que lo crea ("unsafe use of new value"). En el SQL Editor de Supabase suele correr fuera de transacción y "funciona", pero es frágil y no reproducible en `supabase db push`.
**Fix:** separar el `ADD VALUE` en su propia migración previa, antes de cualquier uso.
- [ ] Separar el `ADD VALUE` del enum en migración propia

### D-4 · Sin límites de longitud en contenido generado por el usuario
**Archivos:** `comments` (sin tope en `createCommentFn`), `reviews.body` (`text` sin CHECK), bio.
**Problema:** un body de comentario/reseña sin tope permite payloads enormes (abuso/almacenamiento). Solo `EditProfileSheet` valida algo en el cliente.
**Fix:** `CHECK (char_length(body) <= 2000)` en DB + validación `zod` en el formulario.
- [ ] Límites de longitud (DB + zod) en comentarios y reseñas

---

## 🟢 P3 — UX & Accesibilidad

### UX-1 · Cero accesibilidad en toda la app (bloqueante de App Store)
**Evidencia:** `0` ocurrencias de `accessibilityLabel`/`accessibilityRole`/`accessible` en **todos** los `.tsx`.
**Problema:** botones de solo ícono (corazón, "...", compartir, tabs, estrellas) son invisibles para VoiceOver/TalkBack. Es causa común de rechazo en App Store y riesgo legal (ADA/EAA).
**Fix:** añadir `accessibilityRole="button"` + `accessibilityLabel` a cada `Pressable` de ícono; `accessibilityState={{ selected }}` en tabs/segmented; `accessibilityLabel` con el rating en `StarRating`.
- [ ] Pase de accesibilidad en botones de ícono, tabs y rating

### UX-2 · No existe `QueryBoundary` ni skeletons consistentes
**Archivo esperado:** `src/components/ui/QueryBoundary.tsx` (no existe)
**Problema:** CLAUDE.md lo define como el wrapper estándar de pantallas con datos, pero no está. Cada pantalla maneja loading/error ad-hoc → inconsistencia y estados de error que dependen solo del toast global.
**Fix:** crear `QueryBoundary` + `ErrorState` + skeletons por feature y migrar las pantallas principales (feed, library, book, profile).
- [ ] Crear `QueryBoundary` + `ErrorState` y migrar pantallas

### UX-3 · i18n incompleto
**Problema:** i18n está cableado pero quedan strings hardcodeados (el roadmap lo admite). Los mensajes de `send-push` están fijos en español.
**Fix:** mover strings restantes a `locales/{es,en}.json`; si se soporta inglés en push, localizar según preferencia del usuario.
- [ ] Completar extracción de strings a i18n

---

## 🔵 P4 — Arquitectura, deuda técnica & performance

### A-1 · Docs y CLAUDE.md desactualizados / contradicen el código
**Problema:**
- `CLAUDE.md` dice *"being scaffolded from a bare Expo template"* y describe `src/lib/query-options.ts` que **no existe** (el patrón real son archivos `*.queries.ts` por feature — que está bien, pero el doc miente).
- `roadmap.md` marca **Sentry como "Listo"**, pero `@sentry/react-native` **ya no está en `package.json`** y no hay `Sentry.init()` en el código (ver O-1).
**Impacto:** cualquier dev (o agente) que confíe en los docs trabaja con información falsa.
**Fix:** actualizar CLAUDE.md (patrón `*.queries.ts`, estado real) y `roadmap.md`.
- [ ] Sincronizar CLAUDE.md y roadmap con la realidad

### O-1 · Sin crash reporting ni Error Boundary
**Problema:** no hay `@sentry/react-native` en deps, no hay `Sentry.init()`, y **no hay ningún `ErrorBoundary`** en el árbol. Hoy un error de render en cualquier pantalla tumba todo a pantalla en blanco **sin reporte**. PostHog sí está instalado pero no veo captura de errores.
**Fix:** añadir un `ErrorBoundary` raíz en `app/_layout.tsx` con UI de fallback + recableado de Sentry (o `posthog.captureException`).
- [ ] `ErrorBoundary` raíz con fallback
- [ ] Recablear crash reporting (Sentry o PostHog)

### P-1 · `invalidateQueries(["feed"])` en cada like → refetch completo del feed
**Archivo:** `useToggleActivityLike.ts:35`
**Problema:** cada like invalida **todo** el feed infinito → refetch de todas las páginas, posible jank de scroll y reordenamiento. (Se resuelve junto con D-1 usando `setQueryData` puntual sin invalidar.)
- [ ] Eliminar el invalidate global del feed en likes

### A-2 · Auth en web usa `localStorage` (tokens expuestos a XSS)
**Archivo:** `src/lib/supabase.ts:7`
**Problema:** en web los tokens van a `localStorage`, accesible por cualquier XSS. Aceptable si web es solo dev/preview, pero hay que decidirlo conscientemente.
**Fix:** documentar que web no es target de producción, o usar cookies httpOnly vía un backend.
- [ ] Decidir/documentar postura de auth en web

### A-3 · Deep links: verificar archivos de asociación publicados
**Archivo:** `app.json:18,27` (`applinks:lexareads.app`, intent filters a `lexareads.app`)
**Problema:** si `apple-app-site-association` y `assetlinks.json` no están publicados en el dominio, los universal links/app links **fallan en silencio**.
**Fix:** publicar y verificar ambos archivos antes del submit.
- [ ] Verificar `apple-app-site-association` y `assetlinks.json`

---

## Pendientes ya conocidos del roadmap (no perder de vista)

De `roadmap.md`, siguen `[ ]`:
- [ ] Escaneo ISBN con `expo-camera` (Fase F)
- [ ] Sugerencias de follow en onboarding (Fase F)
- [ ] PostHog: eventos clave + feature flags (Fase F)
- [ ] Smoke test en device real iOS+Android con build EAS (Fase A)
- [ ] App Store / Play: privacy labels, data safety, screenshots, build production, TestFlight/Internal (Fase G)
- [ ] E2E con Maestro: signup → search → add → review → like (Fase G)
- [ ] Test de carga del feed (1k seguidos × 50 actividades) (Fase G)

---

## Orden de ataque sugerido (quick wins primero)

| Orden | Item | Esfuerzo | Por qué primero |
|------:|------|:--------:|-----------------|
| ~~1~~ | ~~**S-1** secreto webhook~~ | XS | ✅ Resuelto (falta setear `WEBHOOK_SECRET`) |
| ~~2~~ | ~~**S-2** validar ISBN~~ | XS | ✅ Resuelto |
| ~~3~~ | ~~**S-3** moderación de `books`~~ | M | ✅ Resuelto vía migración 012 (falta aplicarla) |
| ~~–~~ | ~~**C-1** hard-delete real~~ | M | ✅ Resuelto vía migración 013 |
| ~~–~~ | ~~**C-2** reviews respetan privacidad~~ | S | ✅ Resuelto vía migración 014 |
| ~~–~~ | ~~**C-3** bloqueo bidireccional~~ | S | ✅ Resuelto vía migración 014 |
| ~~–~~ | ~~**C-4** moderación de reportes~~ | S | ✅ Resuelto vía migración 015 + runbook |
| 1 | **D-2** cursor compuesto | S | Corrige pérdida de datos en feed/comentarios |
| 2 | **O-1** ErrorBoundary + crash reporting | S | Visibilidad de errores en prod |
| 3 | **UX-1** accesibilidad | M | Bloqueante de App Store |
| 4 | **D-1 / P-1** optimistic sobre caché | M | Correctitud + performance |
| 5 | **UX-2** QueryBoundary + skeletons | M | Consistencia |
| 6 | resto (D-3, D-4, A-1..A-3, i18n) | — | Pulido y deuda |

> Regla: cada fix de RLS debe probarse contra una instancia real de Supabase (CLAUDE.md: no mockear `supabase`). Los tests de `src/__tests__/features/auth/rls.test.ts` son el lugar para añadir cobertura de C-2 y C-3.
</content>
</invoke>
