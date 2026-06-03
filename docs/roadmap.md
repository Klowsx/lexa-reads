# Roadmap — Lexa Reads

> Orden recomendado de trabajo desde el estado actual hasta MVP listo para submit.
> Cada bloque agrupa pantallas + features + DB que conviene cerrar juntas.
> Marca con `[x]` lo que vayas terminando.

Referencias: [STACK.md](./STACK.md) (canon producto/DB) · [gaps-produccion.md](./gaps-produccion.md) (pendientes infra) · [analisis.md](./analisis.md) (estado del schema).

---

## Estado actual (snapshot 2026-05-26)

**Listo**

- Scaffold completo: NativeWind, i18n, theme dark/light, Zustand stores (auth/ui/theme).
  - **Crash reporting:** Sentry fue retirado (no está en `package.json`). En su lugar hay un `ErrorBoundary` raíz + `src/lib/crash-reporting.ts` (`logError` → consola, con reporter PostHog enchufable vía `setCrashReporter`). Pendiente: inicializar PostHog y conectarlo.
- DB migrada (001–008): tablas MVP + RLS + triggers + bloqueos + reports + account_deletion_requests.
- Auth: login, register, forgot/new-password, verify-email, success + hooks (`useLogin`, `useRegister`, `useLogout`, `useResetPassword`).
- Onboarding: `genres`, `goal`, `username` (pantallas creadas).
- Tabs creadas: feed, search, library, profile + settings + book/[id].
- Búsqueda con Google Books real + trending NYT (`useSearchBook`, `useTrendingBooks`).
- Detalle de libro con `useBook` (consulta DB).
- Componentes UI base: Avatar, BookCover, StarRating, FeedCard, LibraryItem/Tabs, ProfileStats, ReadingGoal, RecentReads, BookCard, SearchBar, GenreChips, QuickPeekSheet, BookDetailSheet.

**Con mocks (hay que conectar a Supabase)**

- Feed (`FEED_INIT`), Library (`MY_BOOKS`), Profile (`ME`, `MOCK_LISTS`).
- Book detail: `status` y `rating` solo en useState — no persisten.

**Sin implementar todavía**

- Lists (rutas `list/[slug].tsx`, CRUD, list_books).
- Perfil de otros usuarios (`user/[username].tsx`).
- Follow/unfollow, búsqueda de usuarios.
- Comentarios, likes (review_likes, activity_likes, list_likes).
- Bloqueos / reports / borrado de cuenta (UI — DB lista).
- Notificaciones in-app + push opt-in contextual.
- Escaneo ISBN, share a redes, deep linking, PostHog, EAS build.

---

## Fase A — Cerrar infra antes de seguir features (1–2 días)

Tomado de `gaps-produccion.md`. Si no se hace ahora, bloquea testing real en device y submit.

- [x] **0.3** Completar `app.json`: `ios.bundleIdentifier`, `android.package`, `scheme: "lexa"`, `extra.eas.projectId`.
- [x] **0.4** Crear `eas.json` con perfiles development / preview / production.
- [x] **0.9** Crear `src/features/*/queries.ts` (factory `queryOptions` por feature) — antes de seguir refactorizar hooks.
- [x] Validar `google-books.ts` cumple DB-first (busca en `books` por `google_books_id` → si no existe inserta) — auditar y ajustar.
- [ ] Smoke test en device real (iOS + Android) con build dev de EAS.

---

## Fase B — Tracking real del libro (la feature core)

Hoy todo el flujo de "yo lectora marca un libro" vive en mocks. Es el bloque que convierte la app en producto.

### B1. Persistencia de `user_books` desde el detalle de libro

- [x] Hook `useUserBook(bookId)` — lee `user_books` del usuario actual.
- [x] Mutación `useUpsertUserBook` — status/rating/started_at/finished_at/tags con **optimistic update + rollback**.
- [x] Mutación `useDeleteUserBook` — quitar de biblioteca.
- [x] Conectar `app/book/[id].tsx`: reemplazar `useState` por hook+mutación; medias estrellas (0.5–5.0).
- [x] Si el libro viene de Google Books y no existe en `books`, insertarlo vía `google-books.ts` antes de crear `user_books`.

### B2. Biblioteca real

- [x] Hook `useLibrary(status)` — `user_books` filtrados por estado para el user actual con JOIN a `books`.
- [x] Reemplazar `MY_BOOKS` mock en `app/(tabs)/library.tsx`.
- [x] Contadores por estado calculados en SQL (un solo round trip).
- [x] Tags/shelves: chip de filtro por tag dentro de cada estado.
- [x] Estado vacío con CTA a búsqueda.

