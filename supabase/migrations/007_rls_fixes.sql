-- ============================================================
-- Lexa Reads — Migración 007: Fixes de RLS
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================


-- ------------------------------------------------------------
-- 9. users: SELECT debe excluir usuarios que te bloquearon
-- ------------------------------------------------------------
DROP POLICY "Perfiles públicos visibles para todos" ON users;

CREATE POLICY "Perfiles públicos visibles para todos"
  ON users FOR SELECT
  USING (
    deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks
      WHERE blocker_id = users.id AND blocked_id = auth.uid()
    )
  );


-- ------------------------------------------------------------
-- 10. user_books: separar FOR ALL en policies explícitas por operación
--     El FOR ALL de 001 + SELECT de 002 se solapaban — se reemplaza
--     por 4 policies independientes y explícitas
-- ------------------------------------------------------------
DROP POLICY "Usuario gestiona sus propios user_books"   ON user_books;
DROP POLICY "user_books visibles respetando privacidad" ON user_books;

-- SELECT: libros visibles si el dueño no es privado, o eres el dueño
CREATE POLICY "user_books SELECT respetando privacidad"
  ON user_books FOR SELECT
  USING (
    auth.uid() = user_id
    OR NOT EXISTS (
      SELECT 1 FROM users u WHERE u.id = user_id AND u.is_private = true
    )
  );

-- Writes: solo el propio usuario
CREATE POLICY "user_books INSERT propio"
  ON user_books FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_books UPDATE propio"
  ON user_books FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "user_books DELETE propio"
  ON user_books FOR DELETE
  USING (auth.uid() = user_id);


-- ------------------------------------------------------------
-- Extra: reviews y activity_feed también deben respetar user_blocks
-- (STACK.md los define así; las policies actuales no lo chequean)
-- ------------------------------------------------------------
DROP POLICY "Reseñas publicadas visibles para todos" ON reviews;

CREATE POLICY "Reseñas publicadas visibles para todos"
  ON reviews FOR SELECT
  USING (
    is_published = true
    AND deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks
      WHERE blocker_id = reviews.user_id AND blocked_id = auth.uid()
    )
  );


DROP POLICY "Feed visible respetando privacidad" ON activity_feed;

-- El feed solo muestra actividad propia + de usuarios que sigues (fan-in MVP)
CREATE POLICY "Feed visible respetando privacidad"
  ON activity_feed FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM user_blocks
      WHERE blocker_id = activity_feed.user_id AND blocked_id = auth.uid()
    )
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM follows
        WHERE follower_id = auth.uid()
          AND following_id = activity_feed.user_id
          AND status = 'accepted'
      )
    )
  );
