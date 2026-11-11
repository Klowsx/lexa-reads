-- Verifica el HMAC desplegado sin cambiar Vault ni insertar notificaciones o solicitudes HTTP.
-- La clave solo se usa dentro de Postgres para firmar un UUID sintético; ningún valor se devuelve.
BEGIN;
SET LOCAL statement_timeout = '10s';
DO $fixture$
DECLARE notification_id uuid := gen_random_uuid(); issued_at bigint := floor(extract(epoch FROM clock_timestamp()))::bigint;
        signature text; expired_signature text; future_signature text;
BEGIN
  SELECT encode(extensions.hmac(notification_id::text || ':' || issued_at::text, decrypted_secret, 'sha256'),'hex'),
    encode(extensions.hmac(notification_id::text || ':' || (issued_at-600)::text, decrypted_secret, 'sha256'),'hex'),
    encode(extensions.hmac(notification_id::text || ':' || (issued_at+120)::text, decrypted_secret, 'sha256'),'hex')
  INTO signature, expired_signature, future_signature
  FROM vault.decrypted_secrets WHERE name='lexa_send_push_webhook_secret';
  IF signature IS NULL THEN RAISE EXCEPTION 'Falta la configuración de firma'; END IF;
  PERFORM set_config('lexa.push_test_id', notification_id::text, true);
  PERFORM set_config('lexa.push_test_epoch', issued_at::text, true);
  PERFORM set_config('lexa.push_test_signature', signature, true);
  PERFORM set_config('lexa.push_test_expired', expired_signature, true);
  PERFORM set_config('lexa.push_test_future', future_signature, true);
END;
$fixture$;
SET LOCAL ROLE service_role;
DO $verification$
DECLARE notification_id uuid := current_setting('lexa.push_test_id')::uuid;
        issued_at bigint := current_setting('lexa.push_test_epoch')::bigint;
        signature text := current_setting('lexa.push_test_signature');
BEGIN
  PERFORM set_config('request.jwt.claim.role','service_role',true);
  IF public.verify_push_webhook_event(notification_id,issued_at,signature) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'El backend no verifica una firma válida';
  END IF;
  IF public.verify_push_webhook_event(gen_random_uuid(),issued_at,signature) IS DISTINCT FROM false
    OR public.verify_push_webhook_event(notification_id,issued_at+1,signature) IS DISTINCT FROM false
    OR public.verify_push_webhook_event(notification_id,issued_at,repeat('b',64)) IS DISTINCT FROM false
    OR public.verify_push_webhook_event(notification_id,issued_at,NULL) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'La verificación acepta un evento adulterado';
  END IF;
  IF public.verify_push_webhook_event(notification_id,issued_at-600,current_setting('lexa.push_test_expired')) IS DISTINCT FROM false
    OR public.verify_push_webhook_event(notification_id,issued_at+120,current_setting('lexa.push_test_future')) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'La verificación acepta un evento fuera de plazo';
  END IF;
  IF has_function_privilege('anon','public.verify_push_webhook_event(uuid,bigint,text)','EXECUTE')
    OR has_function_privilege('authenticated','public.verify_push_webhook_event(uuid,bigint,text)','EXECUTE')
    OR has_function_privilege('service_role','public.verify_push_webhook_secret(text)','EXECUTE') THEN
    RAISE EXCEPTION 'Los permisos permiten una ruta de autenticación indebida';
  END IF;
END;
$verification$;
ROLLBACK;
