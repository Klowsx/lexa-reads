-- ============================================================
-- Lexa Reads — Migración 011: notificaciones (triggers + push token)
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- Agregar push_token a notification_preferences (null = no preguntado, 'declined' = rechazado)
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS push_token text;

-- NOTA (D-3): el valor de enum 'comment_received' se agrega en su propia
-- migración previa (`011_notification_enum.sql`) — no puede usarse en la
-- misma transacción que lo crea. Aquí ya está committeado y disponible.

-- ─── Trigger: notificar nuevo seguidor ───────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo notificar cuando se acepta el follow (cuentas públicas: status='accepted' al insertar)
  IF NEW.status = 'accepted' THEN
    INSERT INTO notifications (recipient_id, actor_id, type, reference_id, reference_type)
    VALUES (NEW.following_id, NEW.follower_id, 'new_follower', NEW.id, 'follow')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_accepted ON follows;
CREATE TRIGGER on_follow_accepted
  AFTER INSERT OR UPDATE ON follows
  FOR EACH ROW EXECUTE FUNCTION notify_new_follower();

-- ─── Trigger: notificar like en reseña ──────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_review_like()
RETURNS TRIGGER AS $$
DECLARE
  review_author uuid;
BEGIN
  SELECT user_id INTO review_author FROM reviews WHERE id = NEW.review_id;
  -- No notificar si el autor se da me gusta a sí mismo
  IF review_author IS NOT NULL AND review_author <> NEW.user_id THEN
    INSERT INTO notifications (recipient_id, actor_id, type, reference_id, reference_type)
    VALUES (review_author, NEW.user_id, 'review_like', NEW.review_id, 'review')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_like ON review_likes;
CREATE TRIGGER on_review_like
  AFTER INSERT ON review_likes
  FOR EACH ROW EXECUTE FUNCTION notify_review_like();

-- ─── Trigger: notificar like en actividad ───────────────────────────────────
CREATE OR REPLACE FUNCTION notify_activity_like()
RETURNS TRIGGER AS $$
DECLARE
  activity_author uuid;
BEGIN
  SELECT user_id INTO activity_author FROM activity_feed WHERE id = NEW.activity_id;
  IF activity_author IS NOT NULL AND activity_author <> NEW.user_id THEN
    INSERT INTO notifications (recipient_id, actor_id, type, reference_id, reference_type)
    VALUES (activity_author, NEW.user_id, 'activity_like', NEW.activity_id, 'activity')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_activity_like ON activity_likes;
CREATE TRIGGER on_activity_like
  AFTER INSERT ON activity_likes
  FOR EACH ROW EXECUTE FUNCTION notify_activity_like();

-- ─── Trigger: notificar comentario nuevo ────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_comment_received()
RETURNS TRIGGER AS $$
DECLARE
  target_author uuid;
BEGIN
  -- No procesar comentarios eliminados o respuestas (parent_id not null)
  IF NEW.deleted_at IS NOT NULL OR NEW.parent_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.target_type = 'review' THEN
    SELECT user_id INTO target_author FROM reviews WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'activity' THEN
    SELECT user_id INTO target_author FROM activity_feed WHERE id = NEW.target_id;
  END IF;

  IF target_author IS NOT NULL AND target_author <> NEW.user_id THEN
    INSERT INTO notifications (recipient_id, actor_id, type, reference_id, reference_type)
    VALUES (target_author, NEW.user_id, 'comment_received', NEW.target_id, NEW.target_type::text)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_received ON comments;
CREATE TRIGGER on_comment_received
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_comment_received();
