-- ============================================================
-- Lexa Reads — Migración 006: Sincronización de campos faltantes
-- Campos presentes en STACK.md pero ausentes en 001
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================


-- ------------------------------------------------------------
-- users: reading_goal_year
-- ------------------------------------------------------------
ALTER TABLE users ADD COLUMN reading_goal_year int;


-- ------------------------------------------------------------
-- follows: accepted_at + CHECK anti-autofollow
-- ------------------------------------------------------------
ALTER TABLE follows ADD COLUMN accepted_at timestamptz;

ALTER TABLE follows ADD CONSTRAINT follows_no_self_follow
  CHECK (follower_id <> following_id);


-- ------------------------------------------------------------
-- books: published_year + language corregido
-- published_date se deja como varchar para compatibilidad con
-- Google Books que devuelve strings como "2003", "2003-05", "2003-05-01"
-- ------------------------------------------------------------
ALTER TABLE books ADD COLUMN published_year int;
ALTER TABLE books ALTER COLUMN language TYPE char(2);


-- ------------------------------------------------------------
-- user_books: tags (shelves personalizados)
-- ------------------------------------------------------------
ALTER TABLE user_books ADD COLUMN tags text[] DEFAULT '{}';

CREATE INDEX idx_user_books_tags ON user_books USING gin(tags);


-- ------------------------------------------------------------
-- reviews: edited_at
-- (comments_count ya fue agregado en 003_comments.sql)
-- ------------------------------------------------------------
ALTER TABLE reviews ADD COLUMN edited_at timestamptz;
