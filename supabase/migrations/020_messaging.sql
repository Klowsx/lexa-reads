-- ============================================================
-- Lexa Reads — Migración 020: Mensajería (DMs 1:1 + chat de club)
-- ============================================================
-- Sustrato único: conversations + messages. DM usa conversation_members;
-- el club reutiliza reading_club_members (ya existe). Ver docs/clubs-y-chat.md.
-- Requiere 019 aplicada antes (enums committeados). Aplicar desde SQL Editor
-- (rol postgres) por los REVOKE por columna (mismo patrón anti-escalado de 017).
-- ============================================================

CREATE TYPE conversation_kind AS ENUM ('dm', 'club');
CREATE TYPE dm_request_state  AS ENUM ('open', 'pending');

-- ------------------------------------------------------------
-- 1. Tablas
-- ------------------------------------------------------------

CREATE TABLE conversations (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  kind            conversation_kind NOT NULL,
  club_id         uuid REFERENCES reading_clubs(id) ON DELETE CASCADE,
  -- DM: par ordenado determinista (low < high) → unicidad 1:1
  dm_user_low     uuid REFERENCES users(id) ON DELETE CASCADE,
  dm_user_high    uuid REFERENCES users(id) ON DELETE CASCADE,
  request_state   dm_request_state NOT NULL DEFAULT 'open',
  requested_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  last_message_at timestamptz,
  created_at      timestamptz DEFAULT now(),
  CONSTRAINT conv_shape CHECK (
    (kind = 'club' AND club_id IS NOT NULL AND dm_user_low IS NULL AND dm_user_high IS NULL)
    OR
    (kind = 'dm' AND club_id IS NULL AND dm_user_low IS NOT NULL
      AND dm_user_high IS NOT NULL AND dm_user_low < dm_user_high)
  )
);
CREATE UNIQUE INDEX uq_conversations_dm   ON conversations (dm_user_low, dm_user_high) WHERE kind = 'dm';
CREATE UNIQUE INDEX uq_conversations_club ON conversations (club_id) WHERE kind = 'club';
CREATE INDEX idx_conversations_recent     ON conversations (last_message_at DESC NULLS LAST);

CREATE TABLE conversation_members (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at    timestamptz,
  muted           boolean NOT NULL DEFAULT false,
  archived        boolean NOT NULL DEFAULT false,
  joined_at       timestamptz DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX idx_conv_members_user ON conversation_members (user_id);

-- Hilos de discusión del club (libro del mes / por capítulo). null en messages
-- = canal general. Se crea la tabla ya para no migrar después (UI: Fase 3).
CREATE TABLE club_topics (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id              uuid NOT NULL REFERENCES reading_clubs(id) ON DELETE CASCADE,
  title                varchar(120) NOT NULL,
  kind                 varchar(20)  NOT NULL DEFAULT 'general',  -- 'general' | 'book_discussion'
  book_id              uuid REFERENCES books(id) ON DELETE SET NULL,
  spoiler_after_chapter int,
  created_by           uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at           timestamptz DEFAULT now()
);
CREATE INDEX idx_club_topics_club ON club_topics (club_id);

CREATE TABLE messages (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  topic_id        uuid REFERENCES club_topics(id) ON DELETE CASCADE,
  -- ON DELETE CASCADE: el hard-delete de cuenta (013) borra los mensajes del
  -- usuario → erasure real (GDPR), consistente con la cascada de 013.
  sender_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body            text NOT NULL CHECK (char_length(body) <= 4000),
  reply_to_id     uuid REFERENCES messages(id) ON DELETE SET NULL,  -- "responder a" (reply citado)
  created_at      timestamptz DEFAULT now(),
  edited_at       timestamptz,
  deleted_at      timestamptz
);
CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at, id);

-- Roles/estado de pertenencia al club (role ya existía como varchar 'member').
ALTER TABLE reading_club_members
  ADD COLUMN IF NOT EXISTS state        varchar(20) NOT NULL DEFAULT 'active', -- active|pending|invited|banned
  ADD COLUMN IF NOT EXISTS last_read_at timestamptz;


-- ------------------------------------------------------------
-- 2. Helpers SECURITY DEFINER (search_path fijo → evitan recursión RLS;
--    no repetir el agujero NEW-2 de la auditoría).
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_club_member(club uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM reading_club_members m
    WHERE m.club_id = club AND m.user_id = auth.uid() AND m.state = 'active');
