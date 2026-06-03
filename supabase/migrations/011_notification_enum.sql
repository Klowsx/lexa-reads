-- ============================================================
-- Lexa Reads — Migración 011 (a): valor de enum 'comment_received'
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================
--
-- D-3 (auditoría): `ALTER TYPE ... ADD VALUE` debe vivir en su PROPIA
-- migración, separado de cualquier objeto que use el valor. Postgres no
-- permite usar un valor de enum recién agregado dentro de la misma
-- transacción que lo crea ("unsafe use of new value"). Al aislarlo aquí
-- (este archivo ordena antes que `011_notifications.sql`), el valor queda
-- committeado antes de que el trigger de `011_notifications.sql` lo use,
-- y `supabase db push` es reproducible en entornos nuevos.
--
-- Idempotente: IF NOT EXISTS lo hace seguro de re-ejecutar.

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'comment_received';
