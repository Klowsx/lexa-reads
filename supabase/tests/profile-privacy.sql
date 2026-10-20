-- Comprueba autorización y contadores con usuarios reales de prueba y revierte todos los datos.
begin;
do $$ declare owner_id uuid:=gen_random_uuid(); reader_id uuid:=gen_random_uuid(); outsider_id uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); l uuid:=gen_random_uuid(); begin
  perform set_config('lexa.p_owner',owner_id::text,true); perform set_config('lexa.p_reader',reader_id::text,true); perform set_config('lexa.p_outsider',outsider_id::text,true); perform set_config('lexa.p_book',b::text,true); perform set_config('lexa.p_list',l::text,true);
  insert into auth.users(id) values(owner_id),(reader_id),(outsider_id);
  update public.users set is_private=true where id=owner_id;
  insert into public.books(id,google_books_id,title) values(b,substr(replace(b::text,'-',''),1,20),'Lectura protegida');
  insert into public.user_books(user_id,book_id,status,finished_at) values(owner_id,b,'read',current_date);
  insert into public.reviews(user_id,book_id,body,is_published) values(owner_id,b,'Reseña privada suficientemente larga.',true);
  insert into public.lists(id,user_id,name,slug,visibility) values(l,owner_id,'Lista protegida',l::text,'public');
  insert into public.list_books(list_id,book_id,position) values(l,b,0);
  insert into public.lists(user_id,name,slug,visibility) values(owner_id,'Lista solo para mí',gen_random_uuid()::text,'private');
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('lexa.p_reader'),true);
do $$ declare follow_id uuid; begin
  -- La inserción maliciosa de accepted se convierte en pending por la privacidad real del destinatario.
  insert into public.follows(follower_id,following_id,status) values(auth.uid(),current_setting('lexa.p_owner')::uuid,'accepted') returning id into follow_id;
  perform set_config('lexa.p_follow',follow_id::text,true);
  if (select status from public.follows where id=follow_id)<>'pending' then raise exception 'El cliente pudo aceptar un perfil privado'; end if;
  if (select following_count from public.users where id=auth.uid())<>0 then raise exception 'Una solicitud pendiente aumentó el contador'; end if;
  update public.follows set status='accepted' where id=follow_id;
  if found then raise exception 'El solicitante aprobó su propia solicitud'; end if;
  if public.can_view_user_content(current_setting('lexa.p_owner')::uuid) then raise exception 'Solicitud pendiente concedió acceso'; end if;
  if exists(select 1 from public.user_books where user_id=current_setting('lexa.p_owner')::uuid) or exists(select 1 from public.reviews where user_id=current_setting('lexa.p_owner')::uuid) or exists(select 1 from public.lists where user_id=current_setting('lexa.p_owner')::uuid) or exists(select 1 from public.list_books where list_id=current_setting('lexa.p_list')::uuid) then raise exception 'Contenido privado visible con solicitud pendiente'; end if;
  begin insert into public.follows(follower_id,following_id) values(auth.uid(),auth.uid()); raise exception 'Permitió seguirse a sí mismo'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('lexa.p_outsider'),true);
do $$ begin
  if exists(select 1 from public.follows where id=current_setting('lexa.p_follow')::uuid) then raise exception 'Un tercero leyó una solicitud privada'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('lexa.p_owner'),true);
do $$ begin
  begin update public.follows set follower_id=auth.uid() where id=current_setting('lexa.p_follow')::uuid; raise exception 'El destinatario cambió la identidad'; exception when invalid_parameter_value then null; end;
  update public.follows set status='accepted' where id=current_setting('lexa.p_follow')::uuid;
  if not found then raise exception 'El destinatario no pudo aprobar'; end if;
  if (select followers_count from public.users where id=auth.uid())<>1 then raise exception 'Aprobar no incrementó el contador'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('lexa.p_reader'),true);
do $$ begin
  if not public.can_view_user_content(current_setting('lexa.p_owner')::uuid) then raise exception 'Seguidor aceptado sin acceso'; end if;
  if (select count(*) from public.lists where user_id=current_setting('lexa.p_owner')::uuid)<>1 or not exists(select 1 from public.list_books where list_id=current_setting('lexa.p_list')::uuid) or not exists(select 1 from public.reviews where user_id=current_setting('lexa.p_owner')::uuid) then raise exception 'Acceso aceptado incorrecto o lista privada expuesta'; end if;
  delete from public.follows where id=current_setting('lexa.p_follow')::uuid;
  if public.can_view_user_content(current_setting('lexa.p_owner')::uuid) then raise exception 'Dejar de seguir conservó permisos'; end if;
  if (select following_count from public.users where id=auth.uid())<>0 then raise exception 'Dejar de seguir no redujo contador'; end if;
  insert into public.follows(follower_id,following_id) values(auth.uid(),current_setting('lexa.p_owner')::uuid);
