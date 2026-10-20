-- Recupera los campos de 009_lists_extras que usa el perfil y que faltaban en el despliegue.
alter table public.lists add column if not exists is_featured boolean default false;
alter table public.lists add column if not exists accent_color varchar(7) default '#4A96B8';
