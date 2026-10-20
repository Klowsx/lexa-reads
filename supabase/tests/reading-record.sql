-- Verifica fechas, notas, contadores y RLS con cuentas sintéticas; no deja datos persistidos.
BEGIN;
DO $$
DECLARE actor uuid := gen_random_uuid(); other_actor uuid := gen_random_uuid(); book uuid := gen_random_uuid();
BEGIN
  PERFORM set_config('lexa.reading_actor', actor::text, true);
  PERFORM set_config('lexa.reading_other', other_actor::text, true);
  PERFORM set_config('lexa.reading_book', book::text, true);
  INSERT INTO auth.users(id) VALUES(actor), (other_actor);
  INSERT INTO public.books(id, google_books_id, title) VALUES(book, 'qa_' || substr(replace(book::text, '-', ''),1,16), 'Lectura transaccional');
END;
$$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('lexa.reading_actor'), true);
DO $$
DECLARE book uuid := current_setting('lexa.reading_book')::uuid; result public.user_books; same_id uuid; before_count integer;
BEGIN
  SELECT books_read_count INTO before_count FROM public.users WHERE id = auth.uid();
  SELECT * INTO result FROM public.save_reading_record(book, '{"status":"want_to_read","rating":4.5,"tags":["favoritos"]}');
  same_id := result.id;
  IF result.status <> 'want_to_read' OR result.started_at IS NOT NULL OR result.finished_at IS NOT NULL THEN RAISE EXCEPTION 'Pendiente inválido'; END IF;
  SELECT * INTO result FROM public.save_reading_record(book, '{"status":"reading"}');
  IF result.started_at <> CURRENT_DATE OR result.rating <> 4.5 OR result.tags <> ARRAY['favoritos'] THEN RAISE EXCEPTION 'No se conservaron datos al empezar'; END IF;
  SELECT * INTO result FROM public.save_reading_record(book, '{"status":"read"}');
  IF result.finished_at <> CURRENT_DATE OR result.id <> same_id THEN RAISE EXCEPTION 'No se registró finalización sin duplicar'; END IF;
  IF (SELECT books_read_count FROM public.users WHERE id = auth.uid()) <> before_count + 1 THEN RAISE EXCEPTION 'Contador inconsistente'; END IF;
  SELECT * INTO result FROM public.save_reading_record(book, '{"rating":null}');
  IF result.rating IS NOT NULL OR result.finished_at <> CURRENT_DATE OR result.status <> 'read' THEN RAISE EXCEPTION 'Quitar puntuación alteró lectura'; END IF;
  SELECT * INTO result FROM public.save_reading_record(book, '{"rating":0.5}');
  SELECT * INTO result FROM public.save_reading_record(book, jsonb_build_object('started_at', NULL, 'finished_at', (date_trunc('year', CURRENT_DATE) - interval '1 day')::date));
  IF result.started_at IS NOT NULL OR result.rating <> 0.5 THEN RAISE EXCEPTION 'No se conservaron datos al corregir fecha'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_books WHERE id = same_id AND finished_at >= date_trunc('year', CURRENT_DATE)::date) THEN RAISE EXCEPTION 'Lectura anterior cuenta en meta actual'; END IF;
  SELECT * INTO result FROM public.save_reading_record(book, jsonb_build_object('finished_at', CURRENT_DATE));
  IF NOT EXISTS (SELECT 1 FROM public.user_books WHERE id = same_id AND status='read' AND finished_at >= date_trunc('year', CURRENT_DATE)::date) THEN RAISE EXCEPTION 'No cuenta en la meta actual'; END IF;
  -- Puntuar o volver a elegir Leído nunca mueve la fecha anterior ni duplica el contador.
  SELECT * INTO result FROM public.save_reading_record(book, '{"status":"read","rating":3}');
  IF (SELECT books_read_count FROM public.users WHERE id = auth.uid()) <> before_count + 1 THEN RAISE EXCEPTION 'Contador duplicado'; END IF;
  BEGIN
    PERFORM public.save_reading_record(book, '{"finished_at":null}'); RAISE EXCEPTION 'Se quitó la finalización obligatoria';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN
    PERFORM public.save_reading_record(book, jsonb_build_object('finished_at', CURRENT_DATE + 1)); RAISE EXCEPTION 'Se aceptó fecha futura';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN
    PERFORM public.save_reading_record(book, jsonb_build_object('started_at', CURRENT_DATE, 'finished_at', CURRENT_DATE - 1)); RAISE EXCEPTION 'Se aceptó intervalo invertido';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    PERFORM public.save_reading_record(book, '{"rating":2.3}'); RAISE EXCEPTION 'Se aceptó nota fuera de escala';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    PERFORM public.save_reading_record(book, '{"user_id":"00000000-0000-0000-0000-000000000000"}'); RAISE EXCEPTION 'Se aceptó cambiar de propietario';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN
    PERFORM public.save_reading_record(book, '{"status":null}'); RAISE EXCEPTION 'Se aceptó estado nulo';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  SELECT * INTO result FROM public.save_reading_record(book, '{"status":"reading"}');
  IF result.started_at <> CURRENT_DATE OR result.finished_at IS NOT NULL OR result.rating <> 3 THEN RAISE EXCEPTION 'Reanudar no inició nueva lectura'; END IF;
  SELECT * INTO result FROM public.save_reading_record(book, '{"status":"abandoned"}');
  IF result.started_at <> CURRENT_DATE OR result.finished_at IS NOT NULL THEN RAISE EXCEPTION 'Abandonado con fechas inválidas'; END IF;
  SELECT * INTO result FROM public.save_reading_record(book, '{"status":"want_to_read"}');
  IF result.started_at IS NOT NULL OR result.finished_at IS NOT NULL OR result.rating <> 3 THEN RAISE EXCEPTION 'Pendiente no reinició fechas'; END IF;
  IF (SELECT books_read_count FROM public.users WHERE id = auth.uid()) <> before_count THEN RAISE EXCEPTION 'Salir de leído no ajustó contador'; END IF;
