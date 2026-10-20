-- Unifica el acceso sin recursión entre users, follows y las tablas de contenido.
create or replace function lexa_social.can_view_profile_content(target uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.users u where u.id=target and u.deleted_at is null
    and not public.is_blocked_with(u.id)
    and (u.id=(select auth.uid()) or not coalesce(u.is_private,false)
      or exists(select 1 from public.follows f where f.follower_id=(select auth.uid()) and f.following_id=u.id and f.status='accepted')));
$$;
revoke all on function lexa_social.can_view_profile_content(uuid) from public;
grant usage on schema lexa_social to anon, authenticated;
grant execute on function lexa_social.can_view_profile_content(uuid) to anon, authenticated;
create or replace function public.can_view_user_content(target uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select lexa_social.can_view_profile_content(target);
$$;

update public.follows set created_at='epoch'::timestamptz where created_at is null;

-- Decide el estado inicial en el servidor y permite aprobar solamente al destinatario.
create function lexa_social.validate_follow()
returns trigger language plpgsql security definer set search_path = '' as $$
declare target_private boolean;
begin
  if auth.uid() is null then raise exception 'Se requiere una sesión' using errcode='42501'; end if;
  if tg_op='UPDATE' then
    if new.id<>old.id or new.follower_id<>old.follower_id or new.following_id<>old.following_id or new.created_at is distinct from old.created_at then
      raise exception 'No se puede cambiar la identidad del seguimiento' using errcode='22023';
    end if;
    if auth.uid()<>old.following_id or old.status<>'pending' or new.status<>'accepted' then
      raise exception 'Solo el destinatario puede aprobar una solicitud' using errcode='42501';
    end if;
    if public.is_blocked_with(old.follower_id) then raise exception 'Seguimiento no disponible' using errcode='42501'; end if;
    new.accepted_at:=now();
  else
    if new.follower_id<>auth.uid() or new.following_id=auth.uid() then raise exception 'Seguimiento inválido' using errcode='42501'; end if;
    select coalesce(is_private,false) into target_private from public.users where id=new.following_id and deleted_at is null;
    if not found or public.is_blocked_with(new.following_id) then raise exception 'Perfil no disponible' using errcode='42501'; end if;
    if not exists(select 1 from public.users where id=auth.uid() and deleted_at is null) then raise exception 'Cuenta no disponible' using errcode='42501'; end if;
    new.status:=case when target_private then 'pending'::public.follow_status else 'accepted'::public.follow_status end;
    new.accepted_at:=case when target_private then null else now() end;
    new.created_at:=now();
  end if;
  return new;
end $$;
revoke all on function lexa_social.validate_follow() from public,anon,authenticated;
create trigger validate_follow before insert or update on public.follows for each row execute function lexa_social.validate_follow();

drop policy "Follows visibles para todos" on public.follows;
create policy "Seguimientos visibles según privacidad" on public.follows for select using (
  not public.is_blocked_with(follower_id) and not public.is_blocked_with(following_id)
  and (auth.uid() in (follower_id,following_id) or (status='accepted' and public.can_view_user_content(follower_id) and public.can_view_user_content(following_id)))
);
create policy "Destinatario acepta solicitudes" on public.follows for update to authenticated
  using (following_id=(select auth.uid()) and status='pending') with check (following_id=(select auth.uid()) and status='accepted');
drop policy "Usuario elimina sus propios follows" on public.follows;
create policy "Participantes retiran seguimiento" on public.follows for delete to authenticated using ((select auth.uid()) in (follower_id,following_id));

-- Solo los seguimientos aceptados afectan a los contadores; aprobar no equivale a insertar otro.
create function lexa_social.update_follow_counts()
returns trigger language plpgsql security definer set search_path = '' as $$
declare delta integer:=0; actor uuid; target uuid;
begin
  if tg_op='INSERT' then delta:=case when new.status='accepted' then 1 else 0 end;
  elsif tg_op='DELETE' then delta:=case when old.status='accepted' then -1 else 0 end;
  else delta:=(case when new.status='accepted' then 1 else 0 end)-(case when old.status='accepted' then 1 else 0 end); end if;
  if tg_op='DELETE' then actor:=old.follower_id; target:=old.following_id; else actor:=new.follower_id; target:=new.following_id; end if;
  if delta<>0 then
    update public.users set following_count=greatest(0,coalesce(following_count,0)+delta) where id=actor;
    update public.users set followers_count=greatest(0,coalesce(followers_count,0)+delta) where id=target;
  end if;
  return null;
end $$;
revoke all on function lexa_social.update_follow_counts() from public,anon,authenticated;
drop trigger trg_follow_counts on public.follows;
drop function public.update_follow_counts();
create trigger trg_follow_counts after insert or update of status or delete on public.follows for each row execute function lexa_social.update_follow_counts();
update public.users u set followers_count=(select count(*) from public.follows f where f.following_id=u.id and f.status='accepted'),
  following_count=(select count(*) from public.follows f where f.follower_id=u.id and f.status='accepted');

-- El bloqueo revoca también los seguimientos para que desbloquear no restaure permisos anteriores.
create function lexa_social.remove_blocked_follows()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.follows where (follower_id=new.blocker_id and following_id=new.blocked_id) or (follower_id=new.blocked_id and following_id=new.blocker_id);
  return null;
end $$;
revoke all on function lexa_social.remove_blocked_follows() from public,anon,authenticated;
create trigger remove_blocked_follows after insert on public.user_blocks for each row execute function lexa_social.remove_blocked_follows();

drop policy "Listas públicas visibles para todos" on public.lists;
create policy "Listas públicas respetan privacidad" on public.lists for select using (visibility='public' and public.can_view_user_content(user_id));

-- El cursor incluye el identificador para no perder personas con fechas empatadas.
alter table public.follows alter column created_at set not null;
create index idx_follows_followers_cursor on public.follows(following_id,status,created_at desc,id desc);
create index idx_follows_following_cursor on public.follows(follower_id,status,created_at desc,id desc);
