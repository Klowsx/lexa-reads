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

## 🔴 P0 — Seguridad

### S-1 · `send-push` no valida el origen del webhook
**Archivo:** `supabase/functions/send-push/index.ts`
**Problema:** la función confía ciegamente en `payload.record` (`recipient_id`, `actor_id`, `type`) sin verificar ningún secreto. Las Edge Functions son URLs públicas; quien descubra la URL puede `POST` un `record` arbitrario y **disparar push notifications a cualquier usuario suplantando a otro**. Además la migración 011 crea los triggers de `notifications` pero **el cableado del webhook (pg_net / Database Webhook) no está en el repo** → no es reproducible y nadie sabe si está activo.
**Fix:**
```ts
const SECRET = Deno.env.get("WEBHOOK_SECRET")!;
if (req.headers.get("x-webhook-secret") !== SECRET) {
  return new Response("Forbidden", { status: 403 });
}
```
Configurar el header secreto en el Database Webhook de Supabase. Documentar el webhook en una migración o en `docs/`.
- [ ] Validar secreto en `send-push`
- [ ] Versionar/documentar la config del webhook

### S-2 · Inyección en filtros PostgREST por ISBN
**Archivo:** `src/lib/google-books.ts:290`
**Problema:** `.or(\`isbn_10.eq.${isbn},isbn_13.eq.${isbn}\`)` interpola `isbn` crudo dentro del string de filtro de PostgREST. Si el valor (del scanner o de input manual) trae comas o caracteres especiales, rompe o manipula el filtro.
**Fix:** validar antes de la query:
```ts
if (!/^\d{10}(\d{3})?$/.test(isbn)) return null;
```
- [ ] Validar formato ISBN antes de `getBookByIsbn`

### S-3 · Catálogo `books` sin moderación (INSERT abierto)
**Archivo:** `supabase/migrations/001_initial_schema.sql:494`
**Problema:** `CREATE POLICY ... books FOR INSERT WITH CHECK (auth.role() = 'authenticated')`. Cualquier usuario autenticado puede insertar filas arbitrarias en el catálogo **compartido y global**. Como `books` no tiene política de UPDATE/DELETE, un usuario malicioso puede contaminar el catálogo con títulos basura/ofensivos que aparecen para **todos** y no se pueden corregir desde la app.
**Fix (opciones):**
- Insertar libros solo vía Edge Function/RPC `SECURITY DEFINER` que valide contra Google Books (no confiar en el cliente), **o**
- Restringir el INSERT a campos controlados y agregar un `reported`/moderación, **o**
- Mínimo: agregar política de UPDATE para administradores y un proceso de limpieza.
- [ ] Cerrar o validar el INSERT a `books`

---

## 🟠 P1 — Compliance & Privacidad

### C-1 · El "hard-delete" de cuentas no borra el contenido ni `auth.users`
**Archivo:** `supabase/migrations/010_compliance.sql`
**Problema:** el `pg_cron` a los 30 días solo **anonimiza la fila `users`** (deleted_at + scrub de display_name/bio/avatar/genres). **No toca**:
- `reviews.body`, `comments.body` (pueden contener datos personales / texto identificable),
- `user_books`, `lists`,
- **la fila `auth.users`** → el email queda retenido para siempre y la persona no puede re-registrarse.

Además **nunca marca `account_deletion_requests` como procesada**, así que el job reintenta cada noche, y el `EXISTS` sobre `users.deleted_at IS NULL` lo hace idempotente solo por casualidad. Para GDPR/CCPA "derecho al olvido" y para las tiendas, esto es insuficiente: lo prometido es *hard-delete*, esto es un *soft-anonymize del perfil*.
**Fix:** convertir el job en una Edge Function o función `SECURITY DEFINER` que:
1. Borre/anonimice `reviews`, `comments`, `user_books`, `lists` del usuario.
2. Llame a `auth.admin.deleteUser(id)` (cascada por el `ON DELETE CASCADE` de `users.id`).
3. Marque `account_deletion_requests.processed_at`.
- [ ] Borrar contenido del usuario en el hard-delete
- [ ] Eliminar la fila `auth.users` (liberar el email)
- [ ] Marcar la solicitud como procesada

