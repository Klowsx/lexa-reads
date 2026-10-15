-- Comprueba si un nombre de usuario cumple el formato y no está reservado por otra cuenta.
CREATE OR REPLACE FUNCTION public.is_username_available(p_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_username text := lower(btrim(p_username));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required' USING ERRCODE = '28000';
  END IF;

  IF v_username !~ '^[a-z0-9_]{3,30}$' THEN
    RETURN false;
  END IF;

  RETURN NOT EXISTS (
    SELECT 1
    FROM public.users
    WHERE username = v_username
      AND id <> auth.uid()
  );
END;
$$;

-- Cierra el onboarding de la cuenta autenticada solo cuando sus preferencias mínimas ya existen.
CREATE OR REPLACE FUNCTION public.complete_onboarding(p_username text)
RETURNS public.users
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_username text := lower(btrim(p_username));
  v_favorite_genres text[];
  v_reading_goal integer;
  v_user public.users%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required' USING ERRCODE = '28000';
  END IF;

  IF v_username !~ '^[a-z0-9_]{3,30}$' THEN
    RAISE EXCEPTION 'El nombre de usuario debe tener entre 3 y 30 caracteres: letras, números o guion bajo'
      USING ERRCODE = '22023';
  END IF;

  SELECT favorite_genres, reading_goal
  INTO v_favorite_genres, v_reading_goal
  FROM public.users
  WHERE id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found' USING ERRCODE = 'P0002';
  END IF;

  IF coalesce(cardinality(v_favorite_genres), 0) < 3 THEN
    RAISE EXCEPTION 'Selecciona al menos tres géneros' USING ERRCODE = '22023';
  END IF;

  IF v_reading_goal IS NULL OR v_reading_goal < 1 OR v_reading_goal > 365 THEN
    RAISE EXCEPTION 'La meta de lectura debe estar entre 1 y 365' USING ERRCODE = '22023';
  END IF;

  UPDATE public.users
  SET username = v_username,
      reading_goal_year = extract(year FROM now())::integer,
      onboarding_completed = true
  WHERE id = v_user_id
  RETURNING * INTO v_user;

  RETURN v_user;
END;
$$;

REVOKE ALL ON FUNCTION public.is_username_available(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_onboarding(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_username_available(text) FROM anon;
REVOKE ALL ON FUNCTION public.complete_onboarding(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_username_available(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_onboarding(text) TO authenticated;
