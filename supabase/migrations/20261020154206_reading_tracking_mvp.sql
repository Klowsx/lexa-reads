-- No inventa fechas para lecturas antiguas: se validan las nuevas escrituras y las ediciones.
ALTER TABLE public.user_books ADD CONSTRAINT user_books_dates_order
  CHECK (started_at IS NULL OR finished_at IS NULL OR started_at <= finished_at);
ALTER TABLE public.user_books ADD CONSTRAINT user_books_dates_status
  CHECK ((finished_at IS NULL OR status = 'read') AND
    (status <> 'want_to_read' OR started_at IS NULL));

-- Aplica cambios parciales bajo RLS y serializa las escrituras del mismo libro y usuario.
CREATE OR REPLACE FUNCTION public.save_reading_record(
  p_book_id uuid, p_changes jsonb, p_today date DEFAULT CURRENT_DATE
) RETURNS public.user_books
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  actor uuid := auth.uid();
  previous public.user_books;
  result public.user_books;
  next_status public.user_book_status;
  start_date date;
  finish_date date;
  next_rating numeric;
  next_tags text[];
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Se requiere una sesión' USING ERRCODE = '42501'; END IF;
  IF p_book_id IS NULL OR p_changes IS NULL OR jsonb_typeof(p_changes) <> 'object' OR
     p_changes = '{}'::jsonb OR (p_changes - ARRAY['status','rating','started_at','finished_at','tags']) <> '{}'::jsonb THEN
    RAISE EXCEPTION 'Cambios de lectura inválidos' USING ERRCODE = '22023';
  END IF;
  IF p_today IS NULL OR p_today < CURRENT_DATE - 1 OR p_today > CURRENT_DATE + 1 THEN
    RAISE EXCEPTION 'Día local inválido' USING ERRCODE = '22023';
  END IF;
  -- El bloqueo también cubre la primera inserción, cuando aún no existe una fila que bloquear.
  PERFORM pg_advisory_xact_lock(hashtextextended(actor::text || ':' || p_book_id::text, 0));
  SELECT * INTO previous FROM public.user_books WHERE user_id = actor AND book_id = p_book_id FOR UPDATE;
  next_status := CASE WHEN p_changes ? 'status' THEN (p_changes->>'status')::public.user_book_status
    ELSE COALESCE(previous.status, 'want_to_read'::public.user_book_status) END;
  IF next_status IS NULL THEN RAISE EXCEPTION 'Estado obligatorio' USING ERRCODE = '22023'; END IF;
  start_date := previous.started_at;
  finish_date := previous.finished_at;
  IF next_status IS DISTINCT FROM previous.status THEN
    IF next_status = 'want_to_read' THEN start_date := NULL; END IF;
    IF next_status = 'reading' AND (start_date IS NULL OR previous.status = 'read') THEN start_date := p_today; END IF;
    finish_date := CASE WHEN next_status = 'read' THEN p_today ELSE NULL END;
  END IF;
  -- Omitir una propiedad conserva el dato; enviarla como null lo elimina de forma explícita.
  IF p_changes ? 'started_at' THEN start_date := (p_changes->>'started_at')::date; END IF;
  IF p_changes ? 'finished_at' THEN finish_date := (p_changes->>'finished_at')::date; END IF;
  IF next_status = 'read' AND finish_date IS NULL AND
    (previous.status IS DISTINCT FROM next_status OR p_changes ? 'finished_at') THEN
    RAISE EXCEPTION 'Un libro leído necesita fecha de finalización' USING ERRCODE = '22023';
  END IF;
  IF (start_date > p_today OR finish_date > p_today) OR
     (start_date IS NOT NULL AND NOT isfinite(start_date)) OR
     (finish_date IS NOT NULL AND NOT isfinite(finish_date)) THEN
    RAISE EXCEPTION 'Las fechas no pueden ser futuras' USING ERRCODE = '22023';
  END IF;
  next_rating := CASE WHEN p_changes ? 'rating' THEN (p_changes->>'rating')::numeric ELSE previous.rating END;
  next_tags := previous.tags;
  IF p_changes ? 'tags' THEN
    IF p_changes->'tags' = 'null'::jsonb THEN next_tags := NULL;
    ELSE SELECT array_agg(value) INTO next_tags FROM jsonb_array_elements_text(p_changes->'tags'); END IF;
  END IF;
  IF previous.id IS NULL THEN
    INSERT INTO public.user_books (user_id, book_id, status, rating, started_at, finished_at, tags)
    VALUES (actor, p_book_id, next_status, next_rating, start_date, finish_date, COALESCE(next_tags, '{}')) RETURNING * INTO result;
  ELSE
    UPDATE public.user_books SET status = next_status, rating = next_rating,
      started_at = start_date, finished_at = finish_date, tags = next_tags
    WHERE id = previous.id AND user_id = actor RETURNING * INTO result;
  END IF;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.save_reading_record(uuid,jsonb,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_reading_record(uuid,jsonb,date) TO authenticated;
