-- ============================================================
-- Lexa Reads — Migración inicial completa
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================


-- ------------------------------------------------------------
-- 0. Extensiones
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS moddatetime;


-- ------------------------------------------------------------
-- 1. ENUMs
-- ------------------------------------------------------------
CREATE TYPE follow_status      AS ENUM ('pending', 'accepted');
CREATE TYPE user_book_status   AS ENUM ('reading', 'read', 'want_to_read', 'abandoned');
CREATE TYPE list_visibility    AS ENUM ('public', 'private');
CREATE TYPE activity_type      AS ENUM (
  'finished_book',
  'started_book',
  'wrote_review',
  'added_to_list',
  'want_to_read',
  'abandoned_book'
);
CREATE TYPE notification_type  AS ENUM (
  'new_follower',
  'review_like',
  'activity_like',
  'reading_challenge_completed',
  'recommendation_received',
  'buddy_read_invite',
  'club_invite'
);
CREATE TYPE book_note_type     AS ENUM ('note', 'quote');
CREATE TYPE buddy_read_status  AS ENUM ('pending', 'active', 'completed', 'declined');


-- ------------------------------------------------------------
-- 2. users
-- ------------------------------------------------------------
CREATE TABLE users (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username            varchar(30)  UNIQUE NOT NULL,
  display_name        varchar(60)  NOT NULL,
  avatar_url          text,
  bio                 varchar(200),
  favorite_genres     text[]       DEFAULT '{}',
  onboarding_completed boolean     DEFAULT false,
  is_private          boolean      DEFAULT false,
  reading_goal        int,
  books_read_count    int          DEFAULT 0,
  reviews_count       int          DEFAULT 0,
  followers_count     int          DEFAULT 0,
  following_count     int          DEFAULT 0,
  created_at          timestamptz  DEFAULT now(),
  updated_at          timestamptz  DEFAULT now(),
  deleted_at          timestamptz
);

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);


-- ------------------------------------------------------------
-- 3. books
-- ------------------------------------------------------------
CREATE TABLE books (
  id               uuid           DEFAULT gen_random_uuid() PRIMARY KEY,
  google_books_id  varchar(20)    UNIQUE NOT NULL,
  open_library_id  varchar(30),
  title            varchar(500)   NOT NULL,
  authors          text[]         DEFAULT '{}',
  cover_url        text,
  isbn_10          varchar(10),
  isbn_13          varchar(13),
  description      text,
  page_count       int,
  genres           text[]         DEFAULT '{}',
  language         varchar(10),
  published_date   varchar(20),
  publisher        varchar(200),
  created_at       timestamptz    DEFAULT now(),
  updated_at       timestamptz    DEFAULT now()
);

CREATE INDEX idx_books_google_id ON books(google_books_id);
CREATE INDEX idx_books_isbn13    ON books(isbn_13);

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);


-- ------------------------------------------------------------
-- 4. follows
-- ------------------------------------------------------------
CREATE TABLE follows (
  id           uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id  uuid          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       follow_status DEFAULT 'accepted',
  created_at   timestamptz   DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_follows_follower  ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);


-- ------------------------------------------------------------
-- 5. user_books
-- ------------------------------------------------------------
CREATE TABLE user_books (
  id           uuid             DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id      uuid             NOT NULL REFERENCES books(id),
  status       user_book_status NOT NULL,
  rating       numeric(2,1)     CHECK (
                 rating >= 0.5 AND rating <= 5.0
                 AND (rating * 2) = FLOOR(rating * 2)
               ),
  started_at   date,
  finished_at  date,
  current_page int,
  is_reread    boolean          DEFAULT false,
  reread_count int              DEFAULT 0,
  goodreads_id varchar(50),
  created_at   timestamptz      DEFAULT now(),
  updated_at   timestamptz      DEFAULT now(),
  UNIQUE(user_id, book_id)
);

CREATE INDEX idx_user_books_user ON user_books(user_id, status);
CREATE INDEX idx_user_books_book ON user_books(book_id);

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON user_books
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);


