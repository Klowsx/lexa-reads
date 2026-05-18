-- ============================================================
-- Lexa Reads — Migración 008: Fix RLS user_blocks
-- ============================================================
-- El subquery en la policy de users:
--   NOT EXISTS (SELECT 1 FROM user_blocks WHERE blocker_id = users.id AND blocked_id = auth.uid())
-- necesita ver el bloqueo desde la perspectiva del usuario BLOQUEADO.
-- La policy anterior solo permitía ver bloqueos donde eras el bloqueador.
-- ============================================================

DROP POLICY IF EXISTS "Usuario ve sus propios bloqueos" ON user_blocks;

CREATE POLICY "Usuario ve sus propios bloqueos"
  ON user_blocks FOR SELECT
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