end $$;
select set_config('request.jwt.claim.sub',current_setting('lexa.p_owner'),true);
do $$ begin
  delete from public.follows where follower_id=current_setting('lexa.p_reader')::uuid and following_id=auth.uid();
  if not found then raise exception 'No pudo rechazar solicitud recibida'; end if;
  if (select followers_count from public.users where id=auth.uid())<>0 then raise exception 'Rechazar alteró el contador'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('lexa.p_reader'),true);
do $$ begin
  insert into public.follows(follower_id,following_id,status) values(auth.uid(),current_setting('lexa.p_outsider')::uuid,'pending');
  if not exists(select 1 from public.follows where follower_id=auth.uid() and following_id=current_setting('lexa.p_outsider')::uuid and status='accepted') then raise exception 'Perfil público no fue aceptado por el servidor'; end if;
  insert into public.follows(follower_id,following_id) values(auth.uid(),current_setting('lexa.p_owner')::uuid);
end $$;
select set_config('request.jwt.claim.sub',current_setting('lexa.p_owner'),true);
do $$ begin
  update public.follows set status='accepted' where follower_id=current_setting('lexa.p_reader')::uuid and following_id=auth.uid();
  insert into public.user_blocks(blocker_id,blocked_id) values(auth.uid(),current_setting('lexa.p_reader')::uuid);
  if (select followers_count from public.users where id=auth.uid())<>0 then raise exception 'Bloquear conservó el seguimiento'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('lexa.p_reader'),true);
do $$ begin
  if public.can_view_user_content(current_setting('lexa.p_owner')::uuid) then raise exception 'Bloqueado conservó acceso'; end if;
  begin insert into public.follows(follower_id,following_id) values(auth.uid(),current_setting('lexa.p_owner')::uuid); raise exception 'Permitió seguir pese al bloqueo'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('lexa.p_owner'),true);
delete from public.user_blocks where blocker_id=auth.uid() and blocked_id=current_setting('lexa.p_reader')::uuid;
select set_config('request.jwt.claim.sub',current_setting('lexa.p_reader'),true);
do $$ begin
  if public.can_view_user_content(current_setting('lexa.p_owner')::uuid) or exists(select 1 from public.follows where follower_id=auth.uid() and following_id=current_setting('lexa.p_owner')::uuid) then raise exception 'Desbloquear restauró permisos'; end if;
end $$;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$ begin
  if public.can_view_user_content(current_setting('lexa.p_owner')::uuid) or exists(select 1 from public.lists where user_id=current_setting('lexa.p_owner')::uuid) then raise exception 'Anon obtuvo contenido privado'; end if;
  if public.can_view_user_content(gen_random_uuid()) then raise exception 'Perfil inexistente concedió acceso'; end if;
end $$;
set local role postgres;
do $$ declare reader_id uuid; begin
  -- Las fechas now() empatan dentro de la transacción; así se prueba el desempate real del cursor.
  for i in 1..36 loop
    reader_id:=gen_random_uuid();
    insert into auth.users(id) values(reader_id);
    perform set_config('request.jwt.claim.sub',reader_id::text,true);
    insert into public.follows(follower_id,following_id) values(reader_id,current_setting('lexa.p_outsider')::uuid);
  end loop;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('lexa.p_outsider'),true);
do $$ declare ids uuid[]:='{}'; next_ids uuid[]; cursor_id uuid; cursor_date timestamptz; page_count int:=0; begin
  loop
    select array_agg(id order by created_at desc,id desc) into next_ids from (
      select id,created_at from public.follows where following_id=auth.uid() and status='accepted'
      and (cursor_id is null or (created_at,id)<(cursor_date,cursor_id)) order by created_at desc,id desc limit 30
    ) page;
    exit when next_ids is null;
    if ids && next_ids then raise exception 'El cursor repitió personas'; end if;
    ids:=ids||next_ids; cursor_id:=next_ids[array_length(next_ids,1)];
    select created_at into cursor_date from public.follows where id=cursor_id;
    page_count:=page_count+1;
    if page_count>2 then raise exception 'El cursor no finalizó'; end if;
  end loop;
  if array_length(ids,1)<>37 or page_count<>2 then raise exception 'El cursor omitió seguidores con fechas empatadas'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('lexa.p_owner'),true);
update public.users set is_private=false where id=auth.uid();
select set_config('request.jwt.claim.sub',current_setting('lexa.p_reader'),true);
do $$ begin
  if not public.can_view_user_content(current_setting('lexa.p_owner')::uuid) then raise exception 'Hacer público el perfil no abrió el contenido'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('lexa.p_owner'),true);
update public.users set is_private=true where id=auth.uid();
select set_config('request.jwt.claim.sub',current_setting('lexa.p_reader'),true);
do $$ begin
  if public.can_view_user_content(current_setting('lexa.p_owner')::uuid) then raise exception 'Volver a privado mantuvo acceso público'; end if;
end $$;
rollback;
