-- Un GRANT de tabla prevalece sobre REVOKE por columna (017/020).
-- Retira escritura directa amplia y reconstruye solo los campos usados por el cliente.
-- No cambia SELECT, DELETE, RLS ni privilegios de service_role/propietarios de funciones.
REVOKE INSERT, UPDATE ON TABLE
  public.users,
  public.account_deletion_requests,
  public.reading_club_members,
  public.conversations,
  public.conversation_members
FROM PUBLIC, anon, authenticated;

-- Borra también concesiones por columna previas: quitar el GRANT de tabla no las elimina.
-- El catálogo se limita a las cinco tablas del cambio; no consulta datos de usuarios.
DO $column_permissions$
DECLARE
  target_table text;
  column_names text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY['users', 'account_deletion_requests', 'reading_club_members', 'conversations', 'conversation_members']
  LOOP
    SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY a.attnum)
    INTO column_names
    FROM pg_catalog.pg_attribute a
    WHERE a.attrelid = format('public.%I', target_table)::regclass
      AND a.attnum > 0 AND NOT a.attisdropped;
    EXECUTE format(
      'REVOKE INSERT (%s), UPDATE (%s) ON TABLE public.%I FROM PUBLIC, anon, authenticated',
      column_names, column_names, target_table
    );
  END LOOP;
END;
$column_permissions$;

-- handle_new_user crea los perfiles con privilegios propios; no hay INSERT desde la app.
-- complete_onboarding es invoker y necesita username/onboarding_completed además del editor.
GRANT UPDATE (
  username, display_name, avatar_url, bio, favorite_genres, is_private,
  reading_goal, reading_goal_year, onboarding_completed, onboarding_step
) ON TABLE public.users TO authenticated;

-- La Edge crea {user_id}; las fechas y marcas de procesamiento son del servidor.
GRANT INSERT (user_id) ON TABLE public.account_deletion_requests TO authenticated;
GRANT UPDATE (cancelled_at) ON TABLE public.account_deletion_requests TO authenticated;

-- joinClubFn inserta solo estas identidades. El trigger calcula member/state y el owner
-- lo inserta handle_new_club como definer; no se permite suministrar role='owner'.
GRANT INSERT (club_id, user_id) ON TABLE public.reading_club_members TO authenticated;

-- ensureDMFn envía el par; los triggers/RPCs calculan solicitud y metadatos privilegiados.
GRANT INSERT (kind, dm_user_low, dm_user_high) ON TABLE public.conversations TO authenticated;

-- El cliente registra participantes y su lectura; no reasigna identidades ni fechas de alta.
GRANT INSERT (conversation_id, user_id) ON TABLE public.conversation_members TO authenticated;
GRANT UPDATE (last_read_at) ON TABLE public.conversation_members TO authenticated;
