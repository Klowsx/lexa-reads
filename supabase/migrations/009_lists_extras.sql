-- ============================================================
-- Lexa Reads — Migración 009: Campos extra en lists
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- is_featured: destaca la lista en el perfil del usuario
ALTER TABLE lists ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- accent_color: color de acento de la lista (hex, ej. '#4A96B8')
ALTER TABLE lists ADD COLUMN IF NOT EXISTS accent_color varchar(7) DEFAULT '#4A96B8';
