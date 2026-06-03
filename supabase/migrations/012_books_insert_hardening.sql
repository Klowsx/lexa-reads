-- ============================================================
-- Lexa Reads — Migración 012: Endurecimiento del catálogo `books`
-- ============================================================
-- Problema (auditoría S-3): la policy de 001 permitía a cualquier usuario
-- autenticado insertar filas arbitrarias en el catálogo GLOBAL y compartido,
-- sin atribución ni forma de moderar. Un actor malicioso podía contaminar el
-- catálogo con títulos basura/ofensivos visibles para todos, sin posibilidad
-- de limpieza desde la app (no había UPDATE/DELETE policy).
--
-- Fix:
--   1. `added_by` → toda fila queda atribuida a quien la insertó (accountability).
--   2. INSERT exige que `added_by = auth.uid()` (nadie inserta a nombre de otro).
--   3. `users.is_admin` + policies de UPDATE/DELETE para que un moderador pueda
--      corregir o borrar entradas contaminadas.
--
-- NO rompe el flujo cache-first de `google-books.ts`: el cliente no setea
-- `added_by`, el DEFAULT `auth.uid()` lo rellena antes de evaluar el WITH CHECK.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Flag de administrador (moderación)
-- ------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;


-- ------------------------------------------------------------
-- 2. Atribución de quién agregó cada libro
-- ------------------------------------------------------------
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS added_by uuid REFERENCES users(id) ON DELETE SET NULL DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS idx_books_added_by ON books(added_by);


-- ------------------------------------------------------------
-- 3. Reemplazar la policy de INSERT por una con atribución obligatoria
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Cualquier usuario autenticado puede insertar libros" ON books;

CREATE POLICY "Usuario autenticado inserta libros atribuidos a sí mismo"
  ON books FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND added_by = auth.uid());


-- ------------------------------------------------------------
-- 4. Moderación: solo administradores editan/borran el catálogo
-- ------------------------------------------------------------
CREATE POLICY "Admin edita el catálogo"
  ON books FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_admin));

CREATE POLICY "Admin borra entradas del catálogo"
  ON books FOR DELETE
  USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_admin));
</content>
