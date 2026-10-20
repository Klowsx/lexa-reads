# Clubes de lectura + Mensajería (DMs y chat de club)

> Capa de mensajería de Lexa. DMs 1:1 con solicitudes de mensaje + clubes con
> chat grupal. Producto/DB base → `STACK.md`. Despliegue → `despliegue.md`.

## Estado: IMPLEMENTADO (núcleo) — 2026-06-04

**Construido** (migraciones `019`–`021`, `src/features/chat`, `src/features/clubs`, rutas):

- DM 1:1 con **solicitudes de mensaje** (seguidores mutuos → directo; resto → bandeja Solicitudes; aceptar/rechazar), **reply citado**, editar/borrar propio, read receipts + no leídos, realtime (Postgres Changes), reportar mensaje, bloqueo enforced en RLS.
- Clubes: crear (público/privado), unirse/solicitar/aceptar invitación/salir, roles owner/mod (+ RPCs de moderación: aprobar, banear, rol), **chat grupal** del club, reportar club, descubrir/mis clubes.
- Compliance: reportar (`message`/`club`), cascada de borrado por FK, export incluye mensajes, prefs `push_dm`/`push_club` + `send-push` actualizado.
- Entradas: íconos de clubes y mensajes en el header del feed; botón **Mensaje** en el perfil ajeno.

**Pendiente de despliegue:** aplicar `019`→`021`, `pnpm gen:types` (quitar los `as any` de `chat.queries.ts`/`clubs.queries.ts`), publicar `messages` en realtime (lo hace `020`). Ver `despliegue.md`.

**Diferido (no construido aún):** hilos de discusión por libro/capítulo (`club_topics` ya existe en DB, sin UI), @menciones, reacciones, adjuntos, búsqueda, typing/presencia, DMs de grupo, notificación push por mensaje de club (hoy solo badge). Ver §7–8.

---

> Diseño original abajo (referencia).

## Decisiones de producto (fijadas)

| Tema                   | Decisión                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **DMs — acceso**       | _Solicitudes de mensaje_: seguidores mutuos chatean directo; un no-seguidor cae en bandeja de **Solicitudes** del receptor (aceptar/ignorar/bloquear). |
| **Responder mensajes** | Sí — **reply citado** a un mensaje concreto (estilo Discord/WhatsApp), en DMs y clubes.                                                                |
| **Clubes — chat**      | Chat grupal + **hilos de discusión** (libro del mes, por capítulo, con aviso de spoilers).                                                             |
| **Clubes — entrada**   | Público abierto (unirse al instante) **o** privado por invitación/aprobación (no aparece en búsqueda).                                                 |
| **Alcance ahora**      | DM **1:1** + clubes con chat. DMs de grupo: esquema preparado, UI después.                                                                             |

---

## 1. Arquitectura: un sustrato único de mensajería

DMs y chat de club comparten **una sola tabla `messages`** colgada de un contenedor
`conversations`. Así hay un único camino de realtime, paginación, moderación,
export y borrado. La pertenencia se resuelve distinto según el tipo:

- **DM** → `conversation_members` (2 filas; preparado para grupo = N filas).
- **Club** → reutiliza `reading_club_members` (ya existe). El club tiene **una**
  conversación auto-creada (`kind='club'`, `club_id`).

```
conversations (id, kind 'dm'|'club', club_id?, request_state 'open'|'pending',
               requested_by?, last_message_at, created_at)
   │
   ├─ conversation_members (conversation_id, user_id, last_read_at, muted, archived)   ← solo DM
   │
   └─ messages (id, conversation_id, topic_id?, sender_id, body,
                reply_to_id? → messages.id, created_at, edited_at, deleted_at)
        └─ message_reactions (message_id, user_id, emoji)   ← opcional (Fase 4)

club_topics (id, club_id, title, kind 'general'|'book_discussion',
             book_id?, spoiler_after_chapter?, created_by, created_at)   ← hilos de club
```

- `reply_to_id`: self-FK → mensaje citado (el "responder a"). `ON DELETE SET NULL`.
- `topic_id`: null = canal general del club; no-null = hilo de discusión. En DMs siempre null.
- `deleted_at`: soft-delete → se muestra "mensaje eliminado" (consistente con `comments`).
- DM 1:1 único por par: índice único determinista sobre el par ordenado
  (`least/greatest` de los dos `user_id`) en una tabla `dm_pairs(conversation_id, user_low, user_high UNIQUE)` o `unique(conversation_id)` derivado — evita conversaciones duplicadas.

### Roles de club

`reading_club_members` hoy solo tiene pertenencia. Añadir:

