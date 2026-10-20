-- Pagina la biblioteca propia sin offsets ni filtros sobre páginas incompletas.
create index if not exists idx_user_books_library_cursor
  on public.user_books (user_id, status, (coalesce(created_at, 'epoch'::timestamptz)) desc, id desc);

-- Busca texto literal en título/autores y aplica los filtros antes del límite.
create function public.search_library(
  p_status public.user_book_status,
  p_search text default '',
  p_rating text default 'all',
  p_tag text default null,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null
)
returns setof public.user_books
language sql stable security invoker set search_path = ''
as $$
  select ub.*
  from public.user_books ub
  join public.books b on b.id = ub.book_id
  where ub.user_id = (select auth.uid())
    and ub.status = p_status
    and (coalesce(trim(p_search), '') = ''
      or strpos(lower(b.title), lower(trim(p_search))) > 0
      or strpos(lower(array_to_string(b.authors, ' ')), lower(trim(p_search))) > 0)
    and (p_rating = 'all'
      or (p_rating = 'rated' and ub.rating is not null)
      or (p_rating = 'unrated' and ub.rating is null))
    and (p_tag is null or p_tag = any(ub.tags))
    and (p_before_created_at is null or
      (coalesce(ub.created_at, 'epoch'::timestamptz), ub.id) < (p_before_created_at, p_before_id))
  order by coalesce(ub.created_at, 'epoch'::timestamptz) desc, ub.id desc
  limit 25; -- 24 libros visibles y uno adicional para saber si existe otra página.
$$;

-- Calcula contadores y etiquetas completos sin descargar toda la biblioteca al cliente.
create function public.library_summary()
returns table(status public.user_book_status, total bigint, tags text[])
language sql stable security invoker set search_path = ''
as $$
  select ub.status, count(distinct ub.id),
    coalesce(array_agg(distinct tag order by tag) filter (where tag is not null and trim(tag) <> ''), '{}')
  from public.user_books ub
  left join lateral unnest(ub.tags) tag on true
  where ub.user_id = (select auth.uid())
  group by ub.status;
$$;

revoke all on function public.search_library(public.user_book_status, text, text, text, timestamptz, uuid) from public, anon;
revoke all on function public.library_summary() from public, anon;
grant execute on function public.search_library(public.user_book_status, text, text, text, timestamptz, uuid) to authenticated;
grant execute on function public.library_summary() to authenticated;
