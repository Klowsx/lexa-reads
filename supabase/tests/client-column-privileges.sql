-- Solo metadatos: no crea fixtures, modifica filas ni invoca RPCs de negocio.
-- Verifica privilegios efectivos, incluida la herencia de PUBLIC, sin depender de RLS.
BEGIN READ ONLY;
DO $client_column_privileges$
DECLARE
  target record;
  column_record record;
  checked_role text;
  checked_operation text;
  allowed_columns text[];
  expected boolean;
  actual boolean;
BEGIN
  FOR target IN
    SELECT * FROM (VALUES
      (
        'public.users'::regclass,
        ARRAY[]::text[],
        ARRAY[
          'username', 'display_name', 'avatar_url', 'bio', 'favorite_genres',
          'is_private', 'reading_goal', 'reading_goal_year',
          'onboarding_completed', 'onboarding_step'
        ]::text[]
      ),
      (
        'public.account_deletion_requests'::regclass,
        ARRAY['user_id']::text[],
        ARRAY['cancelled_at']::text[]
      ),
      (
        'public.reading_club_members'::regclass,
        ARRAY['club_id', 'user_id']::text[],
        ARRAY[]::text[]
      ),
      (
        'public.conversations'::regclass,
        ARRAY['kind', 'dm_user_low', 'dm_user_high']::text[],
        ARRAY[]::text[]
      ),
      (
        'public.conversation_members'::regclass,
        ARRAY['conversation_id', 'user_id']::text[],
        ARRAY['last_read_at']::text[]
      )
    ) AS permissions(table_id, insert_columns, update_columns)
  LOOP
    -- Un permiso de tabla volvería a habilitar todas las columnas, aunque exista REVOKE parcial.
    FOREACH checked_role IN ARRAY ARRAY['anon', 'authenticated']
    LOOP
      FOREACH checked_operation IN ARRAY ARRAY['INSERT', 'UPDATE']
      LOOP
        IF has_table_privilege(checked_role, target.table_id, checked_operation) THEN
          RAISE EXCEPTION 'Permiso de tabla inesperado: rol=%, tabla=%, operación=%',
            checked_role, target.table_id, checked_operation;
        END IF;
        allowed_columns := CASE checked_operation
          WHEN 'INSERT' THEN target.insert_columns
          ELSE target.update_columns
        END;
        -- Comprueba que ningún campo permitido haya desaparecido por una deriva del esquema.
        IF EXISTS (
          SELECT 1 FROM unnest(allowed_columns) AS allowed(column_name)
          WHERE NOT EXISTS (
            SELECT 1 FROM pg_catalog.pg_attribute a
            WHERE a.attrelid = target.table_id AND a.attname = allowed.column_name
              AND a.attnum > 0 AND NOT a.attisdropped
          )
        ) THEN
          RAISE EXCEPTION 'La lista de campos permitidos no coincide con %', target.table_id;
        END IF;
        FOR column_record IN
          SELECT a.attname FROM pg_catalog.pg_attribute a
          WHERE a.attrelid = target.table_id AND a.attnum > 0 AND NOT a.attisdropped
        LOOP
          expected := checked_role = 'authenticated' AND column_record.attname = ANY(allowed_columns);
          actual := has_column_privilege(checked_role, target.table_id, column_record.attname, checked_operation);
          IF actual IS DISTINCT FROM expected THEN
            RAISE EXCEPTION 'Permiso de columna incorrecto: rol=%, tabla=%, columna=%, operación=%, esperado=%, actual=%',
              checked_role, target.table_id, column_record.attname, checked_operation, expected, actual;
          END IF;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$client_column_privileges$;
SELECT 'Permisos efectivos INSERT/UPDATE correctos en las cinco tablas' AS verification;
ROLLBACK;
