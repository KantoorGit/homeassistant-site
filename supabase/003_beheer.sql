-- Beheerpaneel: rollen, schrijfrechten en extra velden voor artikelen.
-- Uitvoeren: Supabase-dashboard -> SQL Editor -> plakken -> Run.
-- Veilig om vaker uit te voeren. Vereist 002_artikelen.sql.

-- 1. Extra velden voor artikelen ------------------------------------------

-- 'uitgelicht': het artikel staat groot bovenaan de voorpagina.
-- 'video_url': YouTube-adres; de artikelpagina toont de video.
alter table public.artikelen
  add column if not exists uitgelicht boolean not null default false,
  add column if not exists video_url text,
  add column if not exists bijgewerkt_door uuid references auth.users (id) on delete set null;

alter table public.artikel_vertalingen
  add column if not exists bijgewerkt_door uuid references auth.users (id) on delete set null;

-- 2. Profielen en rollen (requirements W-ACC-08, W-ADM-09, W-ADM-10) ------

create table if not exists public.profielen (
  id uuid primary key references auth.users (id) on delete cascade,
  naam text not null default '',
  rol text not null default 'lid'
    check (rol in ('lid', 'redacteur', 'moderator', 'beheerder')),
  -- Talen waarin een redacteur mag schrijven. Een beheerder mag alles.
  talen text[] not null default '{}',
  aangemaakt timestamptz not null default now()
);

-- Elk nieuw account krijgt automatisch een profiel met de rol 'lid'.
create or replace function public.maak_profiel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profielen (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists bij_nieuw_account on auth.users;
create trigger bij_nieuw_account
  after insert on auth.users
  for each row execute function public.maak_profiel();

-- Profielen voor accounts die al bestonden.
insert into public.profielen (id)
select id from auth.users
on conflict (id) do nothing;

alter table public.profielen enable row level security;

-- 3. Hulpfuncties voor de toegangsregels ----------------------------------
-- Schrijven mag alleen na inloggen mét tweefactorauthenticatie ('aal2').

create or replace function public.met_2fa()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

create or replace function public.is_beheerder()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.met_2fa() and exists (
    select 1 from public.profielen p
    where p.id = auth.uid() and p.rol = 'beheerder'
  );
$$;

create or replace function public.is_redactie()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.met_2fa() and exists (
    select 1 from public.profielen p
    where p.id = auth.uid() and p.rol in ('redacteur', 'beheerder')
  );
$$;

create or replace function public.mag_schrijven_in(taal text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.met_2fa() and exists (
    select 1 from public.profielen p
    where p.id = auth.uid()
      and (p.rol = 'beheerder' or (p.rol = 'redacteur' and taal = any (p.talen)))
  );
$$;

-- 4. Toegangsregels --------------------------------------------------------

-- Profielen: iedereen ziet het eigen profiel, de beheerder ziet alles.
-- Rollen wijzigen gaat voorlopig via SQL (zie projectmap/00-LEESMIJ.md).
drop policy if exists "Eigen profiel leesbaar" on public.profielen;
create policy "Eigen profiel leesbaar"
  on public.profielen for select to authenticated
  using (id = auth.uid() or public.is_beheerder());

grant select on public.profielen to authenticated;

-- Artikelen: de redactie ziet ook concepten en geplande artikelen.
drop policy if exists "Redactie leest alle artikelen" on public.artikelen;
create policy "Redactie leest alle artikelen"
  on public.artikelen for select to authenticated
  using (public.is_redactie());

drop policy if exists "Redactie maakt artikelen" on public.artikelen;
create policy "Redactie maakt artikelen"
  on public.artikelen for insert to authenticated
  with check (public.mag_schrijven_in(originele_taal));

drop policy if exists "Redactie wijzigt artikelen" on public.artikelen;
create policy "Redactie wijzigt artikelen"
  on public.artikelen for update to authenticated
  using (public.mag_schrijven_in(originele_taal))
  with check (public.mag_schrijven_in(originele_taal));

drop policy if exists "Beheerder verwijdert artikelen" on public.artikelen;
create policy "Beheerder verwijdert artikelen"
  on public.artikelen for delete to authenticated
  using (public.is_beheerder());

-- Vertalingen: een redacteur schrijft alleen in zijn eigen talen.
drop policy if exists "Redactie leest alle vertalingen" on public.artikel_vertalingen;
create policy "Redactie leest alle vertalingen"
  on public.artikel_vertalingen for select to authenticated
  using (public.is_redactie());

drop policy if exists "Redactie maakt vertalingen" on public.artikel_vertalingen;
create policy "Redactie maakt vertalingen"
  on public.artikel_vertalingen for insert to authenticated
  with check (public.mag_schrijven_in(taal));

drop policy if exists "Redactie wijzigt vertalingen" on public.artikel_vertalingen;
create policy "Redactie wijzigt vertalingen"
  on public.artikel_vertalingen for update to authenticated
  using (public.mag_schrijven_in(taal))
  with check (public.mag_schrijven_in(taal));

drop policy if exists "Redactie verwijdert vertalingen" on public.artikel_vertalingen;
create policy "Redactie verwijdert vertalingen"
  on public.artikel_vertalingen for delete to authenticated
  using (public.mag_schrijven_in(taal));

grant insert, update, delete on public.artikelen to authenticated;
grant insert, update, delete on public.artikel_vertalingen to authenticated;

-- 5. Jezelf beheerder maken -------------------------------------------------
-- Eerst het account aanmaken (Authentication -> Users -> Add user), daarna:
--
--   update public.profielen set rol = 'beheerder', naam = 'Winston'
--   where id = (select id from auth.users where email = 'JOUW@EMAIL');
--
-- Een redacteur voor alleen het Engels:
--
--   update public.profielen set rol = 'redacteur', talen = '{en}'
--   where id = (select id from auth.users where email = 'IEMAND@EMAIL');
