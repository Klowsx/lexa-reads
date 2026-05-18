-- ============================================================
-- Lexa Reads — Migración 002: Gaps críticos y fixes de seguridad
-- Basada en el análisis del grafo de esquema (analisis.md)
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================


-- ------------------------------------------------------------
-- 1. Extensiones faltantes
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- ------------------------------------------------------------
-- 2. Cambiar username y slug a citext (case-insensitive)
-- ------------------------------------------------------------
ALTER TABLE users ALTER COLUMN username TYPE citext;
ALTER TABLE lists ALTER COLUMN slug     TYPE citext;


-- ------------------------------------------------------------
-- 3. Índices de búsqueda de texto (GIN + trigramas)
-- ------------------------------------------------------------
CREATE INDEX idx_books_title_trgm ON books USING gin(title gin_trgm_ops);

-- array_to_string no es IMMUTABLE en Postgres, por lo que no puede usarse
-- directamente en un índice. Este wrapper la marca como tal para habilitarlo.
CREATE OR REPLACE FUNCTION immutable_array_to_string(arr text[], sep text)
RETURNS text AS $$
  SELECT array_to_string(arr, sep);
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

CREATE INDEX idx_books_authors_trgm ON books
  USING gin(immutable_array_to_string(authors, ' ') gin_trgm_ops);

-- Índice para rankings de libros más valorados
CREATE INDEX idx_user_books_rating ON user_books(book_id, rating) WHERE rating IS NOT NULL;


-- ------------------------------------------------------------
-- 4. reading_clubs: agregar slug + FK real en activity_feed
-- ------------------------------------------------------------
ALTER TABLE reading_clubs ADD COLUMN slug citext UNIQUE;

-- El comentario original en activity_feed decía "FK cuando exista (Fase 3)"
-- pero reading_clubs ya existe en la misma migración — se agrega el FK real
ALTER TABLE activity_feed
  DROP COLUMN club_id,
  ADD  COLUMN club_id uuid REFERENCES reading_clubs(id) ON DELETE SET NULL;


-- ------------------------------------------------------------
-- 5. Tablas CRÍTICAS faltantes (store-blocking)
-- ------------------------------------------------------------

