-- Ejecutar una vez en SQL Editor. No borra datos existentes.
create table if not exists public.europa_state (
 id integer primary key check (id = 1),
 revision integer not null default 0,
 data jsonb not null,
 updated_at timestamptz not null default now()
);
alter table public.europa_state enable row level security;
revoke all on public.europa_state from anon, authenticated;
grant select, update on public.europa_state to service_role;
insert into public.europa_state(id,data) values(1,'{"repertoires":[],"songs":[],"events":[],"movements":[],"members":[],"goals":[],"equipment":[]}') on conflict do nothing;
insert into storage.buckets(id,name,public) values('europa-photos','europa-photos',false) on conflict do nothing;
-- No crear políticas públicas: solo la función de servidor accede a los datos y fotos.
