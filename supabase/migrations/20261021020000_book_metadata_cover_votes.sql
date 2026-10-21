-- Una ficha conserva el título original y permite descripciones en ambos idiomas.
ALTER TABLE public.books ADD COLUMN description_es text;
ALTER TABLE public.books ADD COLUMN description_en text;
UPDATE public.books SET description_es = description WHERE language = 'es' AND description IS NOT NULL;
UPDATE public.books SET description_en = description WHERE language = 'en' AND description IS NOT NULL;

-- El valor canónico evita duplicados por mayúsculas, espacios y tildes.
CREATE FUNCTION public.normalize_catalog_term(value text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT trim(regexp_replace(
    translate(lower(coalesce(value, '')), 'áéíóúüñàèìòùäëïöü', 'aeiouunaeiouaeiou'),
    '[[:space:]]+', ' ', 'g'
  ));
$$;

CREATE TABLE public.catalog_terms (
  kind text NOT NULL CHECK (kind IN ('genre', 'tag')),
  value text NOT NULL CHECK (length(trim(value)) BETWEEN 1 AND 60),
  normalized text GENERATED ALWAYS AS (public.normalize_catalog_term(value)) STORED,
  label_es text,
  label_en text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, normalized)
);
ALTER TABLE public.catalog_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vocabulario visible" ON public.catalog_terms FOR SELECT USING (true);
CREATE POLICY "Lectores proponen terminos" ON public.catalog_terms FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());
GRANT SELECT, INSERT ON public.catalog_terms TO authenticated;

-- Conserva géneros y etiquetas de fichas anteriores como opciones de búsqueda.
UPDATE public.books SET genres = array_replace(array_replace(array_replace(
  array_replace(array_replace(genres, 'Fantasía', 'Fantasy'), 'Misterio', 'Mystery'),
  'Ciencia ficción', 'Science Fiction'), 'Memorias', 'Memoir'),
  'Realismo mágico', 'Magical Realism')
WHERE genres && ARRAY['Fantasía', 'Misterio', 'Ciencia ficción', 'Memorias', 'Realismo mágico'];
INSERT INTO public.catalog_terms(kind, value, label_en)
SELECT DISTINCT ON (kind, public.normalize_catalog_term(value)) kind, value, value
FROM (
  SELECT 'genre'::text AS kind, trim(g.value) AS value
  FROM public.books b CROSS JOIN LATERAL unnest(b.genres) g(value)
  UNION ALL
  SELECT 'tag'::text, trim(t.value)
  FROM public.books b CROSS JOIN LATERAL unnest(b.tags) t(value)
) existing
WHERE public.normalize_catalog_term(value) <> ''
ORDER BY kind, public.normalize_catalog_term(value), value
ON CONFLICT DO NOTHING;
UPDATE public.catalog_terms SET label_es = CASE value
  WHEN 'Fantasy' THEN 'Fantasía'
  WHEN 'Mystery' THEN 'Misterio'
  WHEN 'Romance' THEN 'Romance'
  WHEN 'Science Fiction' THEN 'Ciencia ficción'
  WHEN 'Memoir' THEN 'Memorias'
  WHEN 'Magical Realism' THEN 'Realismo mágico'
END WHERE kind = 'genre' AND value IN
  ('Fantasy', 'Mystery', 'Romance', 'Science Fiction', 'Memoir', 'Magical Realism');

DROP FUNCTION public.catalog_facets();
CREATE FUNCTION public.catalog_facets()
RETURNS TABLE(kind text, value text, label_es text, label_en text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT t.kind, t.value, t.label_es, t.label_en
  FROM public.catalog_terms t ORDER BY t.kind, t.value;
$$;
GRANT EXECUTE ON FUNCTION public.catalog_facets() TO authenticated;

-- Solo las fichas nuevas abren una votación; las heredadas conservan su portada.
ALTER TABLE public.books ADD COLUMN cover_vote_ends_at timestamptz;
ALTER TABLE public.books ADD COLUMN cover_finalized_at timestamptz;
ALTER TABLE public.books ALTER COLUMN cover_vote_ends_at SET DEFAULT (now() + interval '7 days');
ALTER TABLE public.books ADD CONSTRAINT community_books_need_description CHECK (
  google_books_id IS NOT NULL OR nullif(trim(description_es), '') IS NOT NULL
  OR nullif(trim(description_en), '') IS NOT NULL
) NOT VALID;
DROP POLICY "Usuario autenticado inserta libros atribuidos a sí mismo" ON public.books;
CREATE POLICY "Lectores crean fichas con votacion de siete dias" ON public.books FOR INSERT
TO authenticated WITH CHECK (
  added_by = auth.uid() AND cover_finalized_at IS NULL
  AND cover_vote_ends_at BETWEEN now() + interval '6 days' AND now() + interval '8 days'
);

CREATE TABLE public.book_cover_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  storage_path text NOT NULL UNIQUE,
  cover_url text NOT NULL,
  added_by uuid REFERENCES public.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (book_id, id)
);
CREATE INDEX idx_cover_candidates_book ON public.book_cover_candidates(book_id, created_at);
ALTER TABLE public.book_cover_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Portadas propuestas visibles" ON public.book_cover_candidates FOR SELECT USING (true);
CREATE POLICY "Lectores proponen portadas durante votacion" ON public.book_cover_candidates
FOR INSERT TO authenticated WITH CHECK (
  added_by = auth.uid()
  AND starts_with(storage_path, auth.uid()::text || '/')
  AND EXISTS (SELECT 1 FROM public.books b WHERE b.id = book_id
    AND b.cover_vote_ends_at > now() AND b.cover_finalized_at IS NULL)
);
GRANT SELECT, INSERT ON public.book_cover_candidates TO authenticated;

