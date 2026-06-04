-- ============================================================
-- Lexa Reads — Migración 018: Idempotencia real de notificaciones (NEW-6)
-- ============================================================
-- Problema (auditoría NEW-6): los triggers `notify_*` (011) insertan con
-- `ON CONFLICT DO NOTHING`, pero `notifications` no tenía NINGÚN índice/constraint
-- UNIQUE → la cláusula nunca encontraba conflicto y NO aportaba idempotencia.
-- Además `notify_new_follower` corría en `AFTER INSERT OR UPDATE` (cualquier
-- UPDATE de la fila follows lo re-disparaba).
--
-- Regla de dedupe elegida: no apilar notificaciones idénticas mientras la
-- anterior siga SIN LEER. (recipient, actor, type, reference_id). Si el usuario
-- ya la leyó (`read_at` no nulo), una nueva interacción sí genera notificación.
-- El `ON CONFLICT DO NOTHING` (sin target) de los triggers ya respeta este
-- índice parcial sin tocar su código.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Índice único parcial → da semántica al ON CONFLICT DO NOTHING
-- ------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_unread_dedup
  ON notifications (recipient_id, actor_id, type, reference_id)
  WHERE read_at IS NULL;


-- ------------------------------------------------------------
-- 2. Precisar el trigger de nuevo seguidor (solo INSERT o cambio de status)
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS on_follow_accepted ON follows;
CREATE TRIGGER on_follow_accepted
  AFTER INSERT OR UPDATE OF status ON follows
  FOR EACH ROW EXECUTE FUNCTION notify_new_follower();
