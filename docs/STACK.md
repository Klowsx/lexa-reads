# Lexa Reads

> App móvil de tracking social de libros — Letterboxd para libros, mobile-first, hispanohablante.
> Este es el **documento único de referencia** del proyecto: producto, fases, stack, esquema y arquitectura.

---

## 1. Producto

### Contexto y mercado

- **Competidor principal:** Goodreads (150M usuarios, abandonado por Amazon, diseño de 2006)
- **Alternativa moderna:** StoryGraph (4M usuarios, buenas stats, débil socialmente)
- **Hueco real:** Letterboxd de libros — feed social activo, bien diseñado, mobile-first
- **Audiencia inicial:** lectores hispanohablantes (mercado desatendido por Goodreads/StoryGraph)

### Diferenciadores

- Feed social primero (no biblioteca primero, como Goodreads)
- Medias estrellas (queja #1 sobre Goodreads, fácil de implementar)
- Mobile-first y bien diseñado
- Sin Amazon, sin ads

---

## 2. Fase 1 — MVP

> Objetivo: 200–500 primeros usuarios que ya se conocen entre sí. ~3 meses.

### Búsqueda de libros

- Texto: título / autor / ISBN con fuzzy matching (`pg_trgm`)
- **Escaneo ISBN por cámara** (`expo-camera` + `expo-barcode-scanner`)
- Resultados con portada + metadatos (Google Books → fallback Open Library)
- Página de detalle del libro con reseñas, ratings y comentarios de otros

### Tracking

- Estados: `reading`, `read`, `want_to_read`, `abandoned`
- Rating con **medias estrellas** (0.5–5.0 en pasos de 0.5)
- Fechas de inicio y fin
- Reseña libre con flag `contains_spoilers`
- **Tags / shelves personalizados** (fantasy, dnf, read-in-2026, etc.) — clave para refugiados de Goodreads
- **Reading goal anual** (movido desde Fase 2 — 1 día de trabajo, dispara retención)

### Perfil

- Avatar, username, bio, contadores (libros, reseñas, seguidores, seguidos)
- Libros leídos recientemente, listas, progreso del goal anual

### Feed social

- Actividad de los que sigues
- Seguir / dejar de seguir
- **Búsqueda de usuarios** por username / display name
- Eventos: terminó libro + rating, empezó libro, escribió reseña, agregó a lista, abandonó
- Likes en actividades
- **Comentarios** (mínimo 1 nivel) en reseñas y actividades — motor real de retención
- **Compartir a redes** (story de Instagram con portada + rating) — canal de adquisición orgánica

### Listas

- Nombre, descripción, visibilidad pública/privada
- Agregar/quitar libros, reordenar
- Compartir por link (slug único, case-insensitive)
- **Deep linking** (universal links + custom scheme)

### Auth y onboarding

- Email/contraseña + Google OAuth (Supabase Auth)
- **Onboarding con sugerencias de follow** (importar contactos opcional, "sigue ≥5 para continuar")
- **i18n desde el día 1** (ES + EN con `expo-localization` + `i18next`)

### Compliance (bloqueante para stores)

> App Store / Play Store rechazan la app si falta cualquiera de estos.

- **Reporte de contenido** (reseñas, comentarios, usuarios) + acción interna ≤24h — App Store 1.2, Play UGC
- **Bloqueo de usuarios** con RLS que excluye al bloqueado del feed
- **Borrado de cuenta in-app** con anonimización diferida 30 días — Apple lo exige desde 2022
- **Política de privacidad** + consentimiento granular (GDPR/RGPD/LGPD/LFPDPPP) + export de datos
- **Push opt-in contextual** (no al primer launch)
- **Sentry** + **PostHog** (analytics privacy-friendly, detrás de consentimiento)

---

## 3. Fase 2 — Cuando haya usuarios reales

> Solo construir con feedback real, no por adelantado.

- **Importar de Goodreads** (CSV → estados + tags + ratings + reseñas) — **primera prioridad**, principal canal de adquisición
- **Wrap-up anual + stats** (libros, páginas, géneros, racha) — growth loop viral cerca de fin de año
- **Notificaciones push** con preferencias granulares
- **Retos de lectura** (anual, temáticos, insignias, progreso de amigos)
- **Recomendaciones directas entre amigos** (con nota personalizada)
- **Progreso de lectura y diario (`book_logs`)** — soporte completo de relecturas con rating/review por log (estilo diario Letterboxd), notas y citas, sesiones de lectura

---

## 4. Fase 3 — Con tracción real

- **Clubes de lectura** (públicos/privados, libro del mes, discusión por capítulo)
- **Recomendaciones con IA** (afinidad, mood, pace, trigger warnings)
- **Buddy reads + DMs** (sin DMs los buddy reads no escalan fuera del club)
- **Quotes públicas con imagen** estilo Litsy — viral en TikTok / IG
- **Versión web** (Expo Router web — SEO de páginas de libros = adquisición gratis)
- **Modo offline** (cache local, sync al reconectar)

### Decisiones de producto cerradas

- Medias estrellas y reading goal **en MVP**, no Fase 2
- Comentarios anidados **en MVP** (sin esto el feed es estéril)
- Import de Goodreads = **primera feature de Fase 2**, no última
- Clubes de lectura **Fase 3** — sin masa crítica son pantallas vacías
- Sin ads. Monetización futura: freemium (stats avanzadas, temas)
- MVP soporta solo "estado actual" del libro (1 fila por user+book). Diario completo con múltiples logs llega en Fase 2 (`book_logs`).

---

## 5. Stack técnico

| Capa            | Tecnología                                       | Razón                                            |
| --------------- | ------------------------------------------------ | ------------------------------------------------ |
| Móvil           | React Native + Expo (SDK 54)                     | Universal, OTA via EAS Update                    |
| Routing         | Expo Router (`experiments.typedRoutes: true`)    | File-based, navegación tipada                    |
| Lenguaje        | TypeScript strict                                |                                                  |
| Estilos         | NativeWind (Tailwind para RN)                    |                                                  |
| Backend         | **Supabase-first**                               | Auth + Postgres + Realtime + Storage + Edge Fns  |
| Edge Functions  | Solo cuando RLS/triggers no alcanzan             | Import Goodreads, hard-delete diferido, webhooks |
| Base de datos   | PostgreSQL via Supabase (`pg_trgm`, `citext`)    |                                                  |
| Auth tokens     | `expo-secure-store`                              | No usar AsyncStorage para tokens                 |
| Server state    | TanStack Query v5 con `queryOptions` factory     | Cache, infinite query, optimistic updates        |
| Client state    | Zustand mínimo (auth + toasts)                   | El resto es server state                         |
| Listas grandes  | `@shopify/flash-list`                            | FlatList no escala en feeds                      |
| Imágenes        | `expo-image` (blurhash + cache)                  | FastImage deprecated en RN 0.81                  |
| Forms           | `react-hook-form` + `zod`                        | Esquemas zod compartidos con Edge Functions      |
| Animaciones     | `react-native-reanimated` v4 + Gesture Handler   | Microinteracciones del feed                      |
| Storage rápido  | `react-native-mmkv` (si hace falta persist)      | 10× más rápido que AsyncStorage                  |
| i18n            | `expo-localization` + `i18next` (ES + EN en MVP) |                                                  |
| API libros      | Google Books (primary) + Open Library (fallback) |                                                  |
| Crash reporting | `@sentry/react-native`                           | Mandatorio en producción                         |
| Analytics       | PostHog RN (con consentimiento) + feature flags  |                                                  |
| Build / Submit  | EAS Build + EAS Update + EAS Submit              |                                                  |
| E2E testing     | Maestro                                          | Más simple y mantenido que Detox                 |
| Unit testing    | Jest + RNTL + tests de RLS contra BD real        | No mockear Supabase                              |

### Comandos

Desde `app/`:

```bash
pnpm start         # Expo dev server
pnpm android       # Android emulator/device
pnpm ios           # iOS simulator/device
pnpm web           # Browser

# Regenerar tipos de Supabase al cambiar el schema
supabase gen types typescript --project-id <id> > src/types/database.ts
```

---

## 6. Arquitectura del cliente

### Estructura de carpetas

```
app/                              # Raíz Expo
├── app/                          # Expo Router — solo rutas/pantallas, sin lógica
│   ├── _layout.tsx               # Root layout: providers, auth gate
│   ├── (auth)/                   # login, register, onboarding
│   ├── (tabs)/                   # feed, search, library, profile
│   ├── book/[id].tsx
│   ├── user/[username].tsx
│   ├── list/[slug].tsx
│   ├── settings.tsx
│   └── +not-found.tsx
│
├── src/
│   ├── features/                 # Agrupar por feature, no por tipo
│   │   ├── feed/   {hooks, components}
│   │   ├── library/
│   │   ├── book/
│   │   ├── auth/
│   │   ├── lists/
│   │   └── user/
│   ├── components/ui/            # Átomos: Button, Input, Skeleton, Toast,
│   │                             # QueryBoundary, ErrorState, EmptyState
│   ├── stores/                   # Zustand mínimo
│   │   ├── auth.store.ts         # Proyección de onAuthStateChange
│   │   └── ui.store.ts           # Toast queue
│   ├── lib/
│   │   ├── supabase.ts           # createClient con expo-secure-store
│   │   ├── query-client.ts       # QueryClient con onError → toasts
│   │   ├── google-books.ts       # Wrapper: cache DB primero, luego API
│   │   ├── query-options.ts      # queryOptions factory (TanStack v5)
│   │   └── utils.ts
│   ├── types/
│   │   ├── database.ts           # supabase gen types
│   │   ├── errors.ts             # AppError unificado
│   │   └── index.ts              # Book, FeedItem, UserProfile…
│   └── constants/theme.ts
│
├── assets/
├── tailwind.config.js
├── app.json
├── package.json
└── tsconfig.json
```

### Reglas duras

1. **`app/` solo contiene rutas.** Toda la lógica vive en `src/`. Pantallas importan de `src/`, nunca al revés.
2. **Datos del servidor:** Screen → hook de `src/features/*/hooks/` (TanStack Query) → `src/lib/supabase.ts` → DB.
3. **Estado de UI:** Screen → Zustand store. Zustand para _ephemeral_, no para server state.
4. **`google-books.ts` siempre busca primero en la tabla `books`** por `google_books_id`. Si no existe: API → guardar en `books` → retornar. Pantallas nunca llaman la API directo.
5. **`queryOptions` factory** (no keys-as-functions sueltas):

   ```ts
   // src/lib/query-options.ts
   import { queryOptions } from '@tanstack/react-query'
   export const feedQueryOptions = (cursor?: string) =>
     queryOptions({
       queryKey: ['feed', cursor],
       queryFn: () => fetchFeed(cursor)
     })
   ```

6. **Feed con `useInfiniteQuery`** y cursor estable (`created_at + id`), no `offset`.
7. **`focusManager.setFocused` integrado con `AppState`** en `_layout.tsx`:

   ```tsx
   useEffect(() => {
     const sub = AppState.addEventListener('change', (s) => {
       if (Platform.OS !== 'web') focusManager.setFocused(s === 'active')
     })
     return () => sub.remove()
   }, [])
   ```

8. **Mutaciones con optimistic update + rollback** (`onMutate` snapshot, `onError` revert, `onSettled` invalidate) para likes y status changes.
9. **`auth.store`** es proyección de `supabase.auth.onAuthStateChange`. La verdad vive en Supabase; el store es solo cache.
10. **No `try/catch` en pantallas.** `QueryClient` global dispara toasts vía `onError`.

### `QueryBoundary` (patrón estándar)

```tsx
<QueryBoundary query={feedQuery} skeleton={<FeedSkeleton />}>
  {(data) => <FeedList items={data} />}
</QueryBoundary>
```

### Errores

`src/types/errors.ts` define `AppError` unificado (Supabase, API, red). Los hooks lo producen; los componentes lo consumen sin saber el origen.

---

## 7. Base de datos

> PostgreSQL via Supabase. UUID PK con `gen_random_uuid()` en todas las tablas.
> RLS habilitado en todas. Políticas como **SQL en la migración**, no como prosa.

### Convenciones

- PKs: `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`
- Timestamps: `created_at`, `updated_at` (trigger `handle_updated_at`)
- Soft delete: `deleted_at timestamptz` solo en tablas con contenido público (`users`, `reviews`)
- Contadores desnormalizados mantenidos por triggers — **nunca actualizar a mano**
- Username y slugs case-insensitive (`citext`)

### Extensiones

```sql
create extension if not exists pg_trgm;
create extension if not exists citext;
create extension if not exists moddatetime;
```

### Tablas Fase 1

#### `users`

Extiende `auth.users`. Trigger `on_auth_user_created` auto-crea fila al signup con `username = 'user_' || id` (placeholder hasta el onboarding).

```sql
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext unique not null,
  display_name varchar(60) not null,
  avatar_url text,
  bio varchar(200),
  favorite_genres text[] default '{}',
  onboarding_completed boolean default false,
  is_private boolean default false,                  -- 🔮 cuentas privadas
  reading_goal int,                                  -- meta anual MVP
  reading_goal_year int,
  books_read_count int default 0,
  reviews_count int default 0,
  followers_count int default 0,
  following_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
```

#### `follows`

```sql
create type follow_status as enum ('pending', 'accepted');

create table follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid not null references users(id) on delete cascade,
  following_id uuid not null references users(id) on delete cascade,
  status follow_status default 'accepted',
  accepted_at timestamptz,
  created_at timestamptz default now(),
  unique(follower_id, following_id),
  check (follower_id <> following_id)
);

create index idx_follows_follower on follows(follower_id) include (following_id);
create index idx_follows_following on follows(following_id);
```

#### `books`

Cache local de Google Books / Open Library. Búsqueda con `pg_trgm`.

```sql
create table books (
  id uuid default gen_random_uuid() primary key,
  google_books_id varchar(20) unique not null,
  open_library_id varchar(30),
  title varchar(500) not null,
  authors text[] default '{}',
  cover_url text,
  isbn_10 varchar(10),
  isbn_13 varchar(13),
  description text,
  page_count int,
  genres text[] default '{}',
  language char(2),                                  -- ISO-639-1
  published_date date,
  published_year int,                                -- libros con solo año
  publisher varchar(200),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_books_isbn13 on books(isbn_13);
create index idx_books_title_trgm on books using gin (title gin_trgm_ops);
create index idx_books_authors_trgm on books using gin (array_to_string(authors,' ') gin_trgm_ops);
```

#### `user_books`

Estado actual del libro para el usuario. **No soporta relecturas en MVP** (Fase 2: `book_logs`).

```sql
create type user_book_status as enum ('reading', 'read', 'want_to_read', 'abandoned');

create table user_books (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references users(id) on delete cascade,
  book_id uuid not null references books(id),
  status user_book_status not null,
  rating numeric(2,1) check (rating >= 0.5 and rating <= 5.0 and (rating * 2) = floor(rating * 2)),
  started_at date,
  finished_at date,
  current_page int,                                  -- 🔮 Fase 2 (progreso)
  tags text[] default '{}',                          -- shelves personalizados MVP
  goodreads_id varchar(50),                          -- 🔮 Fase 2 (import)
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, book_id)
);

create index idx_user_books_user on user_books(user_id, status);
create index idx_user_books_book on user_books(book_id);
create index idx_user_books_tags on user_books using gin (tags);
```

#### `reviews`

```sql
create table reviews (
  id uuid default gen_random_uuid() primary key,
  user_book_id uuid not null references user_books(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  book_id uuid not null references books(id),       -- denormalizado para filtros rápidos
  body text not null,
  contains_spoilers boolean default false,
  likes_count int default 0,
  comments_count int default 0,
  is_published boolean default true,                 -- 🔮 borradores
  edited_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create index idx_reviews_user on reviews(user_id) where deleted_at is null;
create index idx_reviews_book on reviews(book_id) where deleted_at is null;
```

#### `lists` y `list_books`

```sql
create type list_visibility as enum ('public', 'private');

create table lists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references users(id) on delete cascade,
  name varchar(100) not null,
  description text,
  visibility list_visibility default 'public',
  slug citext unique not null,
  books_count int default 0,
  likes_count int default 0,                         -- 🔮
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_lists_user on lists(user_id);

create table list_books (
  id uuid default gen_random_uuid() primary key,
  list_id uuid not null references lists(id) on delete cascade,
  book_id uuid not null references books(id),
  position int not null default 0,
  note text,                                          -- 🔮
  added_at timestamptz default now(),
  unique(list_id, book_id)
);

create index idx_list_books_list on list_books(list_id, position);
```

#### `activity_feed`

Tabla desnormalizada para el feed. **Estrategia MVP: fan-in con índices optimizados** (usuarios siguen <500 personas típicamente). Si en producción el feed se degrada, migrar a fan-out (`feed_items(recipient_id, activity_id, created_at)`).

```sql
create type activity_type as enum (
  'finished_book', 'started_book', 'wrote_review',
  'added_to_list', 'want_to_read', 'abandoned_book'
);

create table activity_feed (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references users(id) on delete cascade,
  activity_type activity_type not null,
  book_id uuid references books(id),
  review_id uuid references reviews(id) on delete set null,
  list_id uuid references lists(id) on delete set null,
  club_id uuid,                                       -- 🔮 Fase 3
  metadata jsonb default '{}',
  likes_count int default 0,
  comments_count int default 0,
  created_at timestamptz default now()
);

create index idx_activity_user_time on activity_feed(user_id, created_at desc);
create index idx_activity_time on activity_feed(created_at desc);
```

> **Retención:** evaluar partición por mes o purga > 90 días para usuarios inactivos cuando la tabla supere ~10M filas.

#### `activity_likes`

```sql
create table activity_likes (
  id uuid default gen_random_uuid() primary key,
  activity_id uuid not null references activity_feed(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(activity_id, user_id)
);
```

#### `comments` — hilos en reseñas y actividad

```sql
create type comment_target_type as enum ('review', 'activity');

create table comments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references users(id) on delete cascade,
  target_type comment_target_type not null,
  target_id uuid not null,
  parent_id uuid references comments(id) on delete cascade,
  body text not null,
  edited_at timestamptz,
  created_at timestamptz default now(),
  deleted_at timestamptz
);

create index idx_comments_target on comments(target_type, target_id, created_at);
create index idx_comments_parent on comments(parent_id);
```

#### `user_blocks` — bloqueante de stores

```sql
create table user_blocks (
  id uuid default gen_random_uuid() primary key,
  blocker_id uuid not null references users(id) on delete cascade,
  blocked_id uuid not null references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index idx_user_blocks_blocker on user_blocks(blocker_id);
create index idx_user_blocks_blocked on user_blocks(blocked_id);
```

#### `reports` — bloqueante de stores

```sql
create type report_target_type as enum ('review', 'comment', 'user', 'list', 'activity');
create type report_status as enum ('pending', 'reviewing', 'resolved', 'dismissed');

create table reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid not null references users(id) on delete cascade,
  target_type report_target_type not null,
  target_id uuid not null,
  reason varchar(50) not null,                        -- 'spam','hate','violence',...
  details text,
  status report_status default 'pending',
  resolved_at timestamptz,
  created_at timestamptz default now()
);

create index idx_reports_status on reports(status, created_at);
```

#### `notification_preferences`

```sql
create table notification_preferences (
  user_id uuid primary key references users(id) on delete cascade,
  push_new_follower boolean default true,
  push_activity_like boolean default true,
  push_review_like boolean default true,
  push_comment boolean default true,
  push_recommendation boolean default true,
  email_weekly_digest boolean default false,
  updated_at timestamptz default now()
);
```

### Tablas de fases futuras (crear vacías desde el inicio)

```sql
-- Fase 2
create type notification_type as enum (
  'new_follower','review_like','activity_like','comment_received',
  'reading_challenge_completed','recommendation_received',
  'buddy_read_invite','club_invite'
);

create table notifications (
  id uuid default gen_random_uuid() primary key,
  recipient_id uuid not null references users(id) on delete cascade,
  actor_id uuid references users(id) on delete set null,
  type notification_type not null,
  reference_id uuid,
  reference_type varchar(50),
  read_at timestamptz,
  created_at timestamptz default now()
);
create index idx_notifications_recipient on notifications(recipient_id, read_at);

-- Fase 2: diario con relecturas
create table book_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references users(id) on delete cascade,
  book_id uuid not null references books(id),
  started_at date,
  finished_at date,
  rating numeric(2,1) check (rating >= 0.5 and rating <= 5.0 and (rating * 2) = floor(rating * 2)),
  review_id uuid references reviews(id) on delete set null,
  is_reread boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_book_logs_user on book_logs(user_id, finished_at desc);

create table book_recommendations (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid not null references users(id) on delete cascade,
  recipient_id uuid not null references users(id) on delete cascade,
  book_id uuid not null references books(id),
  note text,
  seen_at timestamptz,
  created_at timestamptz default now()
);

create table reading_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references users(id) on delete cascade,
  user_book_id uuid not null references user_books(id) on delete cascade,
  pages_read int not null default 0,
  started_at timestamptz,
  ended_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

create type book_note_type as enum ('note','quote');

create table book_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references users(id) on delete cascade,
  user_book_id uuid not null references user_books(id) on delete cascade,
  content text not null,
  page_number int,
  type book_note_type default 'note',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Fase 3
create table reading_clubs (
  id uuid default gen_random_uuid() primary key,
  name varchar(100) not null,
  description text,
  created_by uuid not null references users(id),
  visibility list_visibility default 'public',
  current_book_id uuid references books(id),
  members_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create type buddy_read_status as enum ('pending','active','completed','declined');

create table buddy_reads (
  id uuid default gen_random_uuid() primary key,
  book_id uuid not null references books(id),
  initiator_id uuid not null references users(id) on delete cascade,
  partner_id uuid not null references users(id) on delete cascade,
  status buddy_read_status default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Funciones y triggers

```sql
-- updated_at automático
create or replace function handle_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Auto-crear users al signup
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into users (id, username, display_name)
  values (new.id, 'user_' || new.id::text, coalesce(new.raw_user_meta_data->>'name', 'Lector'));
  insert into notification_preferences (user_id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();
```

Triggers de contadores (`followers_count`, `books_read_count`, `likes_count`, `comments_count`) en migración aparte — AFTER INSERT/DELETE con `update ... set counter = counter ± 1`.

### Row Level Security (políticas en SQL, no en prosa)

`alter table <t> enable row level security` en todas. Patrón:

```sql
-- users
create policy "read public profiles" on users for select
  using (deleted_at is null and not exists (
    select 1 from user_blocks
    where blocker_id = users.id and blocked_id = auth.uid()
  ));

create policy "update own profile" on users for update
  using (id = auth.uid());

-- user_books
create policy "read user_books of visible users" on user_books for select
  using (exists (
    select 1 from users u
    where u.id = user_books.user_id
      and u.deleted_at is null
      and not exists (
        select 1 from user_blocks
        where blocker_id = u.id and blocked_id = auth.uid()
      )
  ));

create policy "manage own user_books" on user_books for all
  using (user_id = auth.uid());

-- reviews
create policy "read published non-blocked reviews" on reviews for select
  using (
    is_published and deleted_at is null
    and not exists (
      select 1 from user_blocks
      where blocker_id = reviews.user_id and blocked_id = auth.uid()
    )
  );

create policy "manage own reviews" on reviews for all using (user_id = auth.uid());

-- activity_feed
create policy "read activity from followed or public, non-blocked" on activity_feed for select
  using (
    not exists (
      select 1 from user_blocks
      where blocker_id = activity_feed.user_id and blocked_id = auth.uid()
    )
    and (
      user_id = auth.uid()
      or exists (
        select 1 from follows
        where follower_id = auth.uid()
          and following_id = activity_feed.user_id
          and status = 'accepted'
      )
    )
  );

-- user_blocks
create policy "manage own blocks" on user_blocks for all using (blocker_id = auth.uid());

-- reports
create policy "create own reports" on reports for insert with check (reporter_id = auth.uid());
create policy "read own reports" on reports for select using (reporter_id = auth.uid());
```

> Mismo patrón para `lists` (filtrar por `visibility`), `list_books`, `comments`, `activity_likes`, `follows`, `notification_preferences`.

### Borrado de cuenta (compliance)

Edge Function `delete-account`:

1. Marca `users.deleted_at = now()` (soft delete inmediato — el usuario desaparece de feeds via RLS).
2. Job programado (`pg_cron`) ejecuta hard-delete a 30 días: anonimiza `username = 'deleted_<n>'`, `display_name = 'Usuario eliminado'`, borra avatar, mantiene FK para no romper hilos.

### Orden de migración

1. Extensiones (`pg_trgm`, `citext`, `moddatetime`)
2. Funciones (`handle_updated_at`, `handle_new_user`)
3. `users` → `books`
4. `follows` → `user_books` → `reviews`
5. `lists` → `list_books`
6. `activity_feed` → `activity_likes` → `comments`
7. `user_blocks` → `reports` → `notification_preferences`
8. Tablas Fase 2/3 vacías: `notifications`, `book_logs`, `book_recommendations`, `reading_sessions`, `book_notes`, `reading_clubs`, `buddy_reads`
9. Triggers de contadores y `updated_at`
10. Políticas RLS

---

## 8. Checklist de readiness para App Store / Play Store

- [ ] Reporte de contenido in-app con ack ≤24h
- [ ] Bloqueo de usuarios + RLS
- [ ] Borrado de cuenta in-app con anonimización a 30 días
- [ ] Política de privacidad pública (URL accesible)
- [ ] Consentimiento granular de analytics
- [ ] Export de datos del usuario (Edge Function)
- [ ] Push opt-in contextual (no al primer launch)
- [ ] Sentry configurado en builds de TestFlight/internal
- [ ] PostHog tras consentimiento
- [ ] App Store Connect: privacy nutrition labels
- [ ] Play Console: data safety form

---

_Última revisión: 2026-05-14. Este es el documento canónico._