-- ------------------------------------------------------------
-- 6. reviews
-- ------------------------------------------------------------
CREATE TABLE reviews (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id           uuid        NOT NULL REFERENCES books(id),
  user_book_id      uuid        REFERENCES user_books(id) ON DELETE SET NULL,
  body              text        NOT NULL,
  contains_spoilers boolean     DEFAULT false,
  likes_count       int         DEFAULT 0,
  is_published      boolean     DEFAULT true,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  deleted_at        timestamptz
);

CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_book ON reviews(book_id);

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);


-- ------------------------------------------------------------
-- 7. lists
-- ------------------------------------------------------------
CREATE TABLE lists (
  id          uuid             DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        varchar(100)     NOT NULL,
  description text,
  visibility  list_visibility  DEFAULT 'public',
  slug        varchar(120)     UNIQUE NOT NULL,
  books_count int              DEFAULT 0,
  likes_count int              DEFAULT 0,
  created_at  timestamptz      DEFAULT now(),
  updated_at  timestamptz      DEFAULT now()
);

CREATE INDEX idx_lists_user ON lists(user_id);

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON lists
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);


-- ------------------------------------------------------------
-- 8. list_books
-- ------------------------------------------------------------
CREATE TABLE list_books (
  id        uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id   uuid        NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  book_id   uuid        NOT NULL REFERENCES books(id),
  position  int         NOT NULL DEFAULT 0,
  note      text,
  added_at  timestamptz DEFAULT now(),
  UNIQUE(list_id, book_id)
);

CREATE INDEX idx_list_books_list ON list_books(list_id, position);


-- ------------------------------------------------------------
-- 9. activity_feed
-- ------------------------------------------------------------
CREATE TABLE activity_feed (
  id            uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  book_id       uuid          REFERENCES books(id),
  review_id     uuid          REFERENCES reviews(id)  ON DELETE SET NULL,
  list_id       uuid          REFERENCES lists(id)    ON DELETE SET NULL,
  club_id       uuid,  -- FK a reading_clubs cuando exista (Fase 3)
  metadata      jsonb         DEFAULT '{}',
  likes_count   int           DEFAULT 0,
  created_at    timestamptz   DEFAULT now()
);

CREATE INDEX idx_activity_user ON activity_feed(user_id, created_at DESC);


-- ------------------------------------------------------------
-- 10. activity_likes
-- ------------------------------------------------------------
CREATE TABLE activity_likes (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id uuid        NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES users(id)          ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(activity_id, user_id)
);


-- ============================================================
-- FASES FUTURAS — tablas vacías creadas desde el inicio
-- ============================================================

-- ------------------------------------------------------------
-- 11. notifications (Fase 2)
-- ------------------------------------------------------------
CREATE TABLE notifications (
  id             uuid              DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id   uuid              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id       uuid              REFERENCES users(id) ON DELETE SET NULL,
  type           notification_type NOT NULL,
  reference_id   uuid,
  reference_type varchar(50),
  read_at        timestamptz,
  created_at     timestamptz       DEFAULT now()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, read_at);


-- ------------------------------------------------------------
-- 12. book_recommendations (Fase 2)
-- ------------------------------------------------------------
CREATE TABLE book_recommendations (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id      uuid        NOT NULL REFERENCES books(id),
  note         text,
  seen_at      timestamptz,
  created_at   timestamptz DEFAULT now()
);


-- ------------------------------------------------------------
-- 13. reading_sessions (Fase 2)
-- ------------------------------------------------------------
CREATE TABLE reading_sessions (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
  user_book_id uuid        NOT NULL REFERENCES user_books(id)  ON DELETE CASCADE,
  pages_read   int         NOT NULL DEFAULT 0,
  started_at   timestamptz,
  ended_at     timestamptz,
  notes        text,
  created_at   timestamptz DEFAULT now()
);


-- ------------------------------------------------------------
-- 14. book_notes (Fase 2)
-- ------------------------------------------------------------
CREATE TABLE book_notes (
  id           uuid           DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid           NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  user_book_id uuid           NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
  content      text           NOT NULL,
  page_number  int,
  type         book_note_type DEFAULT 'note',
  created_at   timestamptz    DEFAULT now(),
  updated_at   timestamptz    DEFAULT now()
);

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON book_notes
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);


