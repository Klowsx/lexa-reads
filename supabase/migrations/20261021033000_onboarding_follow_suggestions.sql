-- Añade una salida de sugerencias sin forzar seguimientos antes de entrar al feed.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_onboarding_step_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_onboarding_step_check CHECK (onboarding_step BETWEEN 1 AND 4);

-- Guarda la identidad antes de mostrar sugerencias y conserva el perfil pendiente hasta el último paso.
CREATE OR REPLACE FUNCTION public.complete_onboarding(p_username text)
RETURNS public.users
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_username text := lower(btrim(p_username));
  v_user public.users%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required' USING ERRCODE = '28000';
  END IF;
  IF v_username IS NULL OR v_username !~ '^[a-z0-9_]{3,30}$' THEN
    RAISE EXCEPTION 'Usa entre 3 y 30 letras, números o guion bajo' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_user FROM public.users WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found' USING ERRCODE = 'P0002';
  END IF;
  IF coalesce(v_user.reading_goal, 12) NOT BETWEEN 1 AND 365 THEN
    RAISE EXCEPTION 'La meta debe estar entre 1 y 365 libros' USING ERRCODE = '22023';
  END IF;
  UPDATE public.users
  SET username = v_username,
      favorite_genres = coalesce(favorite_genres, ARRAY[]::text[]),
      reading_goal = coalesce(reading_goal, 12),
      reading_goal_year = extract(year FROM now())::integer,
      onboarding_step = 4,
      onboarding_completed = false
  WHERE id = v_user_id RETURNING * INTO v_user;
  RETURN v_user;
END;
$$;

-- Marca el onboarding como finalizado tras revisar o saltar las sugerencias disponibles.
CREATE OR REPLACE FUNCTION public.finish_onboarding()
RETURNS public.users
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user public.users%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required' USING ERRCODE = '28000';
  END IF;
  UPDATE public.users
  SET onboarding_step = 4, onboarding_completed = true
  WHERE id = v_user_id
  RETURNING * INTO v_user;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_user;
END;
$$;

REVOKE ALL ON FUNCTION public.finish_onboarding() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finish_onboarding() TO authenticated;
