-- getOrCreateDMFn necesita leer RETURNING id antes de insertar conversation_members.
-- La lectura previa solo expone metadatos del par DM a sus participantes activos y sin bloqueo.
-- Conserva la policy de miembros existente y no amplía permisos para leer/enviar mensajes.
CREATE POLICY "Participantes activos leen metadatos de su DM"
  ON public.conversations FOR SELECT TO authenticated
  USING (
    kind = 'dm'
    AND auth.uid() IN (dm_user_low, dm_user_high)
    AND NOT public.is_blocked_with(
      CASE WHEN dm_user_low = auth.uid() THEN dm_user_high ELSE dm_user_low END
    )
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = conversations.dm_user_low AND u.deleted_at IS NULL
    )
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = conversations.dm_user_high AND u.deleted_at IS NULL
    )
  );
