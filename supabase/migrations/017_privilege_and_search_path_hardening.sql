-- ============================================================
-- Lexa Reads — Migración 017: Endurecimiento de privilegios + search_path
-- ============================================================
-- Hallazgos de la 2ª auditoría (2026-06-04):
--
-- NEW-1 (🔴 P0 · escalado de privilegios): la migración 012 agregó
--   `users.is_admin`, pero la policy de UPDATE de `users` (001) es
--   `FOR UPDATE USING (auth.uid() = id)` SIN restricción de columnas. RLS
--   no puede limitar columnas, así que CUALQUIER usuario podía ejecutar
--   `UPDATE users SET is_admin = true WHERE id = auth.uid()` y auto-promoverse
--   a administrador → ver/resolver TODOS los reportes (PII de otros usuarios),
--   editar y borrar el catálogo global `books`. Mismo vector permite inflar
--   los contadores desnormalizados (followers_count, etc. — CLAUDE.md §11).
--
-- NEW-2 (🟠 seguridad · search_path mutable): las funciones SECURITY DEFINER
--   de 001/002/003/004/011 no fijan `search_path`. Es el vector clásico de
--   secuestro de resolución de objetos en funciones DEFINER y lo marca el
--   linter de Supabase ("Function Search Path Mutable"). Las de 013/014 ya
--   lo fijan; aquí cerramos el resto.
--
-- Aplicar desde el SQL Editor (rol postgres) DESPUÉS de 012..016.
-- ============================================================


-- ------------------------------------------------------------
-- NEW-1 · Bloquear columnas privilegiadas a nivel de GRANT
-- ------------------------------------------------------------
-- RLS no restringe columnas; los privilegios por columna sí. Las funciones
-- de contador y handle_new_user son SECURITY DEFINER (owner = postgres) y
-- BYPASEAN estos REVOKE, así que siguen manteniendo los contadores. La
-- promoción de admin se hace por SQL/service_role (también bypasa). El cliente
-- (`authenticated`/`anon`) deja de poder tocar estas columnas.
REVOKE UPDATE (is_admin) ON public.users FROM anon, authenticated;
REVOKE UPDATE (
  followers_count,
  following_count,
  books_read_count,
  reviews_count
) ON public.users FROM anon, authenticated;

-- account_deletion_requests: el usuario solo debería poder CANCELAR su
-- solicitud (cancelled_at). Impedir que manipule la fecha de borrado o la
-- marca de procesado (evadir/posponer el hard-delete) o reasignar user_id.
REVOKE UPDATE (
  scheduled_delete_at,
  processed_at,
  user_id
) ON public.account_deletion_requests FROM anon, authenticated;


-- ------------------------------------------------------------
-- NEW-2 · Fijar search_path en todas las funciones DEFINER restantes
-- ------------------------------------------------------------
-- `public, pg_temp`: pg_temp al final evita que un esquema temporal del
-- atacante intercepte la resolución de nombres.

-- 001 — contadores desnormalizados + perfil automático
ALTER FUNCTION public.update_follow_counts()        SET search_path = public, pg_temp;
ALTER FUNCTION public.update_books_read_count()     SET search_path = public, pg_temp;
ALTER FUNCTION public.update_reviews_count()        SET search_path = public, pg_temp;
ALTER FUNCTION public.update_activity_likes_count() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_list_books_count()     SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user()             SET search_path = public, pg_temp;

-- 002 — contadores extra + helper inmutable (usado en índice; ALTER no invalida)
ALTER FUNCTION public.immutable_array_to_string(text[], text) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_review_likes_count()   SET search_path = public, pg_temp;
ALTER FUNCTION public.update_list_likes_count()     SET search_path = public, pg_temp;
ALTER FUNCTION public.update_club_members_count()   SET search_path = public, pg_temp;

-- 003 — comentarios
ALTER FUNCTION public.update_comments_count()       SET search_path = public, pg_temp;

-- 011 — notificaciones
ALTER FUNCTION public.notify_new_follower()         SET search_path = public, pg_temp;
ALTER FUNCTION public.notify_review_like()          SET search_path = public, pg_temp;
ALTER FUNCTION public.notify_activity_like()        SET search_path = public, pg_temp;
ALTER FUNCTION public.notify_comment_received()     SET search_path = public, pg_temp;