-- La primera propuesta se muestra provisionalmente si el libro nació sin imagen.
CREATE SCHEMA IF NOT EXISTS lexa_catalog;
CREATE FUNCTION lexa_catalog.show_first_cover()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.books SET cover_url = NEW.cover_url
  WHERE id = NEW.book_id AND cover_url IS NULL AND cover_finalized_at IS NULL;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION lexa_catalog.show_first_cover() FROM PUBLIC;
CREATE TRIGGER show_first_community_cover AFTER INSERT ON public.book_cover_candidates
FOR EACH ROW EXECUTE FUNCTION lexa_catalog.show_first_cover();

-- Limita a tres propuestas por lector y libro para evitar cargas ilimitadas.
CREATE FUNCTION lexa_catalog.limit_cover_proposals()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM 1 FROM public.books WHERE id = NEW.book_id FOR UPDATE;
  IF (SELECT count(*) FROM public.book_cover_candidates
      WHERE book_id = NEW.book_id AND added_by = NEW.added_by) >= 3 THEN
    RAISE EXCEPTION 'Ya propusiste tres portadas para este libro';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION lexa_catalog.limit_cover_proposals() FROM PUBLIC;
CREATE TRIGGER limit_community_covers BEFORE INSERT ON public.book_cover_candidates
FOR EACH ROW EXECUTE FUNCTION lexa_catalog.limit_cover_proposals();

CREATE TABLE public.book_cover_votes (
  book_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (book_id, user_id),
  FOREIGN KEY (book_id, candidate_id)
    REFERENCES public.book_cover_candidates(book_id, id) ON DELETE CASCADE
);
CREATE INDEX idx_cover_votes_candidate ON public.book_cover_votes(candidate_id);
ALTER TABLE public.book_cover_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votos de portada visibles" ON public.book_cover_votes FOR SELECT USING (true);
CREATE POLICY "Lectores votan durante votacion" ON public.book_cover_votes
FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.books b WHERE b.id = book_id
    AND b.cover_vote_ends_at > now() AND b.cover_finalized_at IS NULL
  )
);
CREATE POLICY "Lectores cambian su voto durante votacion" ON public.book_cover_votes
FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (
  user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.books b WHERE b.id = book_id
    AND b.cover_vote_ends_at > now() AND b.cover_finalized_at IS NULL
  )
);
GRANT SELECT, INSERT, UPDATE ON public.book_cover_votes TO authenticated;

-- Una propuesta ya registrada no puede desaparecer durante ni después de la votación.
DROP POLICY "Lectores retiran portadas propias" ON storage.objects;
CREATE POLICY "Lectores retiran cargas sin ficha" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'book-covers' AND owner_id = auth.uid()::text
  AND NOT EXISTS (SELECT 1 FROM public.book_cover_candidates c WHERE c.storage_path = name)
);

