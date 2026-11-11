-- Deployar primero el handler HMAC. Durante la transición los eventos antiguos fallan cerrado.
-- No intenta alterar ACL de objetos administrados: la cola pasa a contener solo firmas ligadas a ID/fecha.
-- pgcrypto está instalado en extensions; no se mueve ninguna extensión ni se asume otro rol.
DO $rotate$
BEGIN
  PERFORM vault.update_secret(
    (SELECT id FROM vault.secrets WHERE name='lexa_send_push_webhook_secret'),
    replace(pg_catalog.gen_random_uuid()::text || pg_catalog.gen_random_uuid()::text, '-', '')
  );
END;
$rotate$;

-- Solo el backend comprueba HMAC. La clave permanece dentro de Vault y no se devuelve al llamador.
CREATE OR REPLACE FUNCTION lexa_private.verify_push_webhook_event(
  p_notification_id uuid, p_issued_at bigint, p_signature text
)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT coalesce(
    auth.role()='service_role'
    AND p_signature ~ '^[0-9a-f]{64}$'
    AND p_issued_at BETWEEN extract(epoch FROM statement_timestamp())::bigint - 300
                        AND extract(epoch FROM statement_timestamp())::bigint + 30
    AND EXISTS (
      SELECT 1 FROM vault.decrypted_secrets
      WHERE name='lexa_send_push_webhook_secret'
        AND encode(extensions.hmac(p_notification_id::text || ':' || p_issued_at::text,
                                  decrypted_secret, 'sha256'), 'hex')=p_signature
    ), false
  );
$$;
REVOKE ALL ON FUNCTION lexa_private.verify_push_webhook_event(uuid,bigint,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION lexa_private.verify_push_webhook_event(uuid,bigint,text) TO service_role;
CREATE OR REPLACE FUNCTION public.verify_push_webhook_event(
  p_notification_id uuid, p_issued_at bigint, p_signature text
)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
  SELECT lexa_private.verify_push_webhook_event(p_notification_id,p_issued_at,p_signature);
$$;
REVOKE ALL ON FUNCTION public.verify_push_webhook_event(uuid,bigint,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.verify_push_webhook_event(uuid,bigint,text) TO service_role;

-- Revoca también service_role: la credencial histórica deja de autenticar incluso si quedó en una cola antigua.
REVOKE ALL ON FUNCTION public.verify_push_webhook_secret(text) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION lexa_private.verify_push_webhook_secret(text) FROM PUBLIC,anon,authenticated,service_role;

-- Reemplaza el productor sin tocar el trigger: solo firma el ID real y el instante de encolado.
CREATE OR REPLACE FUNCTION lexa_private.enqueue_notification_push()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE signing_key text; issued_at bigint; signature text;
BEGIN
  SELECT decrypted_secret INTO signing_key FROM vault.decrypted_secrets
    WHERE name='lexa_send_push_webhook_secret';
  IF signing_key IS NULL THEN RETURN NEW; END IF;
  issued_at := floor(extract(epoch FROM clock_timestamp()))::bigint;
  signature := encode(extensions.hmac(NEW.id::text || ':' || issued_at::text, signing_key, 'sha256'), 'hex');
  PERFORM net.http_post(
    url := 'https://nvgygpsuqltjfexsjwoq.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type','application/json',
      'x-push-signature',signature,'x-push-issued-at',issued_at::text),
    body := jsonb_build_object('type','INSERT','table','notifications','schema','public',
      'record',jsonb_build_object('id',NEW.id)),
    timeout_milliseconds := 5000
  );
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION lexa_private.enqueue_notification_push() FROM PUBLIC,anon,authenticated,service_role;
