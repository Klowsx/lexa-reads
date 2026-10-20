-- Ejercita el contrato de listas contra RLS real sin dejar datos de prueba.
begin;
do $$ declare owner_id uuid:=gen_random_uuid(); other_id uuid:=gen_random_uuid(); b1 uuid:=gen_random_uuid(); b2 uuid:=gen_random_uuid(); b3 uuid:=gen_random_uuid(); begin
 perform set_config('lexa.l_owner',owner_id::text,true); perform set_config('lexa.l_other',other_id::text,true);
 perform set_config('lexa.l_b1',b1::text,true); perform set_config('lexa.l_b2',b2::text,true); perform set_config('lexa.l_b3',b3::text,true);
 insert into auth.users(id) values(owner_id),(other_id);
 update public.users set is_private=false where id in(owner_id,other_id);
 insert into public.books(id,google_books_id,title) values(b1,substr(b1::text,1,20),'Lista libro uno'),(b2,substr(b2::text,1,20),'Lista libro dos'),(b3,substr(b3::text,1,20),'Lista libro tres');
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('lexa.l_owner'),true);
do $$ declare l uuid; begin
 insert into public.lists(user_id,name,description,slug,visibility) values(auth.uid(),'Lecturas de otoño','Una colección',gen_random_uuid()::text,'public') returning id into l;
 perform set_config('lexa.l_id',l::text,true);
 perform public.add_list_book(l,current_setting('lexa.l_b1')::uuid);
 perform public.add_list_book(l,current_setting('lexa.l_b1')::uuid);
 perform public.add_list_book(l,current_setting('lexa.l_b2')::uuid);
 if (select books_count from public.lists where id=l)<>2 or (select count(*) from public.list_books where list_id=l)<>2 then raise exception 'Alta duplicada o contador incorrecto'; end if;
 delete from public.list_books where list_id=l and book_id=current_setting('lexa.l_b1')::uuid;
 perform public.add_list_book(l,current_setting('lexa.l_b3')::uuid);
 if (select position from public.list_books where list_id=l and book_id=current_setting('lexa.l_b3')::uuid)<>2 then raise exception 'El libro no se añadió al final'; end if;
 update public.lists set name='Lecturas favoritas',description=null,is_featured=true where id=l;
 if (select name from public.lists where id=l)<>'Lecturas favoritas' then raise exception 'No se guardó la edición'; end if;
 begin update public.lists set name=' ' where id=l; raise exception 'Se aceptó nombre vacío'; exception when check_violation then null; end;
 begin update public.lists set description=repeat('x',201) where id=l; raise exception 'Se aceptó descripción larga'; exception when check_violation then null; end;
 begin insert into public.lists(user_id,name,slug) values(current_setting('lexa.l_other')::uuid,'Ajena',gen_random_uuid()::text); raise exception 'Creación ajena permitida'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('lexa.l_other'),true);
do $$ declare l uuid:=current_setting('lexa.l_id')::uuid; begin
 if not exists(select 1 from public.lists where id=l) then raise exception 'Lista pública no visible'; end if;
 update public.lists set name='Ataque' where id=l;
 if found then raise exception 'Edición ajena permitida'; end if;
 delete from public.list_books where list_id=l;
 if found then raise exception 'Borrado de libros ajenos permitido'; end if;
 begin perform public.add_list_book(l,current_setting('lexa.l_b1')::uuid); raise exception 'Alta ajena permitida'; exception when insufficient_privilege then null; end;
 delete from public.lists where id=l;
 if found then raise exception 'Borrado ajeno permitido'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('lexa.l_owner'),true);
update public.lists set visibility='private' where id=current_setting('lexa.l_id')::uuid;
select set_config('request.jwt.claim.sub',current_setting('lexa.l_other'),true);
do $$ begin
 if exists(select 1 from public.lists where id=current_setting('lexa.l_id')::uuid) or exists(select 1 from public.list_books where list_id=current_setting('lexa.l_id')::uuid) then raise exception 'Lista privada expuesta'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('lexa.l_owner'),true);
do $$ begin
 delete from public.lists where id=current_setting('lexa.l_id')::uuid;
 if not found then raise exception 'Propietario no pudo eliminar'; end if;
 if exists(select 1 from public.list_books where list_id=current_setting('lexa.l_id')::uuid) then raise exception 'No se eliminaron relaciones'; end if;
 if not exists(select 1 from public.books where id=current_setting('lexa.l_b1')::uuid) then raise exception 'Se eliminó el libro del catálogo'; end if;
end $$;
rollback;
select 'Listas: creación, edición, duplicados, orden, contadores, permisos y borrado correctos' as result;