-- ------------------------------------------------------------
-- 15. reading_clubs (Fase 3)
-- ------------------------------------------------------------
CREATE TABLE reading_clubs (
  id              uuid            DEFAULT gen_random_uuid() PRIMARY KEY,
  name            varchar(100)    NOT NULL,
  description     text,
  created_by      uuid            NOT NULL REFERENCES users(id),
  visibility      list_visibility DEFAULT 'public',
  current_book_id uuid            REFERENCES books(id),
  members_count   int             DEFAULT 0,
  created_at      timestamptz     DEFAULT now(),
  updated_at      timestamptz     DEFAULT now()
);

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON reading_clubs
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);


-- ------------------------------------------------------------
-- 16. buddy_reads (Fase 3)
-- ------------------------------------------------------------
CREATE TABLE buddy_reads (
  id           uuid              DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id      uuid              NOT NULL REFERENCES books(id),
  initiator_id uuid              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_id   uuid              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       buddy_read_status DEFAULT 'pending',
  created_at   timestamptz       DEFAULT now(),
  updated_at   timestamptz       DEFAULT now()
);

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON buddy_reads
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);


-- ============================================================
-- TRIGGERS — contadores desnormalizados
-- ============================================================

-- followers_count / following_count en users
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE users SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    UPDATE users SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_follow_counts
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE PROCEDURE update_follow_counts();


-- books_read_count en users (solo cuando status cambia a 'read')
CREATE OR REPLACE FUNCTION update_books_read_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'read' THEN
    UPDATE users SET books_read_count = books_read_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'read' AND NEW.status = 'read' THEN
      UPDATE users SET books_read_count = books_read_count + 1 WHERE id = NEW.user_id;
    ELSIF OLD.status = 'read' AND NEW.status != 'read' THEN
      UPDATE users SET books_read_count = books_read_count - 1 WHERE id = NEW.user_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'read' THEN
    UPDATE users SET books_read_count = books_read_count - 1 WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_books_read_count
  AFTER INSERT OR UPDATE OR DELETE ON user_books
  FOR EACH ROW EXECUTE PROCEDURE update_books_read_count();


-- reviews_count en users
CREATE OR REPLACE FUNCTION update_reviews_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL AND NEW.is_published THEN
    UPDATE users SET reviews_count = reviews_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- publicar
    IF (OLD.deleted_at IS NOT NULL OR NOT OLD.is_published)
       AND NEW.deleted_at IS NULL AND NEW.is_published THEN
      UPDATE users SET reviews_count = reviews_count + 1 WHERE id = NEW.user_id;
    -- despublicar / soft-delete
    ELSIF OLD.deleted_at IS NULL AND OLD.is_published
       AND (NEW.deleted_at IS NOT NULL OR NOT NEW.is_published) THEN
      UPDATE users SET reviews_count = reviews_count - 1 WHERE id = NEW.user_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.deleted_at IS NULL AND OLD.is_published THEN
    UPDATE users SET reviews_count = reviews_count - 1 WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_reviews_count
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE PROCEDURE update_reviews_count();


-- likes_count en activity_feed
CREATE OR REPLACE FUNCTION update_activity_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE activity_feed SET likes_count = likes_count + 1 WHERE id = NEW.activity_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE activity_feed SET likes_count = likes_count - 1 WHERE id = OLD.activity_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_activity_likes_count
  AFTER INSERT OR DELETE ON activity_likes
  FOR EACH ROW EXECUTE PROCEDURE update_activity_likes_count();


-- books_count en lists
CREATE OR REPLACE FUNCTION update_list_books_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE lists SET books_count = books_count + 1 WHERE id = NEW.list_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE lists SET books_count = books_count - 1 WHERE id = OLD.list_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_list_books_count
  AFTER INSERT OR DELETE ON list_books
  FOR EACH ROW EXECUTE PROCEDURE update_list_books_count();


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows           ENABLE ROW LEVEL SECURITY;
ALTER TABLE books             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_books        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists             ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_books        ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed     ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_notes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_clubs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE buddy_reads       ENABLE ROW LEVEL SECURITY;

