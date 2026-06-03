-- ============================================================
-- Lexa Reads — Migración 013: Hard-delete REAL de cuentas (C-1)
-- ============================================================
-- Problema (auditoría C-1): el cron de 010 solo ANONIMIZABA la fila `users`
-- (deleted_at + scrub de perfil). No borraba el contenido del usuario
-- (`reviews.body`, `comments.body`, `user_books`, `lists`) ni la fila
-- `auth.users` (el email quedaba retenido para siempre → no se podía
-- re-registrar), y nunca marcaba la solicitud como procesada. Eso NO cumple
-- el "derecho al olvido" (GDPR/CCPA) ni la promesa de hard-delete de tiendas.
--
-- Fix: borrar de verdad. Como `users.id REFERENCES auth.users(id) ON DELETE
-- CASCADE` y todo el contenido del usuario referencia `users(id)` con
-- ON DELETE CASCADE, basta con `DELETE FROM auth.users` para que caigan en
-- cascada users → reviews, comments, user_books, lists, follows, likes, etc.
-- Esto libera el email y elimina el contenido. Se conserva un registro
-- ANONIMIZADO de la solicitud (sin user_id) como prueba de cumplimiento.
--
-- Debe aplicarse desde el SQL Editor (rol `postgres`) para que la función
-- SECURITY DEFINER tenga privilegios de DELETE sobre `auth.users`.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Marca de procesamiento + conservar la solicitud como audit trail
-- ------------------------------------------------------------
ALTER TABLE account_deletion_requests
  ADD COLUMN IF NOT EXISTS processed_at timestamptz;

-- Para que la fila de la solicitud SOBREVIVA al borrado del usuario (audit de
-- compliance sin PII), su FK pasa de CASCADE a SET NULL y user_id se vuelve nullable.
ALTER TABLE account_deletion_requests ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE account_deletion_requests
  DROP CONSTRAINT IF EXISTS account_deletion_requests_user_id_fkey;
ALTER TABLE account_deletion_requests
  ADD CONSTRAINT account_deletion_requests_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;


-- ------------------------------------------------------------
-- 2. Función de hard-delete de cuentas vencidas
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hard_delete_due_accounts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  due_ids uuid[];
BEGIN
  -- Solicitudes vencidas, no canceladas y aún no procesadas
  SELECT array_agg(user_id) INTO due_ids
  FROM account_deletion_requests
  WHERE scheduled_delete_at <= now()
    AND cancelled_at IS NULL
    AND processed_at IS NULL
    AND user_id IS NOT NULL;

  IF due_ids IS NULL THEN
    RETURN;
  END IF;

  -- Marcar procesadas ANTES del borrado (idempotencia si algo falla a mitad).
  UPDATE account_deletion_requests
  SET processed_at = now()
  WHERE user_id = ANY(due_ids)
    AND cancelled_at IS NULL
    AND processed_at IS NULL;

  -- Borrado real: cascada auth.users → users → reviews/comments/user_books/
  -- lists/follows/likes/notifications/... El FK SET NULL deja la solicitud
  -- como registro anonimizado (user_id = NULL) para prueba de cumplimiento.
  DELETE FROM auth.users WHERE id = ANY(due_ids);
END;
$$;


-- ------------------------------------------------------------
-- 3. Reprogramar el cron para llamar a la función (reemplaza el de 010)
-- ------------------------------------------------------------
SELECT cron.unschedule('lexa-hard-delete-accounts')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'lexa-hard-delete-accounts');

SELECT cron.schedule(
  'lexa-hard-delete-accounts',
  '0 3 * * *',
  $$ SELECT public.hard_delete_due_accounts(); $$
);
</content>
