-- Contrato local de getOrCreateDMFn: INSERT conversations RETURNING id antes de insertar miembros.
-- Ejecutar completo en una conexión LOCAL con migraciones aplicadas y ON_ERROR_STOP.
-- Solo UUID sintéticos, sin mensajes, notificaciones, solicitudes HTTP ni borrados de cuenta.
-- En la policy original de 020 este contrato debe fallar en INSERT ... RETURNING por RLS.
BEGIN;
SET LOCAL statement_timeout = '15s';
SET LOCAL lock_timeout = '3s';
DO $setup$
DECLARE a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); outsider uuid := gen_random_uuid();
BEGIN
  PERFORM set_config('lexa.dm_low', least(a,b)::text, true);
  PERFORM set_config('lexa.dm_high', greatest(a,b)::text, true);
  PERFORM set_config('lexa.dm_outsider', outsider::text, true);
  INSERT INTO auth.users(id) VALUES (a), (b), (outsider);
END;
$setup$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('lexa.dm_low'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

-- Reproduce la misma escritura con RETURNING que exige .insert(...).select('id').single().
-- Si falla, no existe todavía ningún miembro que pueda satisfacer is_conversation_member(id).
DO $create_dm$
DECLARE conv uuid;
BEGIN
  INSERT INTO public.conversations(kind, dm_user_low, dm_user_high)
  VALUES ('dm', current_setting('lexa.dm_low')::uuid, current_setting('lexa.dm_high')::uuid)
  RETURNING id INTO conv;
  IF conv IS NULL THEN RAISE EXCEPTION 'El contrato no devolvió la conversación creada'; END IF;
  PERFORM set_config('lexa.dm_conversation', conv::text, true);
  IF public.is_conversation_member(conv) THEN
    RAISE EXCEPTION 'La fixture esperaba el paso previo a insertar miembros';
  END IF;
  INSERT INTO public.conversation_members(conversation_id, user_id)
  VALUES (conv, current_setting('lexa.dm_low')::uuid), (conv, current_setting('lexa.dm_high')::uuid);
  IF NOT public.is_conversation_member(conv) THEN RAISE EXCEPTION 'No persistió la membresía propia'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.conversations WHERE id=conv AND request_state='pending' AND requested_by=auth.uid()) THEN
    RAISE EXCEPTION 'El cliente o la fixture omitieron la puerta real de solicitud';
  END IF;
END;
$create_dm$;

-- La ampliación de lectura para arrancar un DM nunca permite que un tercero lo descubra.
SELECT set_config('request.jwt.claim.sub', current_setting('lexa.dm_outsider'), true);
DO $outsider$
BEGIN
  IF EXISTS (SELECT 1 FROM public.conversations WHERE id=current_setting('lexa.dm_conversation')::uuid) THEN
    RAISE EXCEPTION 'Un tercero puede descubrir el DM';
  END IF;
  BEGIN
    INSERT INTO public.conversation_members(conversation_id,user_id)
    VALUES (current_setting('lexa.dm_conversation')::uuid,auth.uid());
    RAISE EXCEPTION 'Un tercero pudo añadirse al DM';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$outsider$;

-- La otra parte encuentra el mismo par y sigue sin poder enviar antes de aceptar la solicitud.
SELECT set_config('request.jwt.claim.sub', current_setting('lexa.dm_high'), true);
DO $recipient$
BEGIN
  IF (SELECT count(*) FROM public.conversations WHERE kind='dm'
      AND dm_user_low=current_setting('lexa.dm_low')::uuid AND dm_user_high=auth.uid()) <> 1 THEN
    RAISE EXCEPTION 'El receptor no encuentra el par canónico';
  END IF;
  IF public.conversation_send_allowed(current_setting('lexa.dm_conversation')::uuid) THEN
    RAISE EXCEPTION 'El receptor puede enviar sin aceptar la solicitud';
  END IF;
END;
$recipient$;
ROLLBACK;
