-- Verifica filtros, cursor con empates y aislamiento real. Todos los datos se revierten.
begin;
do $$ declare owner_id uuid := gen_random_uuid(); other_id uuid := gen_random_uuid(); b uuid; begin
  perform set_config('lexa.library_owner', owner_id::text, true);
  perform set_config('lexa.library_other', other_id::text, true);
  insert into auth.users(id) values(owner_id), (other_id);
  for i in 1..55 loop
    b := gen_random_uuid();
    insert into public.books(id,google_books_id,title,authors)
      values(b,substr(replace(b::text,'-',''),1,20),case when i=55 then '100% real' else 'Lectura '||i end,array['Autora de prueba']);
    insert into public.user_books(user_id,book_id,status,rating,tags,created_at)
      values(owner_id,b,'reading',case when i%2=0 then 4.5 else null end,
        case when i=55 then array['última página'] else array['favoritos','verano'] end,'2026-10-20T10:00:00Z');
    if i=1 then insert into public.user_books(user_id,book_id,status) values(other_id,b,'reading'); end if;
  end loop;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('lexa.library_owner'),true);
do $$ declare cursor_row public.user_books; ids uuid[] := '{}'; page_ids uuid[]; page_count int := 0; begin
  -- Cada página usa el último registro visible; la fila 25 es solamente una señal de continuación.
  loop
    select array_agg(id) into page_ids from (
      select id from public.search_library('reading',p_before_created_at=>cursor_row.created_at,p_before_id=>cursor_row.id) limit 24
    ) page;
    exit when page_ids is null;
    if ids && page_ids then raise exception 'El cursor repitió registros con la misma fecha'; end if;
    ids := ids || page_ids;
    select * into cursor_row from public.user_books where id=page_ids[array_length(page_ids,1)];
    page_count := page_count+1;
    if page_count>3 then raise exception 'La paginación no termina'; end if;
  end loop;
  if array_length(ids,1)<>55 or page_count<>3 then raise exception 'El cursor omitió registros'; end if;
  if (select total from public.library_summary() where status='reading')<>55 then raise exception 'Resumen contó etiquetas duplicadas'; end if;
  if not (select tags @> array['última página'] from public.library_summary() where status='reading') then raise exception 'Falta etiqueta fuera de la primera página'; end if;
  if (select count(*) from public.search_library('reading',p_search=>'AUTORA'))<>25 then raise exception 'No busca autor sin distinguir mayúsculas'; end if;
  if (select count(*) from public.search_library('reading',p_search=>'%'))<>1 then raise exception 'El texto se interpretó como comodín'; end if;
  if exists(select 1 from public.search_library('reading',p_rating=>'rated') where rating is null) then raise exception 'Filtro con puntuación incorrecto'; end if;
  if exists(select 1 from public.search_library('reading',p_rating=>'unrated') where rating is not null) then raise exception 'Filtro sin puntuación incorrecto'; end if;
  if (select count(*) from public.search_library('reading',p_tag=>'última página'))<>1 then raise exception 'Filtro de etiqueta incorrecto'; end if;
  if exists(select 1 from public.search_library('read')) then raise exception 'Filtro de estado incorrecto'; end if;
  if exists(select 1 from public.search_library('reading',p_search=>'inexistente')) then raise exception 'Filtro sin coincidencias incorrecto'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('lexa.library_other'),true);
do $$ begin
  if (select total from public.library_summary() where status='reading')<>1 or (select count(*) from public.search_library('reading'))<>1 then raise exception 'Una cuenta accedió a otra biblioteca'; end if;
end $$;
set local role anon;
do $$ begin
  begin perform public.library_summary(); raise exception 'Anon ejecutó resumen'; exception when insufficient_privilege then null; end;
  begin perform public.search_library('reading'); raise exception 'Anon ejecutó búsqueda'; exception when insufficient_privilege then null; end;
end $$;
rollback;
