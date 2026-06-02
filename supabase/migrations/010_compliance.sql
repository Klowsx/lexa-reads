-- ============================================================
-- Lexa Reads — Migración 010: Compliance (Fase D)
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- consent_given_at: null = modal de consentimiento pendiente
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS consent_given_at timestamptz;

-- ============================================================
-- pg_cron: hard-delete + anonimización a los 30 días
-- Requiere extensión pg_cron (ya habilitada en Supabase)
-- ============================================================
SELECT cron.schedule(
  'lexa-hard-delete-accounts',
  '0 3 * * *',
  $$
    UPDATE users
    SET
      deleted_at      = NOW(),
      display_name    = 'Usuario eliminado',
      bio             = NULL,
      avatar_url      = NULL,
      favorite_genres = NULL
    WHERE id IN (
      SELECT adr.user_id
      FROM account_deletion_requests adr
      WHERE adr.scheduled_delete_at <= NOW()
        AND adr.cancelled_at IS NULL
      AND EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = adr.user_id AND u.deleted_at IS NULL
      )
    )
  $$
);