-- ---- users ----
CREATE POLICY "Perfiles públicos visibles para todos"
  ON users FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Usuario edita su propio perfil"
  ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Usuario crea su perfil"
  ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- ---- follows ----
CREATE POLICY "Follows visibles para todos"
  ON follows FOR SELECT USING (true);

CREATE POLICY "Usuario crea sus propios follows"
  ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Usuario elimina sus propios follows"
  ON follows FOR DELETE USING (auth.uid() = follower_id);

-- ---- books ----
CREATE POLICY "Libros visibles para todos"
  ON books FOR SELECT USING (true);

CREATE POLICY "Cualquier usuario autenticado puede insertar libros"
  ON books FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ---- user_books ----
CREATE POLICY "user_books visibles para todos (perfiles públicos)"
  ON user_books FOR SELECT USING (true);

CREATE POLICY "Usuario gestiona sus propios user_books"
  ON user_books FOR ALL USING (auth.uid() = user_id);

-- ---- reviews ----
CREATE POLICY "Reseñas publicadas visibles para todos"
  ON reviews FOR SELECT USING (is_published = true AND deleted_at IS NULL);

CREATE POLICY "Usuario gestiona sus propias reseñas"
  ON reviews FOR ALL USING (auth.uid() = user_id);

-- ---- lists ----
CREATE POLICY "Listas públicas visibles para todos"
  ON lists FOR SELECT USING (visibility = 'public');

CREATE POLICY "Usuario ve sus propias listas privadas"
  ON lists FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuario gestiona sus propias listas"
  ON lists FOR ALL USING (auth.uid() = user_id);

-- ---- list_books ----
CREATE POLICY "list_books visibles si la lista es pública"
  ON list_books FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_books.list_id
        AND (lists.visibility = 'public' OR lists.user_id = auth.uid())
    )
  );

CREATE POLICY "Usuario gestiona libros de sus listas"
  ON list_books FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_books.list_id AND lists.user_id = auth.uid()
    )
  );

-- ---- activity_feed ----
CREATE POLICY "Feed visible para todos (perfiles públicos)"
  ON activity_feed FOR SELECT USING (true);

CREATE POLICY "Sistema inserta actividad (SECURITY DEFINER functions)"
  ON activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---- activity_likes ----
CREATE POLICY "Likes visibles para todos"
  ON activity_likes FOR SELECT USING (true);

CREATE POLICY "Usuario gestiona sus propios likes"
  ON activity_likes FOR ALL USING (auth.uid() = user_id);

-- ---- notifications ----
CREATE POLICY "Usuario ve sus propias notificaciones"
  ON notifications FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Usuario actualiza sus propias notificaciones (marcar leída)"
  ON notifications FOR UPDATE USING (auth.uid() = recipient_id);

-- ---- book_recommendations ----
CREATE POLICY "Usuario ve sus recomendaciones enviadas o recibidas"
  ON book_recommendations FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Usuario envía recomendaciones"
  ON book_recommendations FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ---- reading_sessions ----
CREATE POLICY "Usuario gestiona sus sesiones de lectura"
  ON reading_sessions FOR ALL USING (auth.uid() = user_id);

-- ---- book_notes ----
CREATE POLICY "Usuario gestiona sus notas"
  ON book_notes FOR ALL USING (auth.uid() = user_id);

-- ---- reading_clubs ----
CREATE POLICY "Clubes públicos visibles para todos"
  ON reading_clubs FOR SELECT USING (visibility = 'public');

-- ---- buddy_reads ----
CREATE POLICY "Usuario ve sus buddy reads"
  ON buddy_reads FOR SELECT
  USING (auth.uid() = initiator_id OR auth.uid() = partner_id);

CREATE POLICY "Usuario crea buddy reads"
  ON buddy_reads FOR INSERT WITH CHECK (auth.uid() = initiator_id);


-- ============================================================
-- FUNCIÓN: crear perfil automáticamente al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    -- username temporal basado en el id; el usuario lo cambia en onboarding
    'user_' || SUBSTRING(NEW.id::text, 1, 8),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Lector'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
