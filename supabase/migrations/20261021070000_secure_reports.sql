-- Centraliza la creación de reportes para validar objetivos y frenar duplicados o abuso.
DROP POLICY "Usuario crea reportes" ON public.reports;

CREATE UNIQUE INDEX reports_one_active_per_target_idx
  ON public.reports (reporter_id, target_type, target_id)
  WHERE status IN ('pending', 'reviewing');

-- Valida el reporte desde el servidor y devuelve su identificador solo después de guardarlo.
CREATE OR REPLACE FUNCTION public.submit_report(
  p_target_type public.report_target_type,
  p_target_id uuid,
  p_reason text,
  p_details text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  report_id uuid;
  reporter uuid := auth.uid();
  target_exists boolean := false;
BEGIN
  IF reporter IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para enviar un reporte.';
  END IF;

  IF p_reason NOT IN (
    'spam', 'inappropriate', 'harassment', 'false_info', 'hate_speech', 'other'
  ) THEN
    RAISE EXCEPTION 'El motivo del reporte no es válido.';
  END IF;

  IF char_length(coalesce(p_details, '')) > 1000 THEN
    RAISE EXCEPTION 'Los detalles no pueden superar 1000 caracteres.';
  END IF;

  CASE p_target_type
    WHEN 'review' THEN
      SELECT EXISTS (
        SELECT 1 FROM reviews WHERE id = p_target_id AND deleted_at IS NULL
      ) INTO target_exists;
    WHEN 'comment' THEN
      SELECT EXISTS (
        SELECT 1 FROM comments WHERE id = p_target_id AND deleted_at IS NULL
      ) INTO target_exists;
    WHEN 'user' THEN
      SELECT EXISTS (
        SELECT 1 FROM users WHERE id = p_target_id AND deleted_at IS NULL
      ) INTO target_exists;
    WHEN 'list' THEN
      SELECT EXISTS (SELECT 1 FROM lists WHERE id = p_target_id)
        INTO target_exists;
    WHEN 'activity' THEN
      SELECT EXISTS (SELECT 1 FROM activity_feed WHERE id = p_target_id)
        INTO target_exists;
    WHEN 'message' THEN
      SELECT EXISTS (
        SELECT 1 FROM messages WHERE id = p_target_id AND deleted_at IS NULL
      ) INTO target_exists;
    WHEN 'club' THEN
      SELECT EXISTS (SELECT 1 FROM reading_clubs WHERE id = p_target_id)
        INTO target_exists;
  END CASE;

  IF NOT target_exists OR (p_target_type = 'user' AND p_target_id = reporter) THEN
    RAISE EXCEPTION 'El contenido que quieres reportar no está disponible.';
  END IF;

  IF (
    SELECT count(*) FROM reports
    WHERE reporter_id = reporter
      AND created_at >= now() - interval '24 hours'
  ) >= 10 THEN
    RAISE EXCEPTION 'Has enviado demasiados reportes. Inténtalo más tarde.';
  END IF;

  INSERT INTO reports (reporter_id, target_type, target_id, reason, details)
  VALUES (
    reporter,
    p_target_type,
    p_target_id,
    p_reason,
    nullif(trim(p_details), '')
  )
  RETURNING id INTO report_id;

  RETURN report_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_report(
  public.report_target_type, uuid, text, text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_report(
  public.report_target_type, uuid, text, text
) TO authenticated;