- `role enum 'owner'|'moderator'|'member'` (default member; `owner` = `created_by`).
- `state enum 'active'|'pending'|'invited'|'banned'` (público abierto → `active`; privado → `invited`/`pending`).
- `last_read_at timestamptz` (read-state del chat de club).

Owner/moderator pueden: editar club, fijar `current_book_id`, crear/cerrar `club_topics`,
borrar mensajes ajenos (soft-delete), aprobar solicitudes, invitar, expulsar/banear.

---

## 2. RLS — el núcleo de seguridad y compliance

Toda la mensajería es UGC: las policies son la línea de defensa. Centralizar en
helpers `SECURITY DEFINER` con `search_path` fijo (como `can_view_user_content` /
`is_blocked_with` ya existentes — ver `auditoria.md` NEW-2).

```
is_conversation_member(conv) -- ¿auth.uid() pertenece y está 'active'?
                             -- DM: fila en conversation_members; Club: reading_club_members.state='active'
```

| Tabla                  | SELECT                                                                                                                                                        | INSERT                                                                                  | UPDATE/DELETE                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `conversations`        | miembro de la conversación                                                                                                                                    | ver §3 (creación de DM)                                                                 | —                                                               |
| `messages`             | `is_conversation_member(conversation_id)` **y NOT `is_blocked_with(sender_id)`** (oculta mensajes de bloqueados en ambos sentidos, incluso dentro de un club) | `sender_id = auth.uid()` ∧ miembro activo ∧ conversación no cerrada ∧ (DM no bloqueado) | solo el autor edita/borra; owner/mod del club soft-borra ajenos |
| `conversation_members` | el propio usuario                                                                                                                                             | al crear DM (§3)                                                                        | el propio: `last_read_at`, `muted`, `archived`                  |
| `reading_club_members` | miembros del club                                                                                                                                             | público→self `active`; privado→`pending`/solo invitación                                | owner/mod gestionan; self puede salir                           |
| `club_topics`          | miembros del club                                                                                                                                             | owner/mod                                                                               | owner/mod                                                       |

**Solicitudes de mensaje (anti-spam/seguridad):**

- Si A y B se siguen mutuamente → al crear el DM, `request_state='open'`.
- Si no → `request_state='pending'`, `requested_by=A`. B ve el hilo en **Solicitudes**.
  A puede enviar (límite: p. ej. ≤3 mensajes) hasta que B acepte; B no recibe push
  hasta aceptar. Si B **ignora/bloquea** → A no puede seguir (RLS por `is_blocked_with`).
- Aceptar = `request_state='open'`. Rechazar = borrar conversación (o marcar y bloquear).

---

## 3. Realtime

**Supabase Realtime.** Empezar con **Postgres Changes** sobre `messages`
filtrado por `conversation_id` (RLS-aware, mínima fricción, suficiente para 200–500
usuarios). Plan de escala documentado: migrar a **Realtime Broadcast** (desacoplado
de la DB, escala mejor) cuando el volumen lo pida — la persistencia sigue siendo el
`INSERT`, solo cambia el canal de fan-out.

- **Mensajes:** suscripción a `INSERT/UPDATE` de `messages` de la conversación
  abierta → `setQueryData` para anexar/editar (no refetch).
- **Typing indicators / presencia (en línea):** Realtime **Presence** (efímero, sin DB).
- **Badge de no leídos / inbox:** suscripción ligera + `last_read_at` por miembro.

---

## 4. Cliente (respeta CLAUDE.md)

Features nuevas: `src/features/chat/` (DMs) y `src/features/clubs/`.

**Rutas (`app/`, solo routing):**

```
app/messages/index.tsx              # inbox: conversaciones + pestaña 'Solicitudes'
app/messages/[conversationId].tsx   # hilo de DM
app/clubs/index.tsx                 # descubrir / mis clubes
app/club/[slug].tsx                 # club: chat general + lista de hilos + miembros
app/club/[slug]/topic/[topicId].tsx # hilo de discusión
app/club/new.tsx                    # crear club
```

Entrada al inbox: ícono en el header del feed (o tab dedicada si crece el uso).

**Datos:** historial con `useInfiniteQuery` + cursor `(created_at, id)` (CLAUDE §6);
`flash-list` **invertida** para el hilo; envío con **optimistic update** (CLAUDE §8:
snapshot→append temporal→reconciliar con el row real del realtime). Server-state en
TanStack; Zustand **solo** para typing/presencia efímeros. Imágenes con `expo-image`.

---

## 5. Notificaciones

El enum ya tiene `buddy_read_invite`, `club_invite`. Añadir:
`dm_request`, `dm_message`, `club_message`, `club_join_request`, `club_message_mention`.

