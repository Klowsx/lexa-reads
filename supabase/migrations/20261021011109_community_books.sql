-- El catálogo admite libros creados en Lexa y conserva las claves antiguas para enlaces existentes.
ALTER TABLE public.books ALTER COLUMN google_books_id DROP NOT NULL;
ALTER TABLE public.books ADD COLUMN tags text[] NOT NULL DEFAULT '{}';
CREATE INDEX idx_books_catalog_genres ON public.books USING gin(genres);
CREATE INDEX idx_books_catalog_tags ON public.books USING gin(tags);

-- Evita que dos altas comunitarias creen fichas con el mismo ISBN-13.
CREATE UNIQUE INDEX idx_books_community_isbn13
ON public.books(isbn_13)
WHERE google_books_id IS NULL AND isbn_13 IS NOT NULL;

-- La búsqueda cruza título, autor e ISBN y pagina con un cursor estable.
CREATE OR REPLACE FUNCTION public.search_catalog(
  p_search text DEFAULT '',
  p_genres text[] DEFAULT '{}',
  p_tags text[] DEFAULT '{}',
  p_year_from integer DEFAULT NULL,
  p_year_to integer DEFAULT NULL,
  p_before_rank integer DEFAULT NULL,
  p_before_created_at timestamptz DEFAULT NULL,
  p_before_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 21
)
RETURNS SETOF public.books
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT b.* FROM public.books b
  CROSS JOIN LATERAL (
    SELECT CASE
      WHEN length(trim(p_search)) = 0 THEN 0
      WHEN lower(b.isbn_10) = lower(regexp_replace(p_search, '[^0-9Xx]', '', 'g'))
        OR b.isbn_13 = regexp_replace(p_search, '[^0-9]', '', 'g') THEN 4
      WHEN lower(b.title) = lower(trim(p_search)) THEN 3
      WHEN starts_with(lower(b.title), lower(trim(p_search))) THEN 2
      WHEN EXISTS (SELECT 1 FROM unnest(b.authors) a WHERE starts_with(lower(a), lower(trim(p_search)))) THEN 1
      ELSE 0
    END AS rank
  ) relevance
  WHERE (
    length(trim(p_search)) = 0
    OR position(lower(trim(p_search)) in lower(b.title)) > 0
    OR EXISTS (SELECT 1 FROM unnest(b.authors) a WHERE position(lower(trim(p_search)) in lower(a)) > 0)
    OR lower(b.isbn_10) = lower(regexp_replace(p_search, '[^0-9Xx]', '', 'g'))
    OR b.isbn_13 = regexp_replace(p_search, '[^0-9]', '', 'g')
  )
  AND (cardinality(p_genres) = 0 OR b.genres && p_genres)
  AND (cardinality(p_tags) = 0 OR b.tags && p_tags)
  AND (p_year_from IS NULL OR b.published_year >= p_year_from)
  AND (p_year_to IS NULL OR b.published_year <= p_year_to)
  AND (p_before_created_at IS NULL OR relevance.rank < p_before_rank
    OR (relevance.rank = p_before_rank AND (b.created_at, b.id) < (p_before_created_at, p_before_id)))
  ORDER BY relevance.rank DESC, b.created_at DESC, b.id DESC
  LIMIT least(greatest(p_limit, 1), 51);
$$;
GRANT EXECUTE ON FUNCTION public.search_catalog(text, text[], text[], integer, integer, integer, timestamptz, uuid, integer) TO authenticated;

-- Ofrece opciones reales del catálogo para que los filtros crezcan sin listas fijas.
CREATE FUNCTION public.catalog_facets()
RETURNS TABLE(kind text, value text)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT DISTINCT 'genre'::text AS kind, trim(g.value) AS value
  FROM public.books b CROSS JOIN LATERAL unnest(b.genres) g(value)
  WHERE trim(g.value) <> ''
  UNION
  SELECT DISTINCT 'tag'::text, trim(t.value)
  FROM public.books b CROSS JOIN LATERAL unnest(b.tags) t(value)
  WHERE trim(t.value) <> ''
  UNION
  SELECT DISTINCT 'language'::text, trim(b.language)
  FROM public.books b
  WHERE b.language IS NOT NULL AND trim(b.language) <> ''
  ORDER BY kind, value;
$$;
GRANT EXECUTE ON FUNCTION public.catalog_facets() TO authenticated;

-- Una sola portada pública por ficha, con carga limitada y atribuida al lector.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('book-covers', 'book-covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Lectores suben portadas propias"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'book-covers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Lectores retiran portadas propias"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'book-covers' AND owner_id = auth.uid()::text);

CREATE POLICY "Moderacion retira portadas"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'book-covers'
  AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin)
);
