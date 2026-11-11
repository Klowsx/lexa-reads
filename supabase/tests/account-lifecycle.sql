-- Ejecutar completo en una sola conexión privilegiada y detenerse ante el primer error.
-- Solo usa UUID sintéticos de esta transacción; no invoca Edge, GoTrue, cron ni notificaciones.
-- Complementa onboarding-flow.sql y profile-privacy.sql; no sustituye pruebas HTTP de sesión/export.
BEGIN;
SET LOCAL statement_timeout = '15s';
SET LOCAL lock_timeout = '3s';

-- Crea dos cuentas sin correo/contraseña ni sesiones y comprueba el trigger real del perfil.
DO $$
DECLARE actor uuid := gen_random_uuid(); stranger uuid := gen_random_uuid();
BEGIN
  PERFORM set_config('lexa.account_actor', actor::text, true);
  PERFORM set_config('lexa.account_stranger', stranger::text, true);
  INSERT INTO auth.users(id, raw_user_meta_data)
  VALUES (actor, '{"display_name":"Cuenta transaccional A"}'::jsonb),
         (stranger, '{"display_name":"Cuenta transaccional B","is_admin":true}'::jsonb);
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = actor AND display_name = 'Cuenta transaccional A') THEN
    RAISE EXCEPTION 'El trigger no creó la identidad del registro';
  END IF;
  IF EXISTS (SELECT 1 FROM public.users WHERE id = stranger AND is_admin) THEN
    RAISE EXCEPTION 'Los metadatos editables concedieron administración';
  END IF;
END;
$$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('lexa.account_actor'), true);

-- Consulta metadatos de permisos; no ejecuta la función que procesa cuentas vencidas.
DO $$
BEGIN
  IF has_function_privilege(current_user, 'public.hard_delete_due_accounts()', 'EXECUTE') THEN
    RAISE EXCEPTION 'Authenticated puede ejecutar el borrado global';
  END IF;
END;
$$;

-- Guarda campos del editor y bloquea escrituras de otra identidad o columnas privilegiadas.
DO $$
DECLARE actor uuid := auth.uid(); stranger uuid := current_setting('lexa.account_stranger')::uuid;
BEGIN
  UPDATE public.users SET display_name = 'Identidad editada', bio = 'Borrador privado',
    favorite_genres = ARRAY['fantasia', 'clasico'], is_private = true WHERE id = actor;
  IF NOT FOUND OR NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = actor AND display_name = 'Identidad editada'
      AND bio = 'Borrador privado' AND favorite_genres = ARRAY['fantasia', 'clasico'] AND is_private
  ) THEN RAISE EXCEPTION 'El editor no pudo persistir sus campos'; END IF;
  UPDATE public.users SET bio = 'Escritura ajena' WHERE id = stranger;
  IF FOUND THEN RAISE EXCEPTION 'RLS permitió editar otro perfil'; END IF;
  BEGIN
    UPDATE public.users SET is_admin = true WHERE id = actor;
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  -- Verifica el efecto real: un trigger podría descartar una escritura sin lanzar error.
  IF EXISTS (SELECT 1 FROM public.users WHERE id = actor AND is_admin) THEN
    RAISE EXCEPTION 'El cliente pudo persistir is_admin';
  END IF;
  BEGIN
    UPDATE public.users SET followers_count = 9999 WHERE id = actor;
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  IF EXISTS (SELECT 1 FROM public.users WHERE id = actor AND followers_count = 9999) THEN
    RAISE EXCEPTION 'El cliente pudo persistir contadores falsos';
  END IF;
END;
$$;

-- Comprueba la solicitud de eliminación real: dueño, plazo, duplicados y campos inmutables.
DO $$
DECLARE request public.account_deletion_requests;
BEGIN
  INSERT INTO public.account_deletion_requests(user_id) VALUES(auth.uid()) RETURNING * INTO request;
  PERFORM set_config('lexa.account_request', request.id::text, true);
  IF request.requested_at IS NULL OR request.scheduled_delete_at <> request.requested_at + interval '30 days'
    OR request.cancelled_at IS NOT NULL OR request.processed_at IS NOT NULL THEN
    RAISE EXCEPTION 'La solicitud no conserva la gracia de 30 días';
  END IF;
  BEGIN
    INSERT INTO public.account_deletion_requests(user_id) VALUES(auth.uid());
    RAISE EXCEPTION 'Se duplicó una solicitud activa';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO public.account_deletion_requests(user_id)
    VALUES(current_setting('lexa.account_stranger')::uuid);
    RAISE EXCEPTION 'Se pudo solicitar el borrado ajeno';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    UPDATE public.account_deletion_requests SET scheduled_delete_at = now() WHERE id = request.id;
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  IF EXISTS (SELECT 1 FROM public.account_deletion_requests WHERE id = request.id AND scheduled_delete_at IS DISTINCT FROM request.scheduled_delete_at) THEN
    RAISE EXCEPTION 'El cliente pudo persistir otra fecha de borrado';
  END IF;
  BEGIN
    UPDATE public.account_deletion_requests SET processed_at = now() WHERE id = request.id;
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  IF EXISTS (SELECT 1 FROM public.account_deletion_requests WHERE id = request.id AND processed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'El cliente pudo persistir una solicitud como procesada';
  END IF;
END;
$$;

SELECT set_config('request.jwt.claim.sub', current_setting('lexa.account_stranger'), true);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.account_deletion_requests WHERE id = current_setting('lexa.account_request')::uuid) THEN
    RAISE EXCEPTION 'Otro usuario leyó la solicitud';
  END IF;
  UPDATE public.account_deletion_requests SET cancelled_at = now() WHERE id = current_setting('lexa.account_request')::uuid;
  IF FOUND THEN RAISE EXCEPTION 'Otro usuario canceló la solicitud'; END IF;
