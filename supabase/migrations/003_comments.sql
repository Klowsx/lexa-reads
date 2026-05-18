-- ============================================================
-- Lexa Reads — Migración 003: Tabla comments
-- MVP obligatorio — sin comentarios el feed es estéril
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================


-- ------------------------------------------------------------
-- 1. ENUM
-- ------------------------------------------------------------
CREATE TYPE comment_target_type AS ENUM ('review', 'activity');


-- ------------------------------------------------------------
-- 2. comments_count en reviews y activity_feed
--    (los contadores existían pero no había tabla fuente)
-- ------------------------------------------------------------
ALTER TABLE reviews       ADD COLUMN comments_count int DEFAULT 0;
ALTER TABLE activity_feed ADD COLUMN comments_count int DEFAULT 0;


-- ------------------------------------------------------------
-- 3. Tabla comments
-- ------------------------------------------------------------
CREATE TABLE comments (
  id               uuid                 DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid                 NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  target_type      comment_target_type  NOT NULL,
  target_id        uuid                 NOT NULL,
  parent_id        uuid                 REFERENCES comments(id)          ON DELETE CASCADE,
  reply_to_user_id uuid                 REFERENCES users(id)             ON DELETE SET NULL,
  body             text                 NOT NULL,
  edited_at        timestamptz,
  created_at       timestamptz          DEFAULT now(),
  deleted_at       timestamptz
);

-- parent_id = comentario raíz al que pertenece el hilo
-- reply_to_user_id = usuario específico al que se responde (para mostrar "user2 → user1")

CREATE INDEX idx_comments_target ON comments(target_type, target_id, created_at);
CREATE INDEX idx_comments_parent ON comments(parent_id);


-- ------------------------------------------------------------
-- 4. Trigger: comments_count en reviews y activity_feed
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL THEN
    IF NEW.target_type = 'review' THEN
      UPDATE reviews       SET comments_count = comments_count + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'activity' THEN
      UPDATE activity_feed SET comments_count = comments_count + 1 WHERE id = NEW.target_id;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- soft-delete: published → deleted
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      IF NEW.target_type = 'review' THEN
        UPDATE reviews       SET comments_count = comments_count - 1 WHERE id = NEW.target_id;
      ELSIF NEW.target_type = 'activity' THEN
        UPDATE activity_feed SET comments_count = comments_count - 1 WHERE id = NEW.target_id;
      END IF;
    -- restaurar: deleted → published
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      IF NEW.target_type = 'review' THEN
        UPDATE reviews       SET comments_count = comments_count + 1 WHERE id = NEW.target_id;
      ELSIF NEW.target_type = 'activity' THEN
        UPDATE activity_feed SET comments_count = comments_count + 1 WHERE id = NEW.target_id;
      END IF;
    END IF;

  ELSIF TG_OP = 'DELETE' AND OLD.deleted_at IS NULL THEN
    IF OLD.target_type = 'review' THEN
      UPDATE reviews       SET comments_count = comments_count - 1 WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'activity' THEN
      UPDATE activity_feed SET comments_count = comments_count - 1 WHERE id = OLD.target_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_comments_count
  AFTER INSERT OR UPDATE OR DELETE ON comments
  FOR EACH ROW EXECUTE PROCEDURE update_comments_count();


-- ------------------------------------------------------------
-- 5. RLS
-- ------------------------------------------------------------
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comentarios públicos visibles para todos"
  ON comments FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Usuario crea comentarios"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuario edita sus propios comentarios"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuario elimina sus propios comentarios"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);