$$;

CREATE OR REPLACE FUNCTION public.is_club_mod(club uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM reading_club_members m
    WHERE m.club_id = club AND m.user_id = auth.uid() AND m.state = 'active'
      AND m.role IN ('owner', 'moderator'));
$$;

CREATE OR REPLACE FUNCTION public.is_conversation_member(conv uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_members cm
    WHERE cm.conversation_id = conv AND cm.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM conversations c
    JOIN reading_club_members m ON m.club_id = c.club_id
    WHERE c.id = conv AND c.kind = 'club' AND m.user_id = auth.uid() AND m.state = 'active'
  );
$$;

-- ¿auth.uid() puede ENVIAR en esta conversación? (miembro, no bloqueado en DM,
-- y respetando la puerta de solicitud de mensaje).
CREATE OR REPLACE FUNCTION public.conversation_send_allowed(conv uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT public.is_conversation_member(conv)
    AND NOT EXISTS (  -- bloqueo bidireccional con la otra parte del DM
      SELECT 1 FROM conversations c WHERE c.id = conv AND c.kind = 'dm'
        AND public.is_blocked_with(CASE WHEN c.dm_user_low = auth.uid()
                                        THEN c.dm_user_high ELSE c.dm_user_low END))
    AND NOT EXISTS (  -- solicitud pendiente → solo el solicitante puede escribir
      SELECT 1 FROM conversations c WHERE c.id = conv AND c.kind = 'dm'
        AND c.request_state = 'pending' AND c.requested_by <> auth.uid());
$$;


-- ------------------------------------------------------------
-- 3. RLS
-- ------------------------------------------------------------
ALTER TABLE conversations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_topics          ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages             ENABLE ROW LEVEL SECURITY;

-- ---- conversations ----
CREATE POLICY "Ver conversaciones propias"
  ON conversations FOR SELECT USING (public.is_conversation_member(id));

-- Crear DM: el creador es uno del par y no hay bloqueo. (Las de club las crea
-- el trigger handle_new_club, SECURITY DEFINER, que bypasa RLS.)
CREATE POLICY "Crear DM siendo participante"
  ON conversations FOR INSERT WITH CHECK (
    kind = 'dm'
    AND auth.uid() IN (dm_user_low, dm_user_high)
    AND NOT public.is_blocked_with(CASE WHEN dm_user_low = auth.uid()
                                        THEN dm_user_high ELSE dm_user_low END)
  );

-- Rechazar solicitud / borrar DM: cualquiera del par. (Aceptar = RPC).
CREATE POLICY "Borrar DM propio"
  ON conversations FOR DELETE USING (kind = 'dm' AND auth.uid() IN (dm_user_low, dm_user_high));

-- request_state/requested_by/last_message_at/par/kind NO los toca el cliente
-- (se computan en triggers/RPCs). Bloqueo por columna (RLS no filtra columnas).
REVOKE UPDATE (request_state, requested_by, dm_user_low, dm_user_high, club_id, kind, last_message_at)
  ON conversations FROM anon, authenticated;

-- ---- conversation_members ----
CREATE POLICY "Ver mi membresía DM"
  ON conversation_members FOR SELECT USING (user_id = auth.uid());

-- Al crear un DM, el creador inserta ambas filas (self + el otro).
CREATE POLICY "Insertar miembros del DM que creo"
  ON conversation_members FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM conversations c
      WHERE c.id = conversation_id AND c.kind = 'dm'
        AND auth.uid() IN (c.dm_user_low, c.dm_user_high)
        AND user_id  IN (c.dm_user_low, c.dm_user_high))
  );

CREATE POLICY "Actualizar mi estado de lectura"
  ON conversation_members FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Salir de mis conversaciones"
  ON conversation_members FOR DELETE USING (user_id = auth.uid());

-- ---- messages ----
-- Leer: miembro de la conversación y NO bloqueado con el autor (oculta mensajes
-- de bloqueados incluso dentro de un club).
CREATE POLICY "Ver mensajes de mis conversaciones"
  ON messages FOR SELECT USING (
    public.is_conversation_member(conversation_id)
    AND NOT public.is_blocked_with(sender_id)
  );

CREATE POLICY "Enviar mensajes permitidos"
  ON messages FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND public.conversation_send_allowed(conversation_id)
  );

