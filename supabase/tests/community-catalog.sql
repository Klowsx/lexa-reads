-- Comprueba alta comunitaria, filtros y paginación sin persistir datos de prueba.
BEGIN;
DO $$ DECLARE reader_id uuid := gen_random_uuid(); moderator_id uuid := gen_random_uuid(); BEGIN
  PERFORM set_config('lexa.catalog_reader', reader_id::text, true);
  PERFORM set_config('lexa.catalog_moderator', moderator_id::text, true);
  INSERT INTO auth.users(id) VALUES (reader_id), (moderator_id);
  UPDATE public.users SET is_admin = true WHERE id = moderator_id;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('lexa.catalog_reader'), true);
DO $$ DECLARE first_book uuid; second_book uuid; BEGIN
  SELECT id INTO first_book FROM public.create_community_book(
    'Mar abierto', 'Ana Rivera', '9781234567890', ARRAY['Fantasy'], ARRAY['aventura'],
    'Una historia junto al mar.', '', 2024, 'es', ARRAY[]::text[], ARRAY[]::text[]
  );
  PERFORM set_config('lexa.catalog_book', first_book::text, true);
  SELECT id INTO second_book FROM public.create_community_book(
    'Otro libro', 'Mar Torres', NULL, ARRAY['Fantasy'], ARRAY[]::text[],
    'Otra historia.', '', NULL, 'es', ARRAY[]::text[], ARRAY[]::text[]
  );

  IF NOT EXISTS (SELECT 1 FROM public.search_catalog(p_search => 'Mar', p_genres => ARRAY['Fantasy']) WHERE id = first_book)
    OR NOT EXISTS (SELECT 1 FROM public.search_catalog(p_search => 'Mar', p_genres => ARRAY['Fantasy']) WHERE id = second_book)
    OR NOT EXISTS (SELECT 1 FROM public.search_catalog('9781234567890') WHERE id = first_book)
  THEN RAISE EXCEPTION 'La búsqueda por título, autor, ISBN o filtros falló'; END IF;

  IF (SELECT id FROM public.search_catalog(p_search => 'Mar', p_genres => ARRAY['Fantasy'], p_limit => 1)) <> first_book
  THEN RAISE EXCEPTION 'La relevancia no priorizó el título'; END IF;
  IF (SELECT id FROM public.search_catalog(p_search => 'Mar', p_genres => ARRAY['Fantasy'],
    p_before_rank => 2, p_before_created_at => (SELECT created_at FROM public.books WHERE id = first_book),
    p_before_id => first_book, p_limit => 1)) <> second_book
  THEN RAISE EXCEPTION 'El cursor de catálogo perdió el siguiente libro'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.search_catalog(
    p_genres => ARRAY['Fantasy'], p_tags => ARRAY['aventura'],
    p_year_from => 2020, p_year_to => 2025
  ) WHERE id = first_book)
    OR EXISTS (SELECT 1 FROM public.search_catalog(p_tags => ARRAY['aventura'], p_year_from => 2025) WHERE id = first_book)
    OR NOT EXISTS (SELECT 1 FROM public.catalog_facets() WHERE kind = 'tag' AND value = 'aventura')
  THEN RAISE EXCEPTION 'Los filtros o sus opciones no coinciden con el catálogo'; END IF;

  BEGIN
    UPDATE public.books SET title = 'Cambio no autorizado' WHERE id = first_book;
    IF FOUND THEN RAISE EXCEPTION 'El lector pudo cambiar una ficha compartida'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
SELECT set_config('request.jwt.claim.sub', current_setting('lexa.catalog_moderator'), true);
DO $$ BEGIN
  UPDATE public.books SET cover_url = 'https://example.org/portada.jpg'
  WHERE id = current_setting('lexa.catalog_book')::uuid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Moderación no pudo corregir la portada'; END IF;
END $$;
ROLLBACK;
