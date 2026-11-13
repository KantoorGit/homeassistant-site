-- Testtabel voor de pagina /nl/verbindingstest.
-- Uitvoeren: Supabase-dashboard -> SQL Editor -> plakken -> Run.
-- Veilig om vaker uit te voeren.

create table if not exists public.verbindingstest (
  id bigint generated always as identity primary key,
  bericht text not null,
  aangemaakt timestamptz not null default now()
);

-- Toegangsregels aanzetten: zonder regel mag niemand iets.
alter table public.verbindingstest enable row level security;

-- Iedereen mag deze ene tabel lezen; schrijven mag niemand.
drop policy if exists "Iedereen mag de testrij lezen" on public.verbindingstest;
create policy "Iedereen mag de testrij lezen"
  on public.verbindingstest
  for select
  to anon, authenticated
  using (true);

grant select on public.verbindingstest to anon, authenticated;

insert into public.verbindingstest (bericht)
select 'De koppeling tussen Vercel en Supabase werkt.'
where not exists (select 1 from public.verbindingstest);