- **Push throttling:** no una push por mensaje. Agrupar por conversación, **respetar
  `muted`** y no enviar si el receptor está activo en esa conversación.
- Extender `notification_preferences`: `push_dm`, `push_club` (+ consentimiento ya existente).
- `send-push`: nuevos `buildMessage` por tipo (localizar — hoy están en español fijo, ver `auditoria` UX-3).

---

## 6. Compliance (BLOQUEANTE de tiendas — no opcional)

El chat dispara requisitos de UGC de App Store/Play:

- **Reportar:** extender `reports.target_type` con `'message'`, `'conversation'`, `'club'`.
  Reusar `ReportSheet` + cola de moderación admin (`moderacion.md`).
- **Bloqueo:** ya enforced vía `is_blocked_with` en las policies de `messages`.
- **Moderación de club:** owner/mod borran mensajes y expulsan; `is_admin` global cubre reportes.
- **Borrado de cuenta:** el hard-delete (`013`) debe cascadear `messages`/`conversation_members`
  (FK `sender_id`/`user_id` `ON DELETE CASCADE`). **Decisión:** en DMs, borrar al usuario deja
  "mensaje eliminado" en el hilo del otro (no romper el contexto) — scrub de `body`, no borrado físico.
- **Export de datos:** `export-user-data` debe incluir mensajes enviados.
- **Mute / salir / archivar** conversación por usuario.

---

## 7. Matriz de features ("que no se sientan limitados")

| Feature                                            | DM  | Club | Fase  |
| -------------------------------------------------- | :-: | :--: | :---: |
| Enviar / recibir texto en realtime                 |  ✓  |  ✓   | 1 / 2 |
| **Responder a mensaje (reply citado)**             |  ✓  |  ✓   | 1 / 2 |
| Solicitudes de mensaje (anti-spam)                 |  ✓  |  —   |   1   |
| Editar / borrar propio (soft)                      |  ✓  |  ✓   | 1 / 2 |
| Read receipts (`last_read_at`) + no leídos         |  ✓  |  ✓   | 1 / 2 |
| Typing indicator / presencia                       |  ✓  |  ✓   | 1 / 3 |
| Mute / archivar / salir                            |  ✓  |  ✓   | 1 / 2 |
| Reportar + bloqueo enforced                        |  ✓  |  ✓   | 1 / 2 |
| Roles (owner/mod) + moderación                     |  —  |  ✓   |   2   |
| Hilos de discusión (libro/capítulo) + spoiler-gate |  —  |  ✓   |   3   |
| @menciones                                         |  —  |  ✓   |   3   |
| Reacciones emoji                                   |  ✓  |  ✓   |   4   |
| Adjuntar imágenes (Supabase Storage)               |  ✓  |  ✓   |   4   |
| Búsqueda en mensajes                               |  ✓  |  ✓   |   4   |
| DMs de grupo                                       |  —  |  —   |   4   |

---

## 8. Plan de entrega por fases

1. **Núcleo de mensajería + DM 1:1.** `conversations`/`messages`/`conversation_members`
   - RLS + helpers + solicitudes de mensaje + reply citado + inbox + realtime (postgres
     changes) + reportar mensaje + bloqueo + export/borrado. _Es el cimiento de todo._
2. **Clubes base.** Roles y `state` en `reading_club_members`; alta/baja (público abierto
   vs privado por invitación/aprobación); chat grupal (topic general) reusando el núcleo;
   descubrimiento de clubes; moderación de club.
3. **Profundidad de club.** `club_topics` (libro del mes / por capítulo) + spoiler-gate +
   `current_book_id` + invitaciones + @menciones + typing/presencia.
4. **Escala y pulido.** Migrar fan-out a Broadcast; adjuntos (Storage); reacciones;
   throttling de push afinado; búsqueda; (opcional) DMs de grupo.

## 9. Riesgos a vigilar

- **Recursión de RLS:** leer `reading_club_members`/`conversation_members` desde policies
  de `messages` → resolver con helpers `SECURITY DEFINER` (`search_path` fijo), igual que
  `is_blocked_with`. No repetir el agujero de `auditoria.md` NEW-1/NEW-2.
- **Límites de Postgres Changes** a escala (suscripciones con filtro, RLS por fila) → la
  ruta de salida es Broadcast (ya contemplada).
- **Spam / acoso por DM** → el modelo de solicitudes + bloqueo bidireccional + reporte es
  la mitigación; sin esto la app es rechazable.
- **Push ruidoso** → throttling + mute desde el día 1, o la gente desactiva las notifs.
- **Coste de realtime / mensajes huérfanos** → cascadas de FK bien definidas y `last_message_at`
  desnormalizado (trigger) para ordenar el inbox sin escanear `messages`.
