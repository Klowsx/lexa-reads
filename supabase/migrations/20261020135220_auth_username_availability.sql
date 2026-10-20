-- Mantiene la consulta privilegiada fuera del esquema expuesto por la API.
CREATE SCHEMA IF NOT EXISTS lexa_auth;
REVOKE ALL ON SCHEMA lexa_auth FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA lexa_auth TO authenticated;

-- Devuelve únicamente disponibilidad, incluso si un bloqueo oculta el perfil que reservó el nombre.
CREATE OR REPLACE FUNCTION lexa_auth.is_username_available(p_username text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_username text := lower(btrim(p_username));
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required' USING ERRCODE = '28000';
  END IF;
  IF v_username IS NULL OR v_username !~ '^[a-z0-9_]{3,30}$' THEN
    RETURN false;
  END IF;
  RETURN NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE username = v_username::public.citext AND id <> v_user_id
  );
END;
$$;
REVOKE ALL ON FUNCTION lexa_auth.is_username_available(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION lexa_auth.is_username_available(text) TO authenticated;

-- Conserva el contrato RPC existente y comprueba la sesión antes de consultar nombres.
CREATE OR REPLACE FUNCTION public.is_username_available(p_username text)
RETURNS boolean
LANGUAGE sql SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT lexa_auth.is_username_available(p_username);
$$;
REVOKE ALL ON FUNCTION public.is_username_available(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_username_available(text) TO authenticated;
