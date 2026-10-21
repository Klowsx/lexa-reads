-- Devuelve únicamente la identidad necesaria para que cada lector gestione sus propios bloqueos.
CREATE FUNCTION public.list_my_blocked_users()
RETURNS TABLE(
  block_id uuid,
  blocked_id uuid,
  created_at timestamptz,
  username text,
  display_name text,
  avatar_url text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT b.id, b.blocked_id, b.created_at, u.username, u.display_name, u.avatar_url
  FROM public.user_blocks b
  JOIN public.users u ON u.id = b.blocked_id
  WHERE b.blocker_id = auth.uid()
  ORDER BY b.created_at DESC, b.id DESC;
$$;

REVOKE ALL ON FUNCTION public.list_my_blocked_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_my_blocked_users() TO authenticated;
