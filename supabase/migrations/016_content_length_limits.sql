-- ============================================================
-- Lexa Reads — Migración 016: límites de longitud en contenido
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================
--
-- D-4 (auditoría): el contenido generado por el usuario no tenía tope de
-- longitud en DB → un payload enorme en `comments.body` / `reviews.body`
-- era posible (abuso / consumo de almacenamiento). La validación de cliente
-- (zod) acompaña este cambio, pero el CHECK en DB es la única garantía real.
--
-- Topes:
--   comments.body  <= 2000   (comentario breve)
--   reviews.body   <= 10000  (reseña larga, holgada)
--   users.bio      <= 300    (el cliente ya limita a 160; damos margen)
--
-- Idempotente: cada constraint se agrega solo si no existe.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comments_body_len_chk'
  ) THEN
    ALTER TABLE comments
      ADD CONSTRAINT comments_body_len_chk
      CHECK (char_length(body) <= 2000);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_body_len_chk'
  ) THEN
    ALTER TABLE reviews
      ADD CONSTRAINT reviews_body_len_chk
      CHECK (body IS NULL OR char_length(body) <= 10000);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_bio_len_chk'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_bio_len_chk
      CHECK (bio IS NULL OR char_length(bio) <= 300);
  END IF;
END $$;
