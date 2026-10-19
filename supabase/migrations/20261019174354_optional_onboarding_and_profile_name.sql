-- Recuerda el siguiente paso incluso cuando se omiten las preferencias.
ALTER TABLE public.users ADD COLUMN onboarding_step smallint NOT NULL DEFAULT 1
  CHECK (onboarding_step BETWEEN 1 AND 3);

-- Conserva el avance reconocible de los perfiles creados antes de esta migración.
UPDATE public.users SET onboarding_step = 3
WHERE onboarding_completed OR cardinality(favorite_genres) >= 3;

-- Completa el perfil con nombre único y preferencias opcionales; conserva las políticas RLS.
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
      onboarding_step = 3,
      onboarding_completed = true
  WHERE id = v_user_id RETURNING * INTO v_user;
  RETURN v_user;
END;
$$;
REVOKE ALL ON FUNCTION public.complete_onboarding(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_onboarding(text) TO authenticated;

-- Usa el nombre enviado por el registro y conserva compatibilidad con proveedores externos.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.users (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    'user_' || substring(NEW.id::text, 1, 8),
    coalesce(nullif(btrim(NEW.raw_user_meta_data->>'display_name'), ''),
             nullif(btrim(NEW.raw_user_meta_data->>'full_name'), ''), 'Lector'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.notification_preferences (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;
