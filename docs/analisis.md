---

Análisis del esquema — Lexa Reads

El grafo encontró 6 gaps críticos y varias mejoras. Los organizo por prioridad:

---

CRITICO — Store-blocking (app rechazada sin esto)

El CLAUDE.md los lista explícitamente. No existen en la migración:

1. user_blocks — falta completamente
   CREATE TABLE user_blocks (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   blocker_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   blocked_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   created_at timestamptz DEFAULT now(),
   UNIQUE(blocker_id, blocked_id)
   );
   -- RLS: las policies de user_books, reviews, activity_feed necesitan checar esta tabla

2. content_reports — falta completamente
   CREATE TABLE content_reports (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   content_type varchar(50) NOT NULL, -- 'review', 'activity', 'user'
   content_id uuid NOT NULL,
   reason varchar(100) NOT NULL,
   resolved_at timestamptz,
   created_at timestamptz DEFAULT now()
   );

3. account_deletion_requests — falta completamente
   CREATE TABLE account_deletion_requests (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   requested_at timestamptz DEFAULT now(),
   scheduled_delete_at timestamptz DEFAULT now() + interval '30 days',
   cancelled_at timestamptz
   );

---

BUGS REALES — Contadores huérfanos

El grafo detectó que reviews.likes_count y lists.likes_count tienen contadores pero no hay tabla fuente ni trigger que
los mantenga. Actualmente están siempre en 0 y no se pueden incrementar:

4. review_likes — falta (hay activity_likes pero no review_likes)
   CREATE TABLE review_likes (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
   user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   created_at timestamptz DEFAULT now(),
   UNIQUE(review_id, user_id)
   );
   -- + trigger que mantenga reviews.likes_count
   -- + notification_type 'review_like' ya está en el ENUM, solo falta la tabla

5. list_likes — mismo problema
   CREATE TABLE list_likes (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
   user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   created_at timestamptz DEFAULT now(),
   UNIQUE(list_id, user_id)
   );
   -- + trigger que mantenga lists.likes_count

6. reading_club_members — reading_clubs.members_count tiene el mismo problema
   CREATE TABLE reading_club_members (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   club_id uuid NOT NULL REFERENCES reading_clubs(id) ON DELETE CASCADE,
   user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   role varchar(20) DEFAULT 'member', -- 'admin', 'member'
   joined_at timestamptz DEFAULT now(),
   UNIQUE(club_id, user_id)
   );
   -- + trigger que mantenga reading_clubs.members_count

---

RLS — Problemas de seguridad

7. is_private ignorado — las policies actuales exponen datos de perfiles privados:

- user_books FOR SELECT USING (true) — un usuario privado queda expuesto
- activity_feed FOR SELECT USING (true) — mismo problema
- Deberían agregar: AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = user_id AND u.is_private AND u.id !=
  auth.uid())

8. reading_clubs sin policies de escritura — solo tiene SELECT. Falta INSERT/UPDATE/DELETE.

9. notifications sin INSERT policy — las funciones que crean notificaciones son SECURITY DEFINER, pero si alguien
   llama directamente, no hay protección. Añadir:
   CREATE POLICY "Solo sistema inserta notificaciones"
   ON notifications FOR INSERT WITH CHECK (false); -- solo via funciones SECURITY DEFINER

---

Extensiones faltantes (CLAUDE.md las menciona, no están en la migración)

10. Faltan al inicio del archivo:
    CREATE EXTENSION IF NOT EXISTS citext; -- para usernames/slugs case-insensitive
    CREATE EXTENSION IF NOT EXISTS pg_trgm; -- para búsqueda de libros por texto
    Y los campos username / slug deberían ser citext en vez de varchar.

11. Índice de búsqueda de libros — falta el GIN index que menciona el CLAUDE.md:
    CREATE INDEX idx_books_title_trgm ON books USING gin(title gin_trgm_ops);
    CREATE INDEX idx_books_authors_trgm ON books USING gin(authors gin_trgm_ops);

---

Mejoras menores

12. activity_feed.club_id — el comentario dice "FK a reading_clubs cuando exista (Fase 3)" pero reading_clubs ya
    existe en la misma migración. Se puede agregar el FK real ahora:
    club_id uuid REFERENCES reading_clubs(id) ON DELETE SET NULL,

13. reading_clubs sin slug — para rutas /club/[slug] que el router de Expo necesita.

14. user_books sin índice para rating — si vas a mostrar rankings de libros más valorados, necesitarás:
    CREATE INDEX idx_user_books_rating ON user_books(book_id, rating) WHERE rating IS NOT NULL;

---

Resumen del grafo

┌─────────────────────────┬──────────┬─────────────────────────────┐
│ Comunidad │ Cohesión │ Estado │
├─────────────────────────┼──────────┼─────────────────────────────┤
│ Activity Feed & Likes │ 0.67 │ OK │
├─────────────────────────┼──────────┼─────────────────────────────┤
│ Reviews & Missing Likes │ 0.67 │ BUG: falta review_likes │
├─────────────────────────┼──────────┼─────────────────────────────┤
│ Follows & Social Graph │ 0.67 │ OK │
├─────────────────────────┼──────────┼─────────────────────────────┤
│ Lists & Visibility │ 0.33 │ BUG: falta list_likes │
├─────────────────────────┼──────────┼─────────────────────────────┤
│ Books & Social Reading │ 0.50 │ OK │
├─────────────────────────┼──────────┼─────────────────────────────┤
│ Compliance & Auth │ 0.40 │ CRITICO: 3 tablas faltantes │
└─────────────────────────┴──────────┴─────────────────────────────┘

El grafo interactivo está en graphify-out/graph.html — ábrelo en el browser para ver las relaciones visualmente (los
nodos rojos son los gaps identificados).

La pregunta más interesante que puede trazar el grafo: ¿Por qué users tiene betweenness centrality de 0.74 y conecta
todas las 7 comunidades del esquema? — porque es el único punto de unión entre compliance, social, y library. Eso es
un riesgo de acoplamiento si escala.