END;
$$;

SELECT set_config('request.jwt.claim.sub', current_setting('lexa.account_actor'), true);
DO $$
BEGIN
  UPDATE public.account_deletion_requests SET cancelled_at = now() WHERE id = current_setting('lexa.account_request')::uuid;
  IF NOT FOUND THEN RAISE EXCEPTION 'El dueño no pudo cancelar'; END IF;
  INSERT INTO public.account_deletion_requests(user_id) VALUES(auth.uid());
  IF (SELECT count(*) FROM public.account_deletion_requests WHERE user_id = auth.uid() AND cancelled_at IS NULL AND processed_at IS NULL) <> 1 THEN
    RAISE EXCEPTION 'Reabrir tras cancelar no dejó exactamente una solicitud activa';
  END IF;
  INSERT INTO public.user_blocks(blocker_id, blocked_id)
  VALUES(auth.uid(), current_setting('lexa.account_stranger')::uuid);
  IF NOT EXISTS (SELECT 1 FROM public.list_my_blocked_users() WHERE blocked_id = current_setting('lexa.account_stranger')::uuid) THEN
    RAISE EXCEPTION 'El RPC no muestra el bloqueo propio';
  END IF;
  IF EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('lexa.account_stranger')::uuid) THEN
    RAISE EXCEPTION 'El bloqueo no ocultó la identidad ajena';
  END IF;
END;
$$;

SELECT set_config('request.jwt.claim.sub', current_setting('lexa.account_stranger'), true);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.list_my_blocked_users() WHERE blocked_id = auth.uid()) THEN
    RAISE EXCEPTION 'El RPC reveló quién bloqueó al consultante';
  END IF;
  IF EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('lexa.account_actor')::uuid) THEN
    RAISE EXCEPTION 'El bloqueo no ocultó la identidad del bloqueador';
  END IF;
END;
$$;

SELECT set_config('request.jwt.claim.sub', current_setting('lexa.account_actor'), true);
DO $$
BEGIN
  DELETE FROM public.user_blocks WHERE blocker_id = auth.uid() AND blocked_id = current_setting('lexa.account_stranger')::uuid;
  IF NOT FOUND THEN RAISE EXCEPTION 'El dueño no pudo desbloquear'; END IF;
  IF EXISTS (SELECT 1 FROM public.list_my_blocked_users() WHERE blocked_id = current_setting('lexa.account_stranger')::uuid) THEN
    RAISE EXCEPTION 'El RPC conservó el bloqueo eliminado';
  END IF;
END;
$$;

-- No ejecuta el trabajo global: aun con rollback podría tocar cuentas reales y bloquear filas.
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', true);
DO $$
BEGIN
  IF has_function_privilege(current_user, 'public.list_my_blocked_users()', 'EXECUTE') THEN
    RAISE EXCEPTION 'Anon tiene acceso al RPC de bloqueos';
  END IF;
  IF has_function_privilege(current_user, 'public.hard_delete_due_accounts()', 'EXECUTE') THEN
    RAISE EXCEPTION 'Anon puede ejecutar el borrado global';
  END IF;
END;
$$;

RESET ROLE;
-- Verifica cascada y auditoría solo de la cuenta sintética, sin llamar al cron global.
DO $$
DECLARE actor uuid := current_setting('lexa.account_actor')::uuid;
BEGIN
  DELETE FROM auth.users WHERE id = actor;
  IF EXISTS (SELECT 1 FROM public.users WHERE id = actor) THEN RAISE EXCEPTION 'El borrado no eliminó el perfil'; END IF;
  IF EXISTS (SELECT 1 FROM public.notification_preferences WHERE user_id = actor) THEN RAISE EXCEPTION 'El borrado no eliminó preferencias'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.account_deletion_requests WHERE id = current_setting('lexa.account_request')::uuid AND user_id IS NULL) THEN
    RAISE EXCEPTION 'La auditoría no quedó anonimizada';
  END IF;
END;
$$;
ROLLBACK;
