-- ============================================================
-- Lexa Reads — Migración 005: reports (reemplaza content_reports de 002)
-- content_reports tenía estructura incompleta — sin status tracking ni ENUM tipado
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- Eliminar tabla anterior (creada en 002)
DROP TABLE IF EXISTS content_reports;


-- ------------------------------------------------------------
-- ENUMs
-- ------------------------------------------------------------
CREATE TYPE report_target_type AS ENUM ('review', 'comment', 'user', 'list', 'activity');
CREATE TYPE report_status      AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed');


-- ------------------------------------------------------------
-- Tabla reports
-- ------------------------------------------------------------
CREATE TABLE reports (
  id          uuid               DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid               NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type report_target_type NOT NULL,
  target_id   uuid               NOT NULL,
  reason      varchar(50)        NOT NULL,  -- 'spam', 'hate', 'violence', 'misinformation', 'other'
  details     text,
  status      report_status      DEFAULT 'pending',
  resolved_at timestamptz,
  created_at  timestamptz        DEFAULT now()
);

CREATE INDEX idx_reports_status ON reports(status, created_at);


-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario crea reportes"
  ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Usuario ve sus propios reportes"
  ON reports FOR SELECT USING (auth.uid() = reporter_id);
