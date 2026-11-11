-- Regresión de permisos de columnas con dos cuentas/una conversación sintéticas y rollback.
-- No envía mensajes ni crea follows/notificaciones; todas las lecturas se filtran por sus UUID.
BEGIN;
SET LOCAL statement_timeout = '15s';
SET LOCAL lock_timeout = '3s';
DO $$
DECLARE actor uuid := gen_random_uuid(); other_actor uuid := gen_random_uuid(); conv uuid := gen_random_uuid();
BEGIN
  PERFORM set_config('lexa.column_actor', actor::text, true);
  PERFORM set_config('lexa.column_other', other_actor::text, true);
  PERFORM set_config('lexa.column_conversation', conv::text, true);
  INSERT INTO auth.users(id) VALUES(actor), (other_actor);
  PERFORM set_config('request.jwt.claim.sub', actor::text, true);
  INSERT INTO public.conversations(id, kind, dm_user_low, dm_user_high)
  VALUES(conv, 'dm', least(actor, other_actor), greatest(actor, other_actor));
  INSERT INTO public.conversation_members(conversation_id, user_id)
  VALUES(conv, actor);
END;
$$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('lexa.column_actor'), true);
DO $$
DECLARE conv uuid := current_setting('lexa.column_conversation')::uuid;
BEGIN
  -- Mantiene la escritura real de markConversationReadFn con RLS y el GRANT limitado.
  UPDATE public.conversation_members SET last_read_at = now() WHERE conversation_id = conv AND user_id = auth.uid();
  IF NOT FOUND OR NOT EXISTS (
    SELECT 1 FROM public.conversation_members WHERE conversation_id = conv AND user_id = auth.uid() AND last_read_at = now()
  ) THEN RAISE EXCEPTION 'El miembro no pudo actualizar su lectura'; END IF;

  BEGIN
    UPDATE public.conversation_members SET conversation_id = gen_random_uuid() WHERE conversation_id = conv AND user_id = auth.uid();
    RAISE EXCEPTION 'El cliente pudo escribir conversation_id';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    UPDATE public.conversation_members SET user_id = current_setting('lexa.column_other')::uuid WHERE conversation_id = conv AND user_id = auth.uid();
    RAISE EXCEPTION 'El cliente pudo escribir user_id';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    -- El segundo participante aún no existe: la fila sería válida salvo la columna prohibida.
    INSERT INTO public.conversation_members(conversation_id, user_id, last_read_at)
    VALUES(conv, current_setting('lexa.column_other')::uuid, now());
    RAISE EXCEPTION 'El cliente pudo insertar last_read_at';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  -- Mantiene el alta real del segundo participante que efectúa ensureDMFn.
  INSERT INTO public.conversation_members(conversation_id, user_id)
  VALUES(conv, current_setting('lexa.column_other')::uuid);
  IF NOT FOUND THEN RAISE EXCEPTION 'El cliente no pudo registrar al segundo participante'; END IF;
END;
$$;
ROLLBACK;
