# Diagramas — Lexa Reads

> Diagramas en **Mermaid** (se renderizan en GitHub y VS Code con la extensión
> Markdown Preview Mermaid). Fuente única de la vista de alto nivel del sistema.
> Detalle de producto/DB → `STACK.md` · mensajería → `clubs-y-chat.md`.

---

## 1. Arquitectura y flujo de datos

Regla dura (CLAUDE.md): `app/` solo rutas; la lógica vive en `src/`; el estado de
servidor es TanStack Query y el de cliente es Zustand. Toda escritura pasa por RLS.

```mermaid
flowchart TD
  subgraph APP["app/ — solo rutas (Expo Router)"]
    SCR["Screens: feed, library, book, user,<br/>messages, clubs, club, settings..."]
  end

  subgraph SRC["src/ — lógica"]
    HOOKS["features/*/hooks<br/>(useFeed, useMessages, useClub...)"]
    QUERIES["features/*/*.queries.ts<br/>(queryOptions / infiniteQueryOptions)"]
    GBOOKS["lib/google-books.ts<br/>(única puerta a Google Books)"]
    NYT["lib/nyt-books.ts"]
    SUPA["lib/supabase.ts<br/>(cliente + SecureStore chunked)"]
    subgraph STORES["Zustand (solo estado de cliente)"]
      AUTH["auth.store"]
      UI["ui.store (toasts)"]
      THEME["theme.store"]
    end
    QC["lib/query-client.ts<br/>(onError → toast)"]
  end

  subgraph SB["Supabase"]
    PG[("Postgres + RLS")]
    TRG["Triggers<br/>(contadores, notify_*, last_message_at)"]
    RT["Realtime<br/>(messages)"]
    EF["Edge Functions<br/>(send-push, delete-account,<br/>export-user-data, nyt-bestsellers)"]
    AU["Auth (JWT)"]
  end

  GAPI["Google Books API"]
  EXPO["Expo Push"]

  SCR --> HOOKS --> QUERIES --> SUPA
  QUERIES --> GBOOKS --> SUPA
  GBOOKS -.->|cache-miss| GAPI
  NYT --> SUPA
  HOOKS -. usa .-> QC
  QC --> UI
  SCR -. sesión .-> AUTH
  AUTH <-->|onAuthStateChange| AU
  SUPA --> PG
  PG --> TRG
  RT -->|invalida queries| HOOKS
  PG -->|cambios en messages| RT
  TRG -->|INSERT notifications| EF
  EF --> EXPO
  NYT -->|invoke| EF
  EF -->|key server-side| GAPI
```

---

## 2. Esquema de base de datos (ER)

Dividido en **núcleo social** y **mensajería** para legibilidad; comparten `users`.
Solo columnas clave. Todas las tablas tienen RLS; `*_count` los mantienen triggers.

### 2.1 Núcleo social

```mermaid
erDiagram
  users ||--o{ follows : "sigue"
  users ||--o{ user_books : "biblioteca"
  users ||--o{ reviews : "escribe"
  users ||--o{ lists : "crea"
  users ||--o{ activity_feed : "genera"
  users ||--o{ comments : "comenta"
  users ||--o{ user_blocks : "bloquea"
  users ||--o{ notifications : "recibe"
  books  ||--o{ user_books : "en"
  books  ||--o{ reviews : "sobre"
  books  ||--o{ list_books : "en"
  lists  ||--o{ list_books : "contiene"
  reviews ||--o{ review_likes : "likes"
  activity_feed ||--o{ activity_likes : "likes"

  users {
    uuid id PK
    citext username
    bool is_private
    bool is_admin
    int followers_count
    int books_read_count
  }
  books {
    uuid id PK
    text google_books_id
    uuid added_by FK
  }
  user_books {
    uuid id PK
    uuid user_id FK
    uuid book_id FK
    enum status
    numeric rating
  }
  reviews {
    uuid id PK
    text body
    bool is_published
    timestamptz deleted_at
  }
  reports {
    uuid id PK
    enum target_type
    uuid target_id
    enum status
  }
```

### 2.2 Mensajería (clubes + DMs)

```mermaid
erDiagram
  users ||--o{ conversation_members : "miembro DM"
  users ||--o{ messages : "envía"
  conversations ||--o{ messages : "contiene"
  conversations ||--o{ conversation_members : "DM (2)"
  reading_clubs ||--|| conversations : "chat (1)"
  reading_clubs ||--o{ reading_club_members : "miembros"
  reading_clubs ||--o{ club_topics : "hilos"
  club_topics ||--o{ messages : "agrupa"
  messages ||--o{ messages : "reply_to"

  conversations {
    uuid id PK
    enum kind "dm|club"
    uuid club_id FK
    uuid dm_user_low FK
    uuid dm_user_high FK
    enum request_state "open|pending"
    timestamptz last_message_at
  }
  messages {
    uuid id PK
    uuid conversation_id FK
    uuid sender_id FK
    text body
    uuid reply_to_id FK
    timestamptz deleted_at
  }
  conversation_members {
    uuid conversation_id PK
    uuid user_id PK
    timestamptz last_read_at
  }
  reading_clubs {
    uuid id PK
    citext slug
    enum visibility "public|private"
    uuid current_book_id FK
  }
  reading_club_members {
    uuid club_id PK
    uuid user_id PK
    varchar role "owner|moderator|member"
    varchar state "active|pending|invited|banned"
  }
```

---

## 3. Secuencia — enviar un DM (con solicitud de mensaje + realtime)

```mermaid
sequenceDiagram
  actor A as Usuario A
  participant UI as App (ChatThread)
  participant QC as TanStack Query
  participant DB as Supabase (RLS)
  participant TR as Triggers
  participant B as Usuario B (otro device)

  A->>UI: escribe y envía
  UI->>QC: onMutate → mensaje temporal (optimistic)
  UI->>DB: INSERT messages (RLS: conversation_send_allowed)
  alt bloqueado o solicitud no aceptada (B es receptor)
    DB-->>UI: error → revierte optimistic + toast
  else permitido
    DB->>TR: AFTER INSERT
    TR->>DB: bump last_message_at
    TR->>DB: INSERT notification (dm_request|dm_message)
    DB-->>UI: fila real
    QC-->>UI: onSettled → invalida ["messages", convId]
    DB-->>B: Realtime (postgres_changes)
    B->>QC: invalida → refetch → ve el mensaje
  end
```

> La puerta de solicitud: si A y B **no** son seguidores mutuos, `request_state='pending'`
> y B ve el hilo en *Solicitudes*; B solo puede responder tras `accept_message_request`.

---

## 4. Diagramas de estado

### 4.1 Solicitud de DM

```mermaid
stateDiagram-v2
  [*] --> pending: A escribe a no-seguidor
  [*] --> open: seguidores mutuos
  pending --> open: B acepta (accept_message_request)
  pending --> [*]: B rechaza (borra conversación)
  open --> [*]: cualquiera borra el DM
```

### 4.2 Membresía de club

```mermaid
stateDiagram-v2
  [*] --> active: unirse a club público
  [*] --> pending: solicitar club privado
  [*] --> invited: mod invita
  pending --> active: mod aprueba (approve_club_member)
  invited --> active: usuario acepta (accept_club_invite)
  active --> banned: mod banea (ban_club_member)
  active --> [*]: salir del club
  pending --> [*]: cancelar solicitud
```