-- Editar / soft-borrar: solo el autor. (La moderación de club borra vía RPC.)
CREATE POLICY "Editar mis mensajes"
  ON messages FOR UPDATE USING (sender_id = auth.uid());

-- ---- club_topics ----
CREATE POLICY "Ver hilos de clubes que veo"
  ON club_topics FOR SELECT USING (public.is_club_member(club_id));

CREATE POLICY "Mods gestionan hilos"
  ON club_topics FOR ALL USING (public.is_club_mod(club_id))
  WITH CHECK (public.is_club_mod(club_id));


-- ------------------------------------------------------------
-- 4. reading_clubs / reading_club_members — privacidad y roles
-- ------------------------------------------------------------

-- Clubes privados solo visibles para miembros (públicos para todos).
DROP POLICY IF EXISTS "Clubes públicos visibles para todos" ON reading_clubs;
CREATE POLICY "Clubes visibles según privacidad"
  ON reading_clubs FOR SELECT
  USING (visibility = 'public' OR created_by = auth.uid() OR public.is_club_member(id));

-- Estado/rol al unirse: público → active, privado → pending; invitación de mod → invited.
CREATE OR REPLACE FUNCTION public.set_club_member_state()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE vis text;
BEGIN
  IF NEW.role = 'owner' THEN
    NEW.state := 'active';
    RETURN NEW;
  END IF;
  SELECT visibility::text INTO vis FROM reading_clubs WHERE id = NEW.club_id;
  IF NEW.user_id = auth.uid() THEN
    NEW.role  := 'member';
    NEW.state := CASE WHEN vis = 'public' THEN 'active' ELSE 'pending' END;
  ELSE
    NEW.role  := 'member';
    NEW.state := 'invited';  -- inserción de otro → solo mods (RLS lo valida)
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_set_club_member_state BEFORE INSERT ON reading_club_members
  FOR EACH ROW EXECUTE FUNCTION public.set_club_member_state();

-- Reescribir las policies de 002.
DROP POLICY IF EXISTS "Usuario se une a clubes" ON reading_club_members;
CREATE POLICY "Unirse o invitar a club"
  ON reading_club_members FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_club_mod(club_id));

DROP POLICY IF EXISTS "Usuario sale de clubes o admin gestiona miembros" ON reading_club_members;
CREATE POLICY "Salir del club o mod expulsa"
  ON reading_club_members FOR DELETE
  USING (user_id = auth.uid() OR public.is_club_mod(club_id));

CREATE POLICY "Actualizar mi membresía"
  ON reading_club_members FOR UPDATE USING (user_id = auth.uid());

-- No exponer la lista de miembros de clubes privados a no-miembros.
DROP POLICY IF EXISTS "Miembros de clubes visibles para todos" ON reading_club_members;
CREATE POLICY "Miembros visibles según privacidad del club"
  ON reading_club_members FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM reading_clubs rc WHERE rc.id = club_id AND rc.visibility = 'public')
    OR public.is_club_member(club_id)
  );

-- state/role NO los cambia el cliente directo (evita auto-aprobarse / auto-promover):
-- se mueven vía RPCs SECURITY DEFINER que validan is_club_mod. Mismo patrón NEW-1.
REVOKE UPDATE (state, role) ON reading_club_members FROM anon, authenticated;