-- Inserta la ficha, sus términos y sus primeras portadas en una sola transacción.
CREATE FUNCTION public.create_community_book(
  p_title text, p_author text, p_isbn_13 text,
  p_genres text[], p_tags text[], p_description_es text, p_description_en text,
  p_published_year integer, p_locale text, p_cover_paths text[], p_cover_urls text[]
)
RETURNS public.books LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE result public.books; term text; canonical text; genres text[] := '{}'; tags text[] := '{}'; i integer;
BEGIN
  IF auth.uid() IS NULL OR length(trim(p_title)) = 0 OR length(trim(p_author)) = 0
    OR (nullif(trim(p_description_es), '') IS NULL AND nullif(trim(p_description_en), '') IS NULL)
    OR cardinality(p_genres) > 8 OR cardinality(p_tags) > 12
    OR cardinality(p_cover_paths) <> cardinality(p_cover_urls) OR cardinality(p_cover_paths) > 3
    OR p_locale NOT IN ('es', 'en') THEN
    RAISE EXCEPTION 'Datos incompletos o límites de catálogo excedidos';
  END IF;
  FOREACH term IN ARRAY p_genres LOOP
    IF length(trim(term)) NOT BETWEEN 1 AND 60 THEN RAISE EXCEPTION 'Categoría inválida'; END IF;
    INSERT INTO public.catalog_terms(kind, value, label_es, label_en)
    VALUES ('genre', trim(term), CASE WHEN p_locale = 'es' THEN trim(term) END,
      CASE WHEN p_locale = 'en' THEN trim(term) END) ON CONFLICT DO NOTHING;
    SELECT value INTO canonical FROM public.catalog_terms
      WHERE kind = 'genre' AND normalized = public.normalize_catalog_term(term);
    IF NOT canonical = ANY(genres) THEN genres := array_append(genres, canonical); END IF;
  END LOOP;
  FOREACH term IN ARRAY p_tags LOOP
    IF length(trim(term)) NOT BETWEEN 1 AND 60 THEN RAISE EXCEPTION 'Etiqueta inválida'; END IF;
    INSERT INTO public.catalog_terms(kind, value, label_es, label_en)
    VALUES ('tag', trim(term), CASE WHEN p_locale = 'es' THEN trim(term) END,
      CASE WHEN p_locale = 'en' THEN trim(term) END) ON CONFLICT DO NOTHING;
    SELECT value INTO canonical FROM public.catalog_terms
      WHERE kind = 'tag' AND normalized = public.normalize_catalog_term(term);
    IF NOT canonical = ANY(tags) THEN tags := array_append(tags, canonical); END IF;
  END LOOP;
  INSERT INTO public.books(title, authors, isbn_13, genres, tags, description,
    description_es, description_en, published_year, cover_url, google_books_id)
  VALUES (trim(p_title), ARRAY[trim(p_author)], nullif(p_isbn_13, ''), genres, tags,
    coalesce(nullif(trim(p_description_es), ''), nullif(trim(p_description_en), '')),
    nullif(trim(p_description_es), ''), nullif(trim(p_description_en), ''), p_published_year,
    p_cover_urls[1], NULL) RETURNING * INTO result;
  FOR i IN 1..cardinality(p_cover_paths) LOOP
    INSERT INTO public.book_cover_candidates(book_id, storage_path, cover_url)
    VALUES (result.id, p_cover_paths[i], p_cover_urls[i]);
  END LOOP;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_community_book(
  text, text, text, text[], text[], text, text, integer, text, text[], text[]
) TO authenticated;

-- Devuelve el recuento y el voto propio sin exponer una lista de votantes.
CREATE FUNCTION public.book_cover_ballot(p_book_id uuid)
RETURNS TABLE(id uuid, cover_url text, votes bigint, selected_by_me boolean, added_by uuid)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT c.id, c.cover_url, count(v.user_id),
    coalesce(bool_or(v.user_id = auth.uid()), false), c.added_by
  FROM public.book_cover_candidates c
  LEFT JOIN public.book_cover_votes v ON v.candidate_id = c.id
  WHERE c.book_id = p_book_id
  GROUP BY c.id ORDER BY count(v.user_id) DESC, c.created_at, c.id;
$$;
GRANT EXECUTE ON FUNCTION public.book_cover_ballot(uuid) TO authenticated;

-- Cierra las votaciones; en empate gana la propuesta más antigua.
CREATE FUNCTION lexa_catalog.finalize_covers()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  WITH due AS (
    SELECT b.id,
      (SELECT c.cover_url FROM public.book_cover_candidates c
       LEFT JOIN public.book_cover_votes v ON v.candidate_id = c.id
       WHERE c.book_id = b.id
       GROUP BY c.id ORDER BY count(v.user_id) DESC, c.created_at, c.id LIMIT 1) AS winner
    FROM public.books b
    WHERE b.cover_vote_ends_at <= now() AND b.cover_finalized_at IS NULL
  )
  UPDATE public.books b SET cover_url = coalesce(due.winner, b.cover_url), cover_finalized_at = now()
  FROM due WHERE b.id = due.id;
END;
$$;
REVOKE ALL ON FUNCTION lexa_catalog.finalize_covers() FROM PUBLIC;
SELECT cron.schedule('lexa-finalize-book-covers', '0 * * *', $$
  SELECT lexa_catalog.finalize_covers();
$$);