END;
$$;
-- Crea una lectura antigua sin fecha para comprobar que editar su nota no inventa el año.
RESET ROLE;
UPDATE public.user_books SET status='read', started_at=NULL, finished_at=NULL WHERE user_id=current_setting('lexa.reading_actor')::uuid;
SET LOCAL ROLE authenticated;
DO $$
DECLARE result public.user_books;
BEGIN
  SELECT * INTO result FROM public.save_reading_record(current_setting('lexa.reading_book')::uuid, '{"rating":5}');
  IF result.finished_at IS NOT NULL THEN RAISE EXCEPTION 'Se inventó fecha histórica'; END IF;
END;
$$;
SELECT set_config('request.jwt.claim.sub', current_setting('lexa.reading_other'), true);
DO $$
DECLARE result public.user_books;
BEGIN
  SELECT * INTO result FROM public.save_reading_record(current_setting('lexa.reading_book')::uuid, '{"status":"abandoned"}');
  IF result.user_id <> auth.uid() THEN RAISE EXCEPTION 'RPC escribió en otra biblioteca'; END IF;
  UPDATE public.user_books SET rating=1 WHERE user_id=current_setting('lexa.reading_actor')::uuid;
  IF FOUND THEN RAISE EXCEPTION 'RLS permitió editar otra biblioteca'; END IF;
  DELETE FROM public.user_books WHERE user_id=current_setting('lexa.reading_actor')::uuid;
  IF FOUND THEN RAISE EXCEPTION 'RLS permitió borrar otra biblioteca'; END IF;
END;
$$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
  BEGIN
    PERFORM public.save_reading_record(current_setting('lexa.reading_book')::uuid, '{"status":"read"}'); RAISE EXCEPTION 'RPC permitió anónimos';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END; $$;
RESET ROLE;
ROLLBACK;
