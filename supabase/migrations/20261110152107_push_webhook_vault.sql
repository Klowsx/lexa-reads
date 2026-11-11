-- Prepara push sin exponer credenciales. Desplegar send-push con verify_jwt=false ANTES de aplicar.
CREATE EXTENSION IF NOT EXISTS pg_net;
-- La cola contiene headers descifrados mientras espera al worker: nunca accesible a clientes.
REVOKE ALL ON TABLE net.http_request_queue, net._http_response FROM PUBLIC, anon, authenticated;
CREATE SCHEMA IF NOT EXISTS lexa_private;
REVOKE ALL ON SCHEMA lexa_private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA lexa_private TO service_role;

-- Genera el secreto dentro de Postgres: no se incluye ningún valor en código ni resultados.
DO $setup$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'lexa_send_push_webhook_secret') THEN
    -- Dos UUID v4 criptográficos aportan aproximadamente 244 bits sin depender del esquema de pgcrypto.
    PERFORM vault.create_secret(replace(pg_catalog.gen_random_uuid()::text || pg_catalog.gen_random_uuid()::text, '-', ''), 'lexa_send_push_webhook_secret');
  END IF;
END;
$setup$;

-- Compara un único secreto; incluso el llamador privilegiado solo recibe un booleano.
CREATE OR REPLACE FUNCTION lexa_private.verify_push_webhook_secret(p_secret text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce(auth.role() = 'service_role' AND length(p_secret) BETWEEN 32 AND 512
    AND EXISTS (SELECT 1 FROM vault.decrypted_secrets
      WHERE name = 'lexa_send_push_webhook_secret' AND decrypted_secret = p_secret), false);
$$;
REVOKE ALL ON FUNCTION lexa_private.verify_push_webhook_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION lexa_private.verify_push_webhook_secret(text) TO service_role;

-- La frontera RPC pública es invoker y restringida al proceso backend.
CREATE OR REPLACE FUNCTION public.verify_push_webhook_secret(p_secret text)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT lexa_private.verify_push_webhook_secret(p_secret);
$$;
REVOKE ALL ON FUNCTION public.verify_push_webhook_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_push_webhook_secret(text) TO service_role;

-- Solo los INSERT persistidos generan eventos; el destino fijo evita SSRF y el cuerpo solo lleva el ID.
CREATE OR REPLACE FUNCTION lexa_private.enqueue_notification_push()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE webhook_secret text;
BEGIN
  SELECT decrypted_secret INTO webhook_secret FROM vault.decrypted_secrets
    WHERE name = 'lexa_send_push_webhook_secret';
  IF webhook_secret IS NULL THEN RETURN NEW; END IF;
  PERFORM net.http_post(
    url := 'https://nvgygpsuqltjfexsjwoq.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', webhook_secret),
    body := jsonb_build_object('type', 'INSERT', 'table', 'notifications', 'schema', 'public',
      'record', jsonb_build_object('id', NEW.id)),
    timeout_milliseconds := 5000
  );
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION lexa_private.enqueue_notification_push() FROM PUBLIC, anon, authenticated, service_role;
DROP TRIGGER IF EXISTS enqueue_notification_push ON public.notifications;
CREATE TRIGGER enqueue_notification_push AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION lexa_private.enqueue_notification_push();
