-- Verifica alta bilingüe, vocabulario canónico y cierre real de la votación.
BEGIN;
DO $$ DECLARE reader_id uuid := gen_random_uuid(); BEGIN
  PERFORM set_config('lexa.vote_reader', reader_id::text, true);
  INSERT INTO auth.users(id) VALUES (reader_id);
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('lexa.vote_reader'), true);
DO $$ DECLARE created public.books; first_id uuid; second_id uuid; BEGIN
  SELECT public.create_community_book(
    'Río de papel', 'Ana Ríos', NULL, ARRAY['Fantasía', 'fantasia'], ARRAY['Amistad'],
    'Una aventura compartida.', '', 2025, 'es', ARRAY[]::text[], ARRAY[]::text[]
  ) INTO created;
  PERFORM set_config('lexa.vote_book', created.id::text, true);
  IF cardinality(created.genres) <> 1 OR created.description_es <> 'Una aventura compartida.'
    OR created.cover_vote_ends_at <= now() THEN
    RAISE EXCEPTION 'El alta no normalizó términos o no abrió la votación';
  END IF;
  INSERT INTO public.book_cover_candidates(book_id, storage_path, cover_url)
  VALUES (created.id, current_setting('lexa.vote_reader') || '/primera.jpg', 'https://example.org/primera.jpg')
  RETURNING id INTO first_id;
  INSERT INTO public.book_cover_candidates(book_id, storage_path, cover_url)
  VALUES (created.id, current_setting('lexa.vote_reader') || '/segunda.jpg', 'https://example.org/segunda.jpg')
  RETURNING id INTO second_id;
  INSERT INTO public.book_cover_votes(book_id, candidate_id) VALUES (created.id, second_id);
  INSERT INTO public.book_cover_candidates(book_id, storage_path, cover_url)
  VALUES (created.id, current_setting('lexa.vote_reader') || '/tercera.jpg', 'https://example.org/tercera.jpg');
  BEGIN
    INSERT INTO public.book_cover_candidates(book_id, storage_path, cover_url)
    VALUES (created.id, current_setting('lexa.vote_reader') || '/cuarta.jpg', 'https://example.org/cuarta.jpg');
    RAISE EXCEPTION 'La cuarta portada no fue rechazada';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'La cuarta portada no fue rechazada' THEN RAISE; END IF;
  END;
  IF (SELECT votes FROM public.book_cover_ballot(created.id) WHERE id = second_id) <> 1
    OR (SELECT cover_url FROM public.books WHERE id = created.id) <> 'https://example.org/primera.jpg' THEN
    RAISE EXCEPTION 'El voto o la portada provisional no coinciden';
  END IF;
END $$;
RESET ROLE;
UPDATE public.books SET cover_vote_ends_at = now() - interval '1 minute'
WHERE id = current_setting('lexa.vote_book')::uuid;
SELECT lexa_catalog.finalize_covers();
DO $$ BEGIN
  IF (SELECT cover_url FROM public.books WHERE id = current_setting('lexa.vote_book')::uuid)
    <> 'https://example.org/segunda.jpg'
    OR (SELECT cover_finalized_at FROM public.books WHERE id = current_setting('lexa.vote_book')::uuid) IS NULL THEN
    RAISE EXCEPTION 'La portada ganadora no quedó fijada';
  END IF;
END $$;
ROLLBACK;
