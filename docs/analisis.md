---

Análisis del esquema — Lexa Reads

El grafo encontró 6 gaps críticos y varias mejoras. Los organizo por prioridad:

---

> **Estado actual:** Todos los gaps fueron resueltos en `supabase/migrations/002_gaps_and_fixes.sql`
> y refinamientos en 005–008. No hay puntos pendientes en este documento.

---

## ✅ COMPLETADOS

---

### CRITICO — Store-blocking

1. ✅ **user_blocks** — creada en `002_gaps_and_fixes.sql` con RLS completo (SELECT/INSERT/DELETE).
   RLS de `user_books` y `activity_feed` actualizado para respetar bloqueos.

2. ✅ **content_reports** — creada en `002_gaps_and_fixes.sql`, luego reemplazada en `005_reports.sql`
   con ENUMs tipados (`report_target_type`, `report_status`) y tracking de estado.

3. ✅ **account_deletion_requests** — creada en `002_gaps_and_fixes.sql` con RLS
   (SELECT/INSERT/UPDATE para cancelaciones).

---

### BUGS REALES — Contadores huérfanos

4. ✅ **review_likes** — creada en `002_gaps_and_fixes.sql` + trigger `trg_review_likes_count`
   que mantiene `reviews.likes_count`.

5. ✅ **list_likes** — creada en `002_gaps_and_fixes.sql` + trigger `trg_list_likes_count`
   que mantiene `lists.likes_count`.

6. ✅ **reading_club_members** — creada en `002_gaps_and_fixes.sql` + trigger `trg_club_members_count`
   que mantiene `reading_clubs.members_count`.

---

### RLS — Problemas de seguridad

7. ✅ **is_private ignorado** — corregido en `002_gaps_and_fixes.sql`:
   - `user_books`: policy reemplazada con `NOT EXISTS (... u.is_private = true)`
   - `activity_feed`: mismo fix

8. ✅ **reading_clubs sin policies de escritura** — añadidas INSERT/UPDATE/DELETE en `002_gaps_and_fixes.sql`.

9. ✅ **notifications sin INSERT policy** — añadida `"Solo sistema inserta notificaciones"` con `WITH CHECK (false)`.

---

### Extensiones y búsqueda

10. ✅ **citext + pg_trgm** — ambas extensiones creadas en `002_gaps_and_fixes.sql`.
    `username` (users) y `slug` (lists, reading_clubs) convertidos a `citext`.

11. ✅ **Índices GIN de búsqueda** — `idx_books_title_trgm` y `idx_books_authors_trgm` creados.
    Función auxiliar `immutable_array_to_string` para indexar el array de autores.

---

### Mejoras menores

12. ✅ **activity_feed.club_id** — FK real a `reading_clubs` añadido en `002_gaps_and_fixes.sql`.

13. ✅ **reading_clubs sin slug** — columna `slug citext UNIQUE` añadida en `002_gaps_and_fixes.sql`.

14. ✅ **Índice para ratings** — `idx_user_books_rating ON user_books(book_id, rating) WHERE rating IS NOT NULL`
    creado en `002_gaps_and_fixes.sql`.

---

## Resumen del grafo (snapshot original)

```
┌─────────────────────────┬──────────┬─────────────────────────────┐
│ Comunidad               │ Cohesión │ Estado                      │
├─────────────────────────┼──────────┼─────────────────────────────┤
│ Activity Feed & Likes   │ 0.67     │ OK                          │
├─────────────────────────┼──────────┼─────────────────────────────┤
│ Reviews & Missing Likes │ 0.67     │ BUG: falta review_likes     │
├─────────────────────────┼──────────┼─────────────────────────────┤
│ Follows & Social Graph  │ 0.67     │ OK                          │
├─────────────────────────┼──────────┼─────────────────────────────┤
│ Lists & Visibility      │ 0.33     │ BUG: falta list_likes       │
├─────────────────────────┼──────────┼─────────────────────────────┤
│ Books & Social Reading  │ 0.50     │ OK                          │
├─────────────────────────┼──────────┼─────────────────────────────┤
│ Compliance & Auth       │ 0.40     │ CRITICO: 3 tablas faltantes │
└─────────────────────────┴──────────┴─────────────────────────────┘
```

El grafo interactivo está en graphify-out/graph.html.
