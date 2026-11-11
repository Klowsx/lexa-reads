-- SOLO PostgreSQL local con migraciones aplicadas. No inserta notificaciones ni invoca HTTP.
-- La fixture usa clave sintética transaccional sin leer ni imprimir el secreto real; termina en ROLLBACK.
BEGIN;
DO $checks$
DECLARE routine record;
BEGIN
  IF has_function_privilege('anon','public.verify_push_webhook_event(uuid,bigint,text)','EXECUTE')
     OR has_function_privilege('authenticated','public.verify_push_webhook_event(uuid,bigint,text)','EXECUTE') THEN
    RAISE EXCEPTION 'RPC de firma expuesta a clientes';
  END IF;
  IF NOT has_function_privilege('service_role','public.verify_push_webhook_event(uuid,bigint,text)','EXECUTE') THEN
    RAISE EXCEPTION 'Backend sin acceso a verificación HMAC';
  END IF;
  IF has_function_privilege('service_role','public.verify_push_webhook_secret(text)','EXECUTE') THEN
    RAISE EXCEPTION 'La credencial histórica todavía autentica';
  END IF;
  IF (SELECT prosecdef FROM pg_proc WHERE oid='public.verify_push_webhook_event(uuid,bigint,text)'::regprocedure) THEN
    RAISE EXCEPTION 'La frontera pública debe ser invoker';
  END IF;
  FOR routine IN SELECT prosecdef,proconfig FROM pg_proc WHERE oid IN (
    'lexa_private.verify_push_webhook_event(uuid,bigint,text)'::regprocedure,
    'lexa_private.enqueue_notification_push()'::regprocedure
  ) LOOP
    IF NOT routine.prosecdef OR routine.proconfig IS NULL OR NOT ('search_path=""'=ANY(routine.proconfig)) THEN
      RAISE EXCEPTION 'Helper privado sin aislamiento';
    END IF;
  END LOOP;
  IF has_schema_privilege('anon','lexa_private','USAGE') OR has_schema_privilege('authenticated','lexa_private','USAGE') THEN
    RAISE EXCEPTION 'Esquema privado expuesto';
  END IF;
  IF position('x-webhook-secret' IN pg_get_functiondef('lexa_private.enqueue_notification_push()'::regprocedure))>0 THEN
    RAISE EXCEPTION 'El productor todavía incluye la credencial en la cola';
  END IF;
  PERFORM vault.update_secret((SELECT id FROM vault.secrets WHERE name='lexa_send_push_webhook_secret'),repeat('a',64));
END;
$checks$;
SET LOCAL ROLE anon;
DO $denied$
BEGIN
  BEGIN
    PERFORM public.verify_push_webhook_event(gen_random_uuid(),0,repeat('b',64));
    RAISE EXCEPTION 'Anon invocó la RPC';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$denied$;
RESET ROLE;
SET LOCAL ROLE service_role;
DO $verification$
DECLARE notification_id uuid:=gen_random_uuid(); issued_at bigint:=floor(extract(epoch FROM clock_timestamp()))::bigint; signature text;
BEGIN
  PERFORM set_config('request.jwt.claim.role','service_role',true);
  signature:=encode(extensions.hmac(notification_id::text || ':' || issued_at::text,repeat('a',64),'sha256'),'hex');
  IF public.verify_push_webhook_event(notification_id,issued_at,signature) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'No verifica el evento firmado';
  END IF;
  IF public.verify_push_webhook_event(gen_random_uuid(),issued_at,signature) IS DISTINCT FROM false
     OR public.verify_push_webhook_event(notification_id,issued_at+1,signature) IS DISTINCT FROM false
     OR public.verify_push_webhook_event(notification_id,issued_at,repeat('b',64)) IS DISTINCT FROM false
     OR public.verify_push_webhook_event(notification_id,issued_at,NULL) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'Acepta ID, fecha o firma adulterados';
  END IF;
  -- Incluso una firma correcta queda invalidada al caducar o anticiparse demasiado.
  signature:=encode(extensions.hmac(notification_id::text || ':' || (issued_at-600)::text,repeat('a',64),'sha256'),'hex');
  IF public.verify_push_webhook_event(notification_id,issued_at-600,signature) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'Acepta un evento caducado';
  END IF;
  signature:=encode(extensions.hmac(notification_id::text || ':' || (issued_at+120)::text,repeat('a',64),'sha256'),'hex');
  IF public.verify_push_webhook_event(notification_id,issued_at+120,signature) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'Acepta un evento futuro';
  END IF;
  signature:=encode(extensions.hmac(notification_id::text || ':' || issued_at::text,repeat('a',64),'sha256'),'hex');
  PERFORM set_config('request.jwt.claim.role','authenticated',true);
  IF public.verify_push_webhook_event(notification_id,issued_at,signature) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'No revalida rol backend';
  END IF;
END;
$verification$;
ROLLBACK;