-- 5a. Bloqueo de usuarios
CREATE TABLE user_blocks (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id  uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id  uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- 5b. Reportes de contenido (≤24h response SLA requerido por stores)
CREATE TABLE content_reports (
  id           uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id  uuid         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type varchar(50)  NOT NULL,  -- 'review', 'activity', 'user'
  content_id   uuid         NOT NULL,
  reason       varchar(100) NOT NULL,
  resolved_at  timestamptz,
  created_at   timestamptz  DEFAULT now()
);

-- 5c. Eliminación de cuenta con gracia de 30 días
CREATE TABLE account_deletion_requests (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_at        timestamptz DEFAULT now(),
  scheduled_delete_at timestamptz DEFAULT now() + interval '30 days',
  cancelled_at        timestamptz
);


-- ------------------------------------------------------------
-- 6. Tablas de likes faltantes (contadores estaban siempre en 0)
-- ------------------------------------------------------------

-- 6a. review_likes — el ENUM ya tenía 'review_like', solo faltaba la tabla
CREATE TABLE review_likes (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id  uuid        NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- 6b. list_likes
CREATE TABLE list_likes (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id    uuid        NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(list_id, user_id)
);


-- ------------------------------------------------------------
-- 7. reading_club_members (members_count también era contador huérfano)
-- ------------------------------------------------------------
CREATE TABLE reading_club_members (
  id        uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id   uuid        NOT NULL REFERENCES reading_clubs(id) ON DELETE CASCADE,
  user_id   uuid        NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
  role      varchar(20) DEFAULT 'member',  -- 'admin', 'member'
  joined_at timestamptz DEFAULT now(),
  UNIQUE(club_id, user_id)
);


-- ------------------------------------------------------------
-- 8. Triggers para los tres contadores nuevos
-- ------------------------------------------------------------

-- review_likes → reviews.likes_count
CREATE OR REPLACE FUNCTION update_review_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reviews SET likes_count = likes_count + 1 WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reviews SET likes_count = likes_count - 1 WHERE id = OLD.review_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_review_likes_count
  AFTER INSERT OR DELETE ON review_likes
  FOR EACH ROW EXECUTE PROCEDURE update_review_likes_count();


-- list_likes → lists.likes_count
CREATE OR REPLACE FUNCTION update_list_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE lists SET likes_count = likes_count + 1 WHERE id = NEW.list_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE lists SET likes_count = likes_count - 1 WHERE id = OLD.list_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_list_likes_count
  AFTER INSERT OR DELETE ON list_likes
  FOR EACH ROW EXECUTE PROCEDURE update_list_likes_count();


-- reading_club_members → reading_clubs.members_count
CREATE OR REPLACE FUNCTION update_club_members_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reading_clubs SET members_count = members_count + 1 WHERE id = NEW.club_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reading_clubs SET members_count = members_count - 1 WHERE id = OLD.club_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_club_members_count
  AFTER INSERT OR DELETE ON reading_club_members
  FOR EACH ROW EXECUTE PROCEDURE update_club_members_count();


-- ============================================================
-- ROW LEVEL SECURITY — tablas nuevas
-- ============================================================
ALTER TABLE user_blocks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_likes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_likes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_club_members      ENABLE ROW LEVEL SECURITY;

-- ---- user_blocks ----
CREATE POLICY "Usuario ve sus propios bloqueos"
  ON user_blocks FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Usuario crea bloqueos"
  ON user_blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Usuario elimina sus bloqueos"
  ON user_blocks FOR DELETE USING (auth.uid() = blocker_id);

-- ---- content_reports ----
CREATE POLICY "Usuario ve sus propios reportes"
  ON content_reports FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Usuario crea reportes"
  ON content_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ---- account_deletion_requests ----
CREATE POLICY "Usuario gestiona su solicitud de eliminación"
  ON account_deletion_requests FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuario crea solicitud de eliminación"
  ON account_deletion_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuario cancela su solicitud de eliminación"
  ON account_deletion_requests FOR UPDATE USING (auth.uid() = user_id);

-- ---- review_likes ----
CREATE POLICY "Likes de reseñas visibles para todos"
  ON review_likes FOR SELECT USING (true);

CREATE POLICY "Usuario gestiona sus propios likes de reseñas"
  ON review_likes FOR ALL USING (auth.uid() = user_id);

-- ---- list_likes ----
CREATE POLICY "Likes de listas visibles para todos"
  ON list_likes FOR SELECT USING (true);

CREATE POLICY "Usuario gestiona sus propios likes de listas"
  ON list_likes FOR ALL USING (auth.uid() = user_id);

-- ---- reading_club_members ----
CREATE POLICY "Miembros de clubes visibles para todos"
  ON reading_club_members FOR SELECT USING (true);

CREATE POLICY "Usuario se une a clubes"
  ON reading_club_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuario sale de clubes o admin gestiona miembros"
  ON reading_club_members FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM reading_club_members m
      WHERE m.club_id = reading_club_members.club_id
        AND m.user_id = auth.uid()
        AND m.role = 'admin'
    )
  );


-- ============================================================
-- ROW LEVEL SECURITY — fixes en tablas existentes
-- ============================================================

-- Fix: user_books exponía biblioteca de perfiles privados
DROP POLICY "user_books visibles para todos (perfiles públicos)" ON user_books;

CREATE POLICY "user_books visibles respetando privacidad"
  ON user_books FOR SELECT USING (
    auth.uid() = user_id
    OR NOT EXISTS (
      SELECT 1 FROM users u WHERE u.id = user_id AND u.is_private = true
    )
  );

-- Fix: activity_feed exponía actividad de perfiles privados
DROP POLICY "Feed visible para todos (perfiles públicos)" ON activity_feed;

CREATE POLICY "Feed visible respetando privacidad"
  ON activity_feed FOR SELECT USING (
    auth.uid() = user_id
    OR NOT EXISTS (
      SELECT 1 FROM users u WHERE u.id = user_id AND u.is_private = true
    )
  );

-- Fix: reading_clubs solo tenía SELECT — faltaban INSERT/UPDATE/DELETE
CREATE POLICY "Usuario crea clubes"
  ON reading_clubs FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admin del club edita el club"
  ON reading_clubs FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Admin del club elimina el club"
  ON reading_clubs FOR DELETE USING (auth.uid() = created_by);

-- Fix: notifications no bloqueaba INSERT directo (solo funciones SECURITY DEFINER deben insertar)
CREATE POLICY "Solo sistema inserta notificaciones"
  ON notifications FOR INSERT WITH CHECK (false);