### B3. Reseñas

- [x] Pantalla `app/review/new.tsx` (modal) — formulario con `react-hook-form` + `zod` (body, contains_spoilers).
- [x] Hook `useUpsertReview` + `useDeleteReview` (soft delete) + `useMyReview` + `useBookReviews`.
- [x] CTA "Escribir reseña" del detalle del libro abre el modal y crea/edita.
- [x] Lista de reseñas en `book/[id].tsx`: hook `useBookReviews(bookId)` con `useInfiniteQuery` y cursor `(created_at, id)`.

### B4. Reading goal real

- [x] Hook `useReadingGoal()` — lee `users.reading_goal` y cuenta `books_read` del año en curso.
- [x] Mutación para editar el goal desde settings/perfil.
- [x] Reemplazar mock en `ProfileScreen`.

---

## Fase C — Capa social

Sin social, Lexa es Goodreads chico. Este es el diferenciador.

### C1. Perfil propio + perfil ajeno

- [x] Hook `useProfile(username)` — incluye `is_blocked_by_me`, `is_following`.
- [x] Pantalla `app/user/[username].tsx` con header, stats, recent reads, listas públicas, botón follow.
- [x] `app/(tabs)/profile.tsx`: usar `useMe()` en lugar de mocks; CurrentlyReading y RecentReads con `useLibrary`.
- [x] `app/edit-profile.tsx` — editar display_name, bio, favorite_genres, is_private; conectado a `useUpdateProfile`.

### C2. Follows

- [x] Hooks `useFollow`, `useUnfollow` con optimistic update sobre `followers_count` / `following_count`.
- [x] Pantalla `app/followers.tsx` — listas paginadas de seguidores/siguiendo con infinite scroll y botón follow por fila.
- [x] Soporte `status: pending` para cuentas privadas: botón "Solicitud enviada" + cancelar. Solicitudes entrantes aparecen destacadas al tope de Notificaciones con `FollowRequestsSection` (aceptar/rechazar con optimistic update).

### C3. Búsqueda de usuarios

- [x] Tab "Usuarios" en `search.tsx` — segmented control animado (Todo / Libros / Usuarios).
- [x] Hook `useSearchUsers(q)` — query Supabase con `.or(username.ilike / display_name.ilike)`; sin query devuelve top 5 sugeridos por `followers_count`.
- [x] `UserCard` migrado de `MockFullUser` a `SearchUser` real; botón Seguir conectado a `useFollow`.

### C4. Feed real

- [x] Hook `useFeed()` con `useInfiniteQuery`, cursor `(created_at, id)`, lee `activity_feed` filtrado por RLS (sigues/no-bloqueados).
- [x] Reemplazar `FEED_INIT` mock.
- [x] Verificar que las mutaciones de B1/B3 emitan filas en `activity_feed` (probablemente vía trigger o desde la mutación).
- [x] Empty state: si el usuario sigue a 0 personas → CTA "sugerencias de follow".

### C5. Likes

- [x] `useToggleActivityLike` con optimistic update sobre `activity_likes` + `activity_feed.likes_count`.
- [x] `useToggleReviewLike` análogo sobre `review_likes` + `reviews.likes_count`.
- [x] Wireado del botón corazón en `FeedCard` y en cards de reseña.

### C6. Comentarios (motor de retención del feed)

- [x] Pantalla `app/comments/[id].tsx` para `target_type ∈ {review, activity}` — acepta param `type`.
- [x] Hooks `useComments`, `useCreateComment`, `useDeleteComment`.
- [x] Botón "comentar" en FeedCard y review card navega a la pantalla.
- [x] Soft delete propio + mostrar "comentario eliminado".

### C7. Listas

- [x] `app/list/new.tsx` — crear lista (name, description, visibility, slug auto).
- [x] `app/list/[slug].tsx` — ver lista con `list_books` reordenables (drag con Reanimated/Gesture Handler).
- [x] Hooks `useList(slug)`, `useAddBookToList`, `useRemoveBookFromList`, `useReorderListBooks`, `useToggleListLike`.
- [x] En `book/[id].tsx`: botón "agregar a lista" → bottom-sheet con mis listas + opción "crear nueva".
- [x] En perfil: ya hay `ProfileLists` mock — conectar a `useUserLists(userId)`.

---

