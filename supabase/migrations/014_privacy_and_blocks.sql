-- ============================================================
-- Lexa Reads — Migración 014: Privacidad consistente + bloqueo bidireccional
-- ============================================================
-- C-2: las reseñas ignoraban `users.is_private` → una cuenta privada ocultaba
--      su biblioteca y su feed, pero sus reseñas seguían públicas. Inconsistente.
-- C-3: el bloqueo era unidireccional (solo "si X me bloqueó, no veo a X").
--      Faltaba el inverso: si YO bloqueo a X, tampoco debo ver a X.
--
-- Modelo de privacidad UNIFICADO (decisión): contenido de un perfil privado
-- es visible para el dueño + sus seguidores ACEPTADOS; el de un perfil público,
-- para todos. Se aplica igual a `user_books` y `reviews`. El `activity_feed`
-- conserva su semántica de timeline (solo a quienes sigues) pero ahora con
-- bloqueo bidireccional.
--
-- Se centraliza la lógica en dos funciones SECURITY DEFINER (evitan recursión
-- de RLS al leer users/follows/user_blocks desde dentro de las policies).
-- ============================================================


-- ------------------------------------------------------------
-- 1. Helpers
-- ------------------------------------------------------------

-- ¿auth.uid() puede ver el contenido de `target`?
-- Dueño, o perfil público, o seguidor aceptado de un perfil privado.
CREATE OR REPLACE FUNCTION public.can_view_user_content(target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    target = auth.uid()
    OR NOT EXISTS (SELECT 1 FROM users u WHERE u.id = target AND u.is_private)
    OR EXISTS (
      SELECT 1 FROM follows f
      WHERE f.follower_id = auth.uid()
        AND f.following_id = target
        AND f.status = 'accepted'
    );
$$;

-- ¿Existe un bloqueo entre auth.uid() y `other` en CUALQUIER sentido?
CREATE OR REPLACE FUNCTION public.is_blocked_with(other uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_blocks b
    WHERE (b.blocker_id = other       AND b.blocked_id = auth.uid())
       OR (b.blocker_id = auth.uid()  AND b.blocked_id = other)
  );
$$;


-- ------------------------------------------------------------
-- 2. users — bloqueo bidireccional (C-3)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Perfiles públicos visibles para todos" ON users;

CREATE POLICY "Perfiles públicos visibles para todos"
  ON users FOR SELECT
  USING (deleted_at IS NULL AND NOT public.is_blocked_with(users.id));


-- ------------------------------------------------------------
-- 3. user_books — privacidad unificada + bloqueo bidireccional (C-2/C-3)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "user_books SELECT respetando privacidad" ON user_books;

CREATE POLICY "user_books SELECT respetando privacidad"
  ON user_books FOR SELECT
  USING (
    public.can_view_user_content(user_id)
    AND NOT public.is_blocked_with(user_id)
  );


-- ------------------------------------------------------------
-- 4. reviews — ahora respeta is_private + bloqueo bidireccional (C-2/C-3)
--    (la policy FOR ALL del dueño sigue dándole acceso a sus borradores)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Reseñas publicadas visibles para todos" ON reviews;

CREATE POLICY "Reseñas publicadas visibles para todos"
  ON reviews FOR SELECT
  USING (
    is_published = true
    AND deleted_at IS NULL
    AND public.can_view_user_content(user_id)
    AND NOT public.is_blocked_with(user_id)
  );


-- ------------------------------------------------------------
-- 5. activity_feed — timeline + bloqueo bidireccional (C-3)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Feed visible respetando privacidad" ON activity_feed;

CREATE POLICY "Feed visible respetando privacidad"
  ON activity_feed FOR SELECT
  USING (
    NOT public.is_blocked_with(user_id)
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM follows f
        WHERE f.follower_id = auth.uid()
          AND f.following_id = activity_feed.user_id
          AND f.status = 'accepted'
      )
    )
  );


-- ------------------------------------------------------------
-- 6. comments — bloqueo bidireccional (C-3)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Comentarios públicos visibles para todos" ON comments;

CREATE POLICY "Comentarios públicos visibles para todos"
  ON comments FOR SELECT
  USING (deleted_at IS NULL AND NOT public.is_blocked_with(user_id));
</content>