### C-2 · Las reseñas ignoran `is_private` del autor
**Archivo:** `supabase/migrations/007_rls_fixes.sql:67`
**Problema:** la política SELECT de `reviews` chequea `is_published`, `deleted_at` y bloqueos, **pero no `users.is_private`**. Resultado: si pongo mi cuenta en privada, mi biblioteca (`user_books`) y mi feed (`activity_feed`) se ocultan, **pero mis reseñas siguen siendo públicas para todo el mundo**. Privacidad inconsistente y sorprendente para el usuario.
**Fix:** añadir al `USING` de reviews:
```sql
AND NOT EXISTS (
  SELECT 1 FROM users u WHERE u.id = reviews.user_id AND u.is_private = true
  -- (o permitir si auth.uid() sigue al autor con status='accepted')
)
```
Decidir el modelo: ¿privado = solo seguidores aceptados, o solo yo? Aplicarlo igual en `user_books`, `activity_feed` y `reviews`.
- [ ] Reseñas respetan `is_private`
- [ ] Definir y unificar el modelo de privacidad (privado = ¿seguidores o nadie?)

### C-3 · El bloqueo es unidireccional
**Archivos:** `007_rls_fixes.sql` (users / reviews / activity_feed)
**Problema:** todas las políticas chequean `blocker_id = <autor> AND blocked_id = auth.uid()` → es decir, *"si X me bloqueó, no veo a X"*. Falta el sentido inverso: **si yo bloqueo a X, debería dejar de ver a X también**. Hoy el que bloquea a un acosador sigue viendo el contenido del acosador. El estándar de la industria (y lo esperado por las tiendas para una herramienta de seguridad) es bloqueo **bidireccional**.
**Fix:** cambiar los subqueries a simétricos:
```sql
NOT EXISTS (
  SELECT 1 FROM user_blocks
  WHERE (blocker_id = <autor> AND blocked_id = auth.uid())
     OR (blocker_id = auth.uid() AND blocked_id = <autor>)
)
```
- [ ] Bloqueo bidireccional en `users`, `reviews`, `activity_feed` (y `comments` si aplica)

### C-4 · Falta panel/proceso para resolver reportes ≤24h
**Origen:** `roadmap.md` Fase D (sigue `[ ]`).
**Problema:** las tiendas exigen respuesta interna ≤24h a reportes de contenido. Existe la tabla `content_reports`/`reports` y el RLS, pero no hay panel ni proceso documentado.
**Fix:** mínimo, documentar el flujo en Supabase Studio (vista de reports sin resolver) y un runbook. Idealmente una vista admin.
- [ ] Documentar/implementar el proceso de moderación

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
| 1 | **S-1** secreto webhook | XS | Tapa abuso explotable en minutos |
| 2 | **S-2** validar ISBN | XS | 1 línea, cierra inyección |
| 3 | **D-2** cursor compuesto | S | Corrige pérdida de datos en feed/comentarios |
| 4 | **O-1** ErrorBoundary + crash reporting | S | Visibilidad de errores en prod |
| 5 | **C-3** bloqueo bidireccional | S | Seguridad de usuarios + tiendas |
| 6 | **C-2** reviews respetan privacidad | S | Privacidad consistente |
| 7 | **UX-1** accesibilidad | M | Bloqueante de App Store |
| 8 | **C-1** hard-delete real | M | Compliance GDPR/tiendas |
| 9 | **D-1 / P-1** optimistic sobre caché | M | Correctitud + performance |
| 10 | **S-3** moderación de `books` | M | Anti-abuso del catálogo |
| 11 | **UX-2** QueryBoundary + skeletons | M | Consistencia |
| 12 | resto (D-3, D-4, A-1..A-3, i18n) | — | Pulido y deuda |

> Regla: cada fix de RLS debe probarse contra una instancia real de Supabase (CLAUDE.md: no mockear `supabase`). Los tests de `src/__tests__/features/auth/rls.test.ts` son el lugar para añadir cobertura de C-2 y C-3.
</content>
</invoke>
