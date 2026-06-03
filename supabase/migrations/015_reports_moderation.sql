-- ============================================================
-- Lexa Reads — Migración 015: Moderación de reportes (C-4)
-- ============================================================
-- Problema (auditoría C-4): las tiendas exigen resolver reportes de contenido
-- en ≤24h, pero `reports` (migración 005) solo tenía policies para que el
-- reportante viera SUS reportes. No había forma de que un moderador viera ni
-- resolviera la cola.
--
-- Fix: políticas de SELECT/UPDATE para administradores (`users.is_admin`,
-- añadido en 012). El proceso operativo está en docs/moderacion.md.
-- ============================================================


-- ------------------------------------------------------------
-- Admin: ver toda la cola de reportes
-- ------------------------------------------------------------
CREATE POLICY "Admin ve todos los reportes"
  ON reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_admin));


-- ------------------------------------------------------------
-- Admin: actualizar estado (pending → reviewing → resolved/dismissed)
-- ------------------------------------------------------------
CREATE POLICY "Admin resuelve reportes"
  ON reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_admin));
</content>