## Fase D — Compliance (bloqueante de stores)

Sin esto NO se puede subir a App Store / Play Store. Hacer **antes** de pulir UI.

- [x] **Bloqueo de usuarios**: acción en `user/[username].tsx` (menú "..."), hooks `useBlockUser` / `useUnblockUser`, listado en settings.
- [x] **Reportar contenido**: bottom-sheet de "reportar" en review, comment, user, list, activity (reason picker + details). Hook `useCreateReport`.
- [ ] **Panel interno** (mínimo Supabase Studio o vista admin) para resolver reports ≤24h — documentar el proceso.
- [x] **Borrado de cuenta**:
  - Edge Function `delete-account` → crea fila en `account_deletion_requests` + cierra sesiones.
  - UI inline en `app/settings.tsx` con confirmación + cancelación.
  - `pg_cron` job que ejecuta hard-delete + anonimización a los 30 días (`migrations/010_compliance.sql`).
- [x] **Export de datos**: Edge Function `export-user-data` → JSON de user_books, reviews, lists, comments. Botón en settings (Share nativo).
- [x] **Política de privacidad** pública (URL accesible) + link desde register y settings.
- [x] **Consentimiento granular**: modal en primer login para push/email, persistido en `notification_preferences.consent_given_at` (migración 010).

---

## Fase E — Notificaciones

- [x] Pantalla `app/(tabs)/notifications.tsx` (o stack desde campana del feed) — lee tabla `notifications`.
- [x] Hook `useNotifications` con `useInfiniteQuery` + marcar como leídas en bulk.
- [x] Push opt-in **contextual** (después de la primera actividad social, NO en primer launch) — `expo-notifications`.
- [x] Edge Function `send-push` disparada por triggers de DB en eventos (new_follower, review_like, comment_received, activity_like).
- [x] Pantalla `app/settings-notifications.tsx` para editar `notification_preferences`.

---

## Fase F — Adquisición y polish

- [ ] **Escaneo ISBN** con `expo-camera` (incluye barcode scanning en SDK 54) — botón en SearchBar.
- [x] **Compartir a redes**: capturar card del libro/reseña como imagen (`react-native-view-shot`) + `expo-sharing`. Botón en review y book detail.
- [x] **Deep linking** (universal links + scheme `lexa://`): rutas para `book/[id]`, `user/[username]`, `list/[slug]`.
- [ ] **Sugerencias de follow** en onboarding (último step) — query a usuarios con más seguidos en común o más activos, requerir ≥5 follows para continuar.
- [ ] **Crash reporting (sin Sentry)**: inicializar PostHog y conectarlo con `setCrashReporter` en `src/lib/crash-reporting.ts`. El `ErrorBoundary` raíz ya está.
- [ ] **PostHog**: feature flags + eventos clave (signup, first_book_added, first_review, follow, like, comment).
- [x] **Skeletons consistentes**: `<QueryBoundary>` + `ErrorState` + `Skeleton` creados; feed migrado. Pendiente: migrar el resto de pantallas (library, book, profile).
- [ ] **i18n**: pasar TODOS los strings hardcoded a `src/locales/{es,en}.json`.

---

## Fase G — Pre-submit

- [ ] App Store Connect: privacy nutrition labels.
- [ ] Play Console: data safety form.
- [ ] Iconos + splash en todas las resoluciones.
- [ ] Screenshots tienda (5–8 por idioma).
- [ ] Build production EAS + TestFlight + Internal Testing Play.
- [ ] Tests E2E críticos con Maestro: signup → search → add to library → review → like en feed.
- [ ] Test de carga del feed con dataset realista (1k seguidos × 50 actividades).

---

## Orden corto (TL;DR)

1. **A** — Infra (`app.json`, `eas.json`, `query-options.ts`).
2. **B** — Tracking real (`user_books`, biblioteca, reseñas, goal).
3. **C** — Social (perfil ajeno → follows → búsqueda usuarios → feed real → likes → comentarios → listas).
4. **D** — Compliance (bloqueo, reports, delete account, export, privacidad, consentimiento).
5. **E** — Notificaciones (in-app + push opt-in contextual).
6. **F** — Polish (ISBN, share, deep links, sugerencias, analytics, i18n completo).
7. **G** — Submit (assets de tienda, builds, E2E).

Regla: no avanzar a la siguiente fase con bloques de la anterior en mock. Cada hook nuevo respeta `queryOptions` factory + optimistic update donde aplique (B1, C2, C5).
