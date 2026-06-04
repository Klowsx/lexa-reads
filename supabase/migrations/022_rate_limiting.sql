-- ============================================================
-- Lexa Reads — Migración 022: Antiabuso / rate-limiting
-- ============================================================
-- App social con DMs sin límites = imán de spam. Estos límites se aplican en la
-- DB (trigger) → no se pueden saltar desde el cliente. Umbrales generosos para
-- humanos, letales para bots. Aplicar desde SQL Editor (rol postgres).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Límite de frecuencia de MENSAJES por emisor
--    25 mensajes / 60 s (DM + club). Un humano nunca lo alcanza; un bot sí.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_message_rate_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE recent int;
BEGIN
  SELECT count(*) INTO recent
  FROM messages
  WHERE sender_id = NEW.sender_id
    AND created_at > now() - interval '60 seconds';
  IF recent >= 25 THEN
    RAISE EXCEPTION 'Vas demasiado rápido. Espera un momento antes de enviar más mensajes.'
      USING errcode = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_message_rate_limit BEFORE INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION public.enforce_message_rate_limit();

-- ------------------------------------------------------------
-- 2. Límite de creación de DMs (anti mass-DM / spam de solicitudes)
--    20 conversaciones nuevas / hora donde el usuario participa.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_dm_rate_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE recent int;
BEGIN
  IF NEW.kind <> 'dm' THEN RETURN NEW; END IF;
  SELECT count(*) INTO recent
  FROM conversations
  WHERE kind = 'dm'
    AND created_at > now() - interval '1 hour'
    AND (dm_user_low = auth.uid() OR dm_user_high = auth.uid());
  IF recent >= 20 THEN
    RAISE EXCEPTION 'Has iniciado demasiadas conversaciones nuevas. Inténtalo más tarde.'
      USING errcode = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

-- Nombre con prefijo que ordene ANTES de trg_set_dm_request_state no importa:
-- ambos son BEFORE INSERT independientes.
CREATE TRIGGER trg_dm_rate_limit BEFORE INSERT ON conversations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_dm_rate_limit();

-- ------------------------------------------------------------
-- 3. Limitador genérico para Edge Functions (ventana fija)
--    Las functions llaman a hit_rate_limit(); true = permitido, false = limitado.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limits (
  key          text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  count        int NOT NULL DEFAULT 0
);
-- Solo accesible vía el RPC SECURITY DEFINER: RLS activa sin policies = denegado a clientes.
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.hit_rate_limit(
  p_key text,
  p_max int,
  p_window_seconds int
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE rec rate_limits%ROWTYPE;
BEGIN
  SELECT * INTO rec FROM rate_limits WHERE key = p_key FOR UPDATE;
  IF rec.key IS NULL THEN
    INSERT INTO rate_limits(key, window_start, count) VALUES (p_key, now(), 1)
    ON CONFLICT (key) DO UPDATE SET count = rate_limits.count + 1;
    RETURN true;
  END IF;
  IF rec.window_start < now() - make_interval(secs => p_window_seconds) THEN
    UPDATE rate_limits SET window_start = now(), count = 1 WHERE key = p_key;
    RETURN true;
  END IF;
  IF rec.count >= p_max THEN
    RETURN false;
  END IF;
  UPDATE rate_limits SET count = count + 1 WHERE key = p_key;
  RETURN true;
END $$;