-- ------------------------------------------------------------
-- 5. RPCs de moderación / membresía (bypasan los REVOKE por ser DEFINER)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.approve_club_member(p_club uuid, p_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.is_club_mod(p_club) THEN RAISE EXCEPTION 'not a moderator'; END IF;
  UPDATE reading_club_members SET state = 'active'
  WHERE club_id = p_club AND user_id = p_user AND state IN ('pending', 'invited');
END $$;

CREATE OR REPLACE FUNCTION public.accept_club_invite(p_club uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  UPDATE reading_club_members SET state = 'active'
  WHERE club_id = p_club AND user_id = auth.uid() AND state = 'invited';
END $$;

CREATE OR REPLACE FUNCTION public.set_club_member_role(p_club uuid, p_user uuid, p_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.is_club_mod(p_club) THEN RAISE EXCEPTION 'not a moderator'; END IF;
  IF p_role NOT IN ('moderator', 'member') THEN RAISE EXCEPTION 'invalid role'; END IF;
  UPDATE reading_club_members SET role = p_role
  WHERE club_id = p_club AND user_id = p_user AND role <> 'owner';
END $$;

CREATE OR REPLACE FUNCTION public.ban_club_member(p_club uuid, p_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.is_club_mod(p_club) THEN RAISE EXCEPTION 'not a moderator'; END IF;
  DELETE FROM reading_club_members
  WHERE club_id = p_club AND user_id = p_user AND role <> 'owner';
END $$;

-- Aceptar una solicitud de mensaje (la abre el RECEPTOR, no el solicitante).
CREATE OR REPLACE FUNCTION public.accept_message_request(p_conv uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  UPDATE conversations SET request_state = 'open'
  WHERE id = p_conv AND kind = 'dm' AND request_state = 'pending'
    AND auth.uid() IN (dm_user_low, dm_user_high)
    AND requested_by <> auth.uid();
END $$;

-- Soft-delete de un mensaje por un moderador del club.
CREATE OR REPLACE FUNCTION public.mod_delete_message(p_msg uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_club uuid;
BEGIN
  SELECT c.club_id INTO v_club FROM messages mm
  JOIN conversations c ON c.id = mm.conversation_id
  WHERE mm.id = p_msg AND c.kind = 'club';
  IF v_club IS NULL OR NOT public.is_club_mod(v_club) THEN
    RAISE EXCEPTION 'not a moderator';
  END IF;
  UPDATE messages SET deleted_at = now() WHERE id = p_msg;
END $$;


-- ------------------------------------------------------------
-- 6. Triggers
-- ------------------------------------------------------------

-- Al crear un DM, fijar requested_by + request_state según follow mutuo
-- (el cliente NO puede forzar 'open' para saltarse la solicitud).
CREATE OR REPLACE FUNCTION public.set_dm_request_state()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE other uuid; mutual boolean;
BEGIN
  IF NEW.kind <> 'dm' THEN RETURN NEW; END IF;
  NEW.requested_by := auth.uid();
  other := CASE WHEN NEW.dm_user_low = auth.uid() THEN NEW.dm_user_high ELSE NEW.dm_user_low END;
  SELECT EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = auth.uid() AND f.following_id = other AND f.status = 'accepted')
     AND EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = other AND f.following_id = auth.uid() AND f.status = 'accepted')
  INTO mutual;
  NEW.request_state := CASE WHEN mutual THEN 'open' ELSE 'pending' END;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_set_dm_request_state BEFORE INSERT ON conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_dm_request_state();

-- last_message_at desnormalizado (ordenar el inbox sin escanear messages).
CREATE OR REPLACE FUNCTION public.bump_conversation_last_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  UPDATE conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_bump_last_message AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_conversation_last_message();

-- Notificación de DM (el chat de club no notifica por mensaje → ruido; usa badge).
-- El índice de dedupe (018) evita apilar avisos no leídos del mismo emisor.
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE conv conversations%ROWTYPE; recipient uuid; ntype notification_type;
BEGIN
  SELECT * INTO conv FROM conversations WHERE id = NEW.conversation_id;
  IF conv.kind = 'dm' THEN
    recipient := CASE WHEN conv.dm_user_low = NEW.sender_id THEN conv.dm_user_high ELSE conv.dm_user_low END;
    ntype := CASE WHEN conv.request_state = 'pending' THEN 'dm_request'::notification_type
                  ELSE 'dm_message'::notification_type END;
    INSERT INTO notifications (recipient_id, actor_id, type, reference_id, reference_type)
    VALUES (recipient, NEW.sender_id, ntype, conv.id, 'conversation')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_new_message AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- Al crear un club: alta del creador como owner + crear su conversación de chat.
CREATE OR REPLACE FUNCTION public.handle_new_club()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO reading_club_members (club_id, user_id, role, state)
  VALUES (NEW.id, NEW.created_by, 'owner', 'active')
  ON CONFLICT (club_id, user_id) DO NOTHING;
  INSERT INTO conversations (kind, club_id) VALUES ('club', NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_handle_new_club AFTER INSERT ON reading_clubs
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_club();


-- ------------------------------------------------------------
-- 7. Realtime: publicar `messages` para la suscripción del cliente
-- ------------------------------------------------------------
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;  -- ya está en la publicación
  WHEN undefined_object THEN NULL;  -- la publicación aún no existe (entorno sin realtime)
END $$;
