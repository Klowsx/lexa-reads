-- Mantiene los límites del formulario también para clientes que escriben directamente.
alter table public.lists add constraint lists_name_length check (char_length(btrim(name)) between 2 and 60) not valid;
alter table public.lists add constraint lists_description_length check (char_length(coalesce(description,'')) <= 200) not valid;
alter table public.lists validate constraint lists_name_length;
alter table public.lists validate constraint lists_description_length;

-- Serializa las altas por lista y conserva el orden cuando se quitan libros intermedios.
-- SECURITY INVOKER mantiene los permisos RLS del usuario autenticado.
create or replace function public.add_list_book(target_list uuid, target_book uuid)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  perform 1 from public.lists where id=target_list and user_id=(select auth.uid()) for update;
  if not found then raise exception 'Lista no disponible' using errcode='42501'; end if;
  insert into public.list_books(list_id,book_id,position)
  select target_list,target_book,coalesce(max(position),-1)+1 from public.list_books where list_id=target_list
  on conflict(list_id,book_id) do nothing;
end;
$$;
revoke all on function public.add_list_book(uuid,uuid) from public, anon;
grant execute on function public.add_list_book(uuid,uuid) to authenticated;
