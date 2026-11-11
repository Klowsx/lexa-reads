-- Ejecutar SOLO en PostgreSQL local con las migraciones aplicadas. No insertar notificaciones ni llamar net.http_post.
-- Sustituye el secreto por una fixture dentro de la transacción y revierte: no lee ni imprime valores de Vault.
BEGIN;
DO $checks$
DECLARE routine record;
BEGIN
  IF has_function_privilege('anon', 'public.verify_push_webhook_secret(text)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.verify_push_webhook_secret(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'RPC de push expuesta a clientes';
  END IF;
  IF NOT has_function_privilege('service_role', 'public.verify_push_webhook_secret(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Backend sin acceso a la verificación';
  END IF;
  IF (SELECT prosecdef FROM pg_proc WHERE oid = 'public.verify_push_webhook_secret(text)'::regprocedure) THEN
    RAISE EXCEPTION 'La frontera pública debe ser invoker';
  END IF;
  FOR routine IN SELECT prosecdef, proconfig FROM pg_proc WHERE oid IN (
    'lexa_private.verify_push_webhook_secret(text)'::regprocedure,
    'lexa_private.enqueue_notification_push()'::regprocedure
  ) LOOP
    IF NOT routine.prosecdef OR routine.proconfig IS NULL OR NOT ('search_path=""' = ANY(routine.proconfig)) THEN
      RAISE EXCEPTION 'Helper privado sin aislamiento de search_path';
    END IF;
  END LOOP;
  IF has_table_privilege('anon', 'net.http_request_queue', 'SELECT')
     OR has_table_privilege('authenticated', 'net.http_request_queue', 'SELECT') THEN
    RAISE EXCEPTION 'La cola revela headers a clientes';
  END IF;
  IF has_schema_privilege('anon', 'lexa_private', 'USAGE')
     OR has_schema_privilege('authenticated', 'lexa_private', 'USAGE') THEN
    RAISE EXCEPTION 'Esquema privado expuesto';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='enqueue_notification_push'
      AND tgrelid='public.notifications'::regclass AND tgenabled='O' AND NOT tgisinternal) THEN
    RAISE EXCEPTION 'No existe trigger activo de notificaciones';
  END IF;
  PERFORM vault.update_secret((SELECT id FROM vault.secrets WHERE name='lexa_send_push_webhook_secret'), repeat('a',64));
END;
$checks$;

SET LOCAL ROLE anon;
DO $denied$
BEGIN
  BEGIN
    PERFORM public.verify_push_webhook_secret(repeat('a',64));
    RAISE EXCEPTION 'Anon invocó la RPC';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$denied$;
RESET ROLE;
SET LOCAL ROLE service_role;
SELECT set_config('request.jwt.claim.role','service_role',true);
DO $verification$
BEGIN
  IF public.verify_push_webhook_secret(repeat('a',64)) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'No verifica coincidencia exacta';
  END IF;
  IF public.verify_push_webhook_secret(repeat('b',64)) IS DISTINCT FROM false
     OR public.verify_push_webhook_secret(NULL) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'Acepta secreto incorrecto o nulo';
  END IF;
  PERFORM set_config('request.jwt.claim.role','authenticated',true);
  IF public.verify_push_webhook_secret(repeat('a',64)) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'No comprueba rol backend dentro del helper';
  END IF;
END;
$verification$;
ROLLBACK;
