-- 005_bezoekersstatistieken.sql
-- Eigen bezoekersstatistieken (besluit B-12, hoofdstuk 10 van de websitelijst).
--
-- Uitvoeren: Supabase → SQL Editor → + New query → plakken → Run.
-- Veilig om vaker uit te voeren. Voegt alleen toe; de live site blijft werken.
--
-- Opbouw:
--   meting_dagsleutels    geheime sleutel van vandaag (wordt elke dag gewist)
--   meting_sessies        één rij per bezoek (sessie)
--   meting_gebeurtenissen paginaweergaven, klikken, scroll, video, doelen, …
--   meting_toestemmingen  keuzes in de cookiebanner (zonder IP-adres)
--   meting_samenvatting   cijfers per dag; blijft bewaard na 14 maanden
--
-- Niemand schrijft vanuit de browser in deze tabellen. De website schrijft
-- via de server-route /api/meting met de geheime serversleutel; alleen de
-- beheerder (met 2FA) kan lezen (W-ANA-64).

-- ---------------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------------

create table if not exists public.meting_dagsleutels (
  dag date primary key,
  sleutel text not null
);

create table if not exists public.meting_sessies (
  id bigint generated always as identity primary key,
  -- Anonieme dagcode (basisniveau) of afgeleid van de bezoekerscode
  -- (uitgebreid niveau). Nooit een IP-adres.
  sleutel text not null,
  niveau text not null default 'basis' check (niveau in ('basis', 'uitgebreid')),
  bezoeker_id uuid,
  gebruiker_id uuid references auth.users (id) on delete cascade,
  nieuw_bezoeker boolean,
  dag date not null,
  begonnen timestamptz not null default now(),
  laatst timestamptz not null default now(),
  landingspagina text,
  uitstappagina text,
  verwijzer text,
  verwijzer_pad text,
  kanaal text,
  zoekmachine text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  browser text,
  browser_versie text,
  os text,
  os_versie text,
  apparaat text,
  scherm text,
  venster text,
  browsertaal text,
  sitetaal text,
  land text,
  regio text,
  stad text,
  is_beheerder boolean not null default false,
  is_preview boolean not null default false,
  paginaweergaven integer not null default 0,
  actieve_ms bigint not null default 0,
  aantal_gebeurtenissen integer not null default 0
);

create index if not exists meting_sessies_sleutel_idx
  on public.meting_sessies (sleutel, laatst desc);
create index if not exists meting_sessies_begonnen_idx
  on public.meting_sessies (begonnen);
create index if not exists meting_sessies_bezoeker_idx
  on public.meting_sessies (bezoeker_id) where bezoeker_id is not null;
create index if not exists meting_sessies_gebruiker_idx
  on public.meting_sessies (gebruiker_id) where gebruiker_id is not null;

create table if not exists public.meting_gebeurtenissen (
  id bigint generated always as identity primary key,
  sessie_id bigint not null references public.meting_sessies (id) on delete cascade,
  tijd timestamptz not null default now(),
  type text not null check (type in (
    'pagina', 'tijd', 'klik', 'scroll', 'video', 'training',
    'taal', '404', 'snelheid', 'doel', 'zoek'
  )),
  pad text,
  paginatype text,
  categorie text,
  artikel_id text,
  taal text,
  -- Wat er gebeurde: doel, knop, video-id, meetwaarde (LCP), …
  naam text,
  -- Plek op de pagina (hoofdartikel, raster, nieuwskolom, categoriebalk, …)
  plek text,
  -- Getal: actieve tijd in ms, scroll- of videopercentage, laadtijd, …
  waarde numeric
);

create index if not exists meting_gebeurtenissen_sessie_idx
  on public.meting_gebeurtenissen (sessie_id);
create index if not exists meting_gebeurtenissen_tijd_idx
  on public.meting_gebeurtenissen (tijd);
create index if not exists meting_gebeurtenissen_type_idx
  on public.meting_gebeurtenissen (type, tijd);

create table if not exists public.meting_toestemmingen (
  id bigint generated always as identity primary key,
  tijd timestamptz not null default now(),
  keuze text not null check (keuze in ('accepteren', 'weigeren')),
  -- Versie van de bannertekst waarop de keuze is gemaakt.
  versie text not null,
  bezoeker_id uuid
);

create table if not exists public.meting_samenvatting (
  dag date not null,
  -- totaal, sitetaal, land, apparaat, kanaal, browser, os, pagina, categorie
  dimensie text not null,
  waarde text not null,
  bezoekers integer not null default 0,
  sessies integer not null default 0,
  paginaweergaven integer not null default 0,
  actieve_ms bigint not null default 0,
  primary key (dag, dimensie, waarde)
);

-- ---------------------------------------------------------------------------
-- Toegang: alleen de beheerder leest, niemand schrijft rechtstreeks
-- ---------------------------------------------------------------------------

alter table public.meting_dagsleutels enable row level security;
alter table public.meting_sessies enable row level security;
alter table public.meting_gebeurtenissen enable row level security;
alter table public.meting_toestemmingen enable row level security;
alter table public.meting_samenvatting enable row level security;

revoke all on public.meting_dagsleutels from anon, authenticated;
revoke insert, update, delete on public.meting_sessies from anon, authenticated;
revoke insert, update, delete on public.meting_gebeurtenissen from anon, authenticated;
revoke insert, update, delete on public.meting_toestemmingen from anon, authenticated;
revoke insert, update, delete on public.meting_samenvatting from anon, authenticated;

drop policy if exists "beheerder leest sessies" on public.meting_sessies;
create policy "beheerder leest sessies" on public.meting_sessies
  for select to authenticated using (public.is_beheerder());

drop policy if exists "beheerder leest gebeurtenissen" on public.meting_gebeurtenissen;
create policy "beheerder leest gebeurtenissen" on public.meting_gebeurtenissen
  for select to authenticated using (public.is_beheerder());

drop policy if exists "beheerder leest toestemmingen" on public.meting_toestemmingen;
create policy "beheerder leest toestemmingen" on public.meting_toestemmingen
  for select to authenticated using (public.is_beheerder());

drop policy if exists "beheerder leest samenvatting" on public.meting_samenvatting;
create policy "beheerder leest samenvatting" on public.meting_samenvatting
  for select to authenticated using (public.is_beheerder());

-- ---------------------------------------------------------------------------
-- Dagsleutel: alleen die van vandaag bestaat (W-ANA-40). Oude sleutels
-- worden direct gewist, zodat oude dagcodes niet meer terug te rekenen zijn.
-- ---------------------------------------------------------------------------

create or replace function public.meting_dagsleutel()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dag date := (now() at time zone 'Europe/Amsterdam')::date;
  v_sleutel text;
begin
  delete from public.meting_dagsleutels where dag < v_dag;
  insert into public.meting_dagsleutels (dag, sleutel)
  values (
    v_dag,
    replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
  )
  on conflict (dag) do nothing;
  select sleutel into v_sleutel from public.meting_dagsleutels where dag = v_dag;
  return v_sleutel;
end;
$$;

-- ---------------------------------------------------------------------------
-- Ontvangen: zoekt of maakt de sessie (30 minuten zonder activiteit = nieuwe
-- sessie) en slaat de gebeurtenissen op. Eén aanroep per verzending.
-- ---------------------------------------------------------------------------

create or replace function public.meting_ontvang(
  p_sleutel text,
  p_sessie jsonb,
  p_gebeurtenissen jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
  v_aantal integer;
  v_bezoeker uuid := nullif(p_sessie ->> 'bezoeker_id', '')::uuid;
  v_gebruiker uuid := nullif(p_sessie ->> 'gebruiker_id', '')::uuid;
  v_eerste jsonb := p_gebeurtenissen -> 0;
begin
  if p_sleutel is null or length(p_sleutel) < 16 then
    raise exception 'ONGELDIG';
  end if;

  select id, aantal_gebeurtenissen into v_id, v_aantal
  from public.meting_sessies
  where sleutel = p_sleutel and laatst > now() - interval '30 minutes'
  order by laatst desc
  limit 1
  for update;

  if v_id is null then
    insert into public.meting_sessies (
      sleutel, niveau, bezoeker_id, gebruiker_id, nieuw_bezoeker, dag,
      landingspagina, verwijzer, verwijzer_pad, kanaal, zoekmachine,
      utm_source, utm_medium, utm_campaign, utm_term, utm_content,
      browser, browser_versie, os, os_versie, apparaat, scherm, venster,
      browsertaal, sitetaal, land, regio, stad, is_beheerder, is_preview
    ) values (
      p_sleutel,
      case when v_bezoeker is null then 'basis' else 'uitgebreid' end,
      v_bezoeker,
      v_gebruiker,
      case when v_bezoeker is null then null else not exists (
        select 1 from public.meting_sessies s where s.bezoeker_id = v_bezoeker
      ) end,
      (now() at time zone 'Europe/Amsterdam')::date,
      left(coalesce(p_sessie ->> 'landingspagina', v_eerste ->> 'pad'), 500),
      left(p_sessie ->> 'verwijzer', 200),
      left(p_sessie ->> 'verwijzer_pad', 500),
      left(p_sessie ->> 'kanaal', 40),
      left(p_sessie ->> 'zoekmachine', 40),
      left(p_sessie ->> 'utm_source', 200),
      left(p_sessie ->> 'utm_medium', 200),
      left(p_sessie ->> 'utm_campaign', 200),
      left(p_sessie ->> 'utm_term', 200),
      left(p_sessie ->> 'utm_content', 200),
      left(p_sessie ->> 'browser', 40),
      left(p_sessie ->> 'browser_versie', 20),
      left(p_sessie ->> 'os', 40),
      left(p_sessie ->> 'os_versie', 20),
      left(p_sessie ->> 'apparaat', 20),
      left(p_sessie ->> 'scherm', 20),
      left(p_sessie ->> 'venster', 20),
      left(p_sessie ->> 'browsertaal', 20),
      left(p_sessie ->> 'sitetaal', 5),
      left(p_sessie ->> 'land', 2),
      left(p_sessie ->> 'regio', 10),
      case when v_bezoeker is null then null else left(p_sessie ->> 'stad', 100) end,
      coalesce((p_sessie ->> 'is_beheerder')::boolean, false),
      coalesce((p_sessie ->> 'is_preview')::boolean, false)
    )
    returning id into v_id;
    v_aantal := 0;
  end if;

  -- Rem tegen misbruik: hoogstens 2000 gebeurtenissen per sessie.
  if v_aantal >= 2000 then
    return v_id;
  end if;

  insert into public.meting_gebeurtenissen (
    sessie_id, type, pad, paginatype, categorie, artikel_id, taal, naam, plek, waarde
  )
  select
    v_id,
    e.type,
    left(e.pad, 500),
    left(e.paginatype, 20),
    left(e.categorie, 40),
    left(e.artikel_id, 60),
    left(e.taal, 5),
    left(e.naam, 200),
    left(e.plek, 40),
    case
      -- Actieve tijd per melding hoogstens 30 minuten.
      when e.type = 'tijd' then least(greatest(coalesce(e.waarde, 0), 0), 1800000)
      else e.waarde
    end
  from jsonb_to_recordset(coalesce(p_gebeurtenissen, '[]'::jsonb)) as e(
    type text, pad text, paginatype text, categorie text, artikel_id text,
    taal text, naam text, plek text, waarde numeric
  )
  where e.type in (
    'pagina', 'tijd', 'klik', 'scroll', 'video', 'training',
    'taal', '404', 'snelheid', 'doel', 'zoek'
  )
  limit 100;

  update public.meting_sessies s
  set
    laatst = now(),
    paginaweergaven = s.paginaweergaven + coalesce((
      select count(*) from jsonb_array_elements(p_gebeurtenissen) g
      where g ->> 'type' = 'pagina'
    ), 0),
    actieve_ms = s.actieve_ms + coalesce((
      select sum(least(greatest(coalesce((g ->> 'waarde')::numeric, 0), 0), 1800000))
      from jsonb_array_elements(p_gebeurtenissen) g
      where g ->> 'type' = 'tijd'
    ), 0)::bigint,
    uitstappagina = coalesce((
      select left(g ->> 'pad', 500)
      from jsonb_array_elements(p_gebeurtenissen) with ordinality as x(g, n)
      where g ->> 'type' = 'pagina'
      order by n desc
      limit 1
    ), s.uitstappagina, s.landingspagina),
    gebruiker_id = coalesce(s.gebruiker_id, case when s.niveau = 'uitgebreid' then v_gebruiker end),
    is_beheerder = s.is_beheerder or coalesce((p_sessie ->> 'is_beheerder')::boolean, false),
    aantal_gebeurtenissen = s.aantal_gebeurtenissen + jsonb_array_length(coalesce(p_gebeurtenissen, '[]'::jsonb))
  where s.id = v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Nachtwerk (W-ANA-62, -63): samenvattingen bijwerken, oude gebeurtenissen
-- en de dagsleutel van gisteren wissen.
-- ---------------------------------------------------------------------------

create or replace function public.meting_nachtwerk()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_vandaag date := (now() at time zone 'Europe/Amsterdam')::date;
begin
  -- De laatste drie dagen opnieuw samenvatten (late meldingen tellen mee).
  delete from public.meting_samenvatting where dag >= v_vandaag - 3;

  insert into public.meting_samenvatting (dag, dimensie, waarde, bezoekers, sessies, paginaweergaven, actieve_ms)
  select s.dag, d.dimensie, coalesce(d.waarde, '(onbekend)'),
         count(distinct coalesce(s.bezoeker_id::text, s.sleutel)),
         count(*), sum(s.paginaweergaven), sum(s.actieve_ms)
  from public.meting_sessies s
  cross join lateral (values
    ('totaal', 'alles'),
    ('sitetaal', s.sitetaal),
    ('land', s.land),
    ('apparaat', s.apparaat),
    ('kanaal', s.kanaal),
    ('browser', s.browser),
    ('os', s.os)
  ) as d(dimensie, waarde)
  where s.dag >= v_vandaag - 3
    and not s.is_beheerder and not s.is_preview
  group by s.dag, d.dimensie, coalesce(d.waarde, '(onbekend)');

  insert into public.meting_samenvatting (dag, dimensie, waarde, bezoekers, sessies, paginaweergaven, actieve_ms)
  select s.dag, d.dimensie, coalesce(d.waarde, '(onbekend)'),
         count(distinct coalesce(s.bezoeker_id::text, s.sleutel)),
         count(distinct s.id), count(*), 0
  from public.meting_gebeurtenissen g
  join public.meting_sessies s on s.id = g.sessie_id
  cross join lateral (values
    ('pagina', g.pad),
    ('categorie', g.categorie)
  ) as d(dimensie, waarde)
  where g.type = 'pagina'
    and s.dag >= v_vandaag - 3
    and not s.is_beheerder and not s.is_preview
  group by s.dag, d.dimensie, coalesce(d.waarde, '(onbekend)');

  -- Bewaartermijn: losse gebeurtenissen en sessies 14 maanden.
  delete from public.meting_gebeurtenissen where tijd < now() - interval '14 months';
  delete from public.meting_sessies where laatst < now() - interval '14 months';
  -- Toestemmingskeuzes: zolang de bezoekerscookie geldig kan zijn, plus marge.
  delete from public.meting_toestemmingen where tijd < now() - interval '25 months';

  delete from public.meting_dagsleutels where dag < v_vandaag;
end;
$$;

-- Alleen de server (geheime sleutel) mag deze functies aanroepen.
revoke all on function public.meting_dagsleutel() from public, anon, authenticated;
revoke all on function public.meting_ontvang(text, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.meting_nachtwerk() from public, anon, authenticated;
grant execute on function public.meting_dagsleutel() to service_role;
grant execute on function public.meting_ontvang(text, jsonb, jsonb) to service_role;
grant execute on function public.meting_nachtwerk() to service_role;

-- ---------------------------------------------------------------------------
-- Rapporten voor het dashboard (W-ANA-50 t/m -54). Alleen voor de beheerder
-- met 2FA; draait met de rechten van de aanroeper, dus de toegangsregels
-- hierboven gelden ook hier.
-- ---------------------------------------------------------------------------

create or replace function public.meting_rapport(
  p_van timestamptz,
  p_tot timestamptz,
  p_filters jsonb default '{}'::jsonb,
  p_alles boolean default false
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_lengte interval := p_tot - p_van;
  v_uit jsonb;
  v_taal text := nullif(p_filters ->> 'taal', '');
  v_apparaat text := nullif(p_filters ->> 'apparaat', '');
  v_kanaal text := nullif(p_filters ->> 'kanaal', '');
  v_land text := nullif(p_filters ->> 'land', '');
  v_categorie text := nullif(p_filters ->> 'categorie', '');
begin
  if not public.is_beheerder() then
    raise exception 'GEEN_BEHEERDER';
  end if;

  with
  alle_s as (
    select s.*
    from public.meting_sessies s
    where s.begonnen >= p_van - v_lengte and s.begonnen < p_tot
      and (p_alles or (not s.is_beheerder and not s.is_preview))
      and (v_taal is null or s.sitetaal = v_taal)
      and (v_apparaat is null or s.apparaat = v_apparaat)
      and (v_kanaal is null or s.kanaal = v_kanaal)
      and (v_land is null or s.land = v_land)
      and (v_categorie is null or exists (
        select 1 from public.meting_gebeurtenissen g
        where g.sessie_id = s.id and g.type = 'pagina' and g.categorie = v_categorie
      ))
  ),
  s as (select * from alle_s where begonnen >= p_van),
  vorig as (select * from alle_s where begonnen < p_van),
  e as (
    select g.*, s.niveau
    from public.meting_gebeurtenissen g
    join s on s.id = g.sessie_id
    where v_categorie is null or g.type <> 'pagina' or g.categorie = v_categorie
  ),
  paginas as (select * from e where type = 'pagina')
  select jsonb_build_object(
    'overzicht', (
      select jsonb_build_object(
        'bezoekers', count(distinct coalesce(bezoeker_id::text, sleutel)),
        'sessies', count(*),
        'paginaweergaven', coalesce(sum(paginaweergaven), 0),
        'gem_actieve_ms', coalesce(round(avg(actieve_ms)), 0),
        'een_pagina_pct', coalesce(round(100.0 * count(*) filter (where paginaweergaven <= 1) / nullif(count(*), 0), 1), 0),
        'uitgebreid_pct', coalesce(round(100.0 * count(*) filter (where niveau = 'uitgebreid') / nullif(count(*), 0), 1), 0)
      ) from s
    ),
    'vorige', (
      select jsonb_build_object(
        'bezoekers', count(distinct coalesce(bezoeker_id::text, sleutel)),
        'sessies', count(*),
        'paginaweergaven', coalesce(sum(paginaweergaven), 0),
        'gem_actieve_ms', coalesce(round(avg(actieve_ms)), 0),
        'een_pagina_pct', coalesce(round(100.0 * count(*) filter (where paginaweergaven <= 1) / nullif(count(*), 0), 1), 0)
      ) from vorig
    ),
    'per_dag', coalesce((
      select jsonb_agg(r order by r.dag) from (
        select dag,
               count(distinct coalesce(bezoeker_id::text, sleutel)) as bezoekers,
               count(*) as sessies,
               sum(paginaweergaven) as paginaweergaven
        from s group by dag
      ) r
    ), '[]'::jsonb),

    -- Acquisitie
    'kanalen', coalesce((
      select jsonb_agg(r order by r.sessies desc) from (
        select coalesce(kanaal, '(onbekend)') as naam, count(*) as sessies,
               count(distinct coalesce(bezoeker_id::text, sleutel)) as bezoekers,
               sum(paginaweergaven) as paginaweergaven
        from s group by 1
      ) r
    ), '[]'::jsonb),
    'verwijzers', coalesce((
      select jsonb_agg(r order by r.sessies desc) from (
        select verwijzer as naam, count(*) as sessies from s
        where verwijzer is not null group by 1 order by 2 desc limit 25
      ) r
    ), '[]'::jsonb),
    'zoekmachines', coalesce((
      select jsonb_agg(r order by r.sessies desc) from (
        select zoekmachine as naam, count(*) as sessies from s
        where zoekmachine is not null group by 1
      ) r
    ), '[]'::jsonb),
    'campagnes', coalesce((
      select jsonb_agg(r order by r.sessies desc) from (
        select coalesce(utm_campaign, '(geen)') as campagne,
               coalesce(utm_source, '') as bron, coalesce(utm_medium, '') as medium,
               count(*) as sessies
        from s where utm_source is not null or utm_campaign is not null
        group by 1, 2, 3 order by 4 desc limit 25
      ) r
    ), '[]'::jsonb),

    -- Doelgroep
    'landen', coalesce((
      select jsonb_agg(r order by r.sessies desc) from (
        select coalesce(land, '??') as naam, count(*) as sessies from s group by 1
      ) r
    ), '[]'::jsonb),
    'regios', coalesce((
      select jsonb_agg(r order by r.sessies desc) from (
        select coalesce(land, '??') || '-' || regio as naam, count(*) as sessies
        from s where regio is not null group by 1 order by 2 desc limit 25
      ) r
    ), '[]'::jsonb),
    'steden', coalesce((
      select jsonb_agg(r order by r.sessies desc) from (
        select stad as naam, count(*) as sessies
        from s where stad is not null group by 1 order by 2 desc limit 25
      ) r
    ), '[]'::jsonb),
    'sitetalen', coalesce((
      select jsonb_agg(r order by r.sessies desc) from (
        select coalesce(sitetaal, '?') as naam, count(*) as sessies from s group by 1
      ) r
    ), '[]'::jsonb),
    'browsertalen', coalesce((
      select jsonb_agg(r order by r.sessies desc) from (
        select coalesce(browsertaal, '?') as naam, count(*) as sessies
        from s group by 1 order by 2 desc limit 20
      ) r
    ), '[]'::jsonb),
    'apparaten', coalesce((
      select jsonb_agg(r order by r.sessies desc) from (
        select coalesce(apparaat, '?') as naam, count(*) as sessies from s group by 1
      ) r
    ), '[]'::jsonb),
    'browsers', coalesce((
      select jsonb_agg(r order by r.sessies desc) from (
        select coalesce(browser, '?') || coalesce(' ' || split_part(browser_versie, '.', 1), '') as naam,
               count(*) as sessies
        from s group by 1 order by 2 desc limit 20
      ) r
    ), '[]'::jsonb),
    'besturingssystemen', coalesce((
      select jsonb_agg(r order by r.sessies desc) from (
        select coalesce(os, '?') || coalesce(' ' || os_versie, '') as naam, count(*) as sessies
        from s group by 1 order by 2 desc limit 20
      ) r
    ), '[]'::jsonb),
    'schermen', coalesce((
      select jsonb_agg(r order by r.sessies desc) from (
        select coalesce(scherm, '?') as naam, count(*) as sessies
        from s group by 1 order by 2 desc limit 15
      ) r
    ), '[]'::jsonb),
    -- Alleen bezoekers met toestemming (W-ANA-54).
    'nieuw_terugkerend', coalesce((
      select jsonb_agg(r) from (
        select case when nieuw_bezoeker then 'Nieuw' else 'Terugkerend' end as naam,
               count(distinct bezoeker_id) as bezoekers, count(*) as sessies
        from s where niveau = 'uitgebreid' group by 1
      ) r
    ), '[]'::jsonb),
    'bezoekfrequentie', coalesce((
      select jsonb_agg(r order by r.bezoeken) from (
        select bezoeken, count(*) as bezoekers from (
          select bezoeker_id, count(*) as bezoeken from s
          where niveau = 'uitgebreid' group by 1
        ) x group by 1
      ) r
    ), '[]'::jsonb),

    -- Gedrag
    'paginas', coalesce((
      select jsonb_agg(r order by r.weergaven desc) from (
        select p.pad as naam, count(*) as weergaven, count(distinct p.sessie_id) as sessies,
               (select round(avg(t.waarde)) from e t where t.type = 'tijd' and t.pad = p.pad) as gem_ms
        from paginas p group by p.pad order by 2 desc limit 50
      ) r
    ), '[]'::jsonb),
    'artikelen', coalesce((
      select jsonb_agg(r order by r.weergaven desc) from (
        select artikel_id as id, min(pad) as pad, count(*) as weergaven,
               count(distinct sessie_id) as sessies
        from paginas where artikel_id is not null group by 1 order by 3 desc limit 50
      ) r
    ), '[]'::jsonb),
    'categorieen', coalesce((
      select jsonb_agg(r order by r.weergaven desc) from (
        select coalesce(categorie, paginatype, '?') as naam, count(*) as weergaven
        from paginas group by 1
      ) r
    ), '[]'::jsonb),
    'instap', coalesce((
      select jsonb_agg(r order by r.sessies desc) from (
        select landingspagina as naam, count(*) as sessies,
               round(100.0 * count(*) filter (where paginaweergaven <= 1) / count(*), 1) as een_pagina_pct
        from s where landingspagina is not null group by 1 order by 2 desc limit 25
      ) r
    ), '[]'::jsonb),
    'uitstap', coalesce((
      select jsonb_agg(r order by r.sessies desc) from (
        select coalesce(uitstappagina, landingspagina) as naam, count(*) as sessies
        from s where coalesce(uitstappagina, landingspagina) is not null
        group by 1 order by 2 desc limit 25
      ) r
    ), '[]'::jsonb),
    'paden', coalesce((
      select jsonb_agg(r order by r.aantal desc) from (
        select van, naar, count(*) as aantal from (
          select pad as van, lead(pad) over (partition by sessie_id order by tijd, id) as naar
          from paginas
        ) x where naar is not null and naar <> van
        group by 1, 2 order by 3 desc limit 25
      ) r
    ), '[]'::jsonb),
    'klikken', coalesce((
      select jsonb_agg(r order by r.aantal desc) from (
        select coalesce(plek, '?') as plek, naam, count(*) as aantal
        from e where type = 'klik' group by 1, 2 order by 3 desc limit 50
      ) r
    ), '[]'::jsonb),
    'scroll', coalesce((
      select jsonb_agg(r order by r.pad) from (
        select pad,
               count(*) filter (where waarde = 25) as p25,
               count(*) filter (where waarde = 50) as p50,
               count(*) filter (where waarde = 75) as p75,
               count(*) filter (where waarde = 100) as p100
        from e where type = 'scroll' group by 1 order by count(*) desc limit 25
      ) r
    ), '[]'::jsonb),
    'video', coalesce((
      select jsonb_agg(r) from (
        select naam as video,
               count(*) filter (where waarde = 0) as gestart,
               count(*) filter (where waarde = 25) as p25,
               count(*) filter (where waarde = 50) as p50,
               count(*) filter (where waarde = 75) as p75,
               count(*) filter (where waarde = 100) as uitgekeken
        from e where type = 'video' group by 1 order by 2 desc limit 25
      ) r
    ), '[]'::jsonb),
    'trainingen', coalesce((
      select jsonb_agg(r) from (
        select pad, naam as stap, count(distinct sessie_id) as sessies
        from e where type = 'training' group by 1, 2 order by 1, 2 limit 100
      ) r
    ), '[]'::jsonb),
    'zoeken', coalesce((
      select jsonb_agg(r order by r.aantal desc) from (
        select lower(naam) as zoekterm, count(*) as aantal, round(avg(waarde)) as gem_resultaten
        from e where type = 'zoek' group by 1 order by 2 desc limit 25
      ) r
    ), '[]'::jsonb),
    'fouten404', coalesce((
      select jsonb_agg(r order by r.aantal desc) from (
        select pad, coalesce(naam, '(direct)') as verwijzer, count(*) as aantal
        from e where type = '404' group by 1, 2 order by 3 desc limit 25
      ) r
    ), '[]'::jsonb),
    'snelheid', coalesce((
      select jsonb_agg(r order by r.meting, r.apparaat) from (
        select g.naam as meting, coalesce(ss.apparaat, '?') as apparaat, count(*) as aantal,
               round(percentile_cont(0.75) within group (order by g.waarde)::numeric, 3) as p75
        from e g join s ss on ss.id = g.sessie_id
        where g.type = 'snelheid' group by 1, 2
      ) r
    ), '[]'::jsonb),

    -- Doelen
    'doelen', coalesce((
      select jsonb_agg(r order by r.aantal desc) from (
        select naam, count(*) as aantal, count(distinct sessie_id) as sessies
        from e where type = 'doel' group by 1
      ) r
    ), '[]'::jsonb),
    'taalwissels', coalesce((
      select jsonb_agg(r order by r.aantal desc) from (
        select coalesce(taal, '?') || ' → ' || coalesce(naam, '?') as naam, count(*) as aantal
        from e where type = 'taal' group by 1
      ) r
    ), '[]'::jsonb),
    'trechter', jsonb_build_object(
      'registratie_bekeken', (select count(distinct sessie_id) from paginas where pad like '/__/account/register%'),
      'registratie_voltooid', (select count(distinct sessie_id) from e where type = 'doel' and naam = 'registratie_voltooid'),
      'tweefactor_gekoppeld', (select count(distinct sessie_id) from e where type = 'doel' and naam = '2fa_gekoppeld'),
      'eerste_bericht', (select count(distinct sessie_id) from e where type = 'doel' and naam in ('forum_vraag', 'forum_reactie'))
    )
  ) into v_uit;

  return v_uit;
end;
$$;

-- Realtime: de laatste 30 minuten (W-ANA-51).
create or replace function public.meting_realtime(p_alles boolean default false)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_uit jsonb;
begin
  if not public.is_beheerder() then
    raise exception 'GEEN_BEHEERDER';
  end if;

  with
  s as (
    select * from public.meting_sessies
    where laatst >= now() - interval '30 minutes'
      and (p_alles or (not is_beheerder and not is_preview))
  ),
  e as (
    select g.* from public.meting_gebeurtenissen g
    join s on s.id = g.sessie_id
    where g.tijd >= now() - interval '30 minutes'
  )
  select jsonb_build_object(
    'actief', (select count(*) from s where laatst >= now() - interval '5 minutes'),
    'sessies', (select count(*) from s),
    'paginaweergaven', (select count(*) from e where type = 'pagina'),
    'per_minuut', coalesce((
      select jsonb_agg(r order by r.minuut) from (
        select floor(extract(epoch from (now() - tijd)) / 60)::int as minuut, count(*) as weergaven
        from e where type = 'pagina' group by 1
      ) r
    ), '[]'::jsonb),
    'paginas', coalesce((
      select jsonb_agg(r order by r.weergaven desc) from (
        select pad as naam, count(*) as weergaven from e
        where type = 'pagina' group by 1 order by 2 desc limit 15
      ) r
    ), '[]'::jsonb),
    'landen', coalesce((
      select jsonb_agg(r order by r.sessies desc) from (
        select coalesce(land, '??') as naam, count(*) as sessies from s group by 1
      ) r
    ), '[]'::jsonb),
    'gebeurtenissen', coalesce((
      select jsonb_agg(r order by r.tijd desc) from (
        select tijd, type, pad, naam, plek from e order by tijd desc limit 30
      ) r
    ), '[]'::jsonb)
  ) into v_uit;
  return v_uit;
end;
$$;

revoke all on function public.meting_rapport(timestamptz, timestamptz, jsonb, boolean) from public, anon;
revoke all on function public.meting_realtime(boolean) from public, anon;
grant execute on function public.meting_rapport(timestamptz, timestamptz, jsonb, boolean) to authenticated;
grant execute on function public.meting_realtime(boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Nachtelijke taak met pg_cron (02:15 UTC). Lukt het aanzetten van pg_cron
-- niet, dan werkt de rest gewoon; zet pg_cron dan aan via Supabase →
-- Database → Extensions → pg_cron en voer dit bestand nog eens uit.
-- De dagsleutel wordt ook zonder deze taak dagelijks vervangen.
-- ---------------------------------------------------------------------------

do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron kon niet worden aangezet: %', sqlerrm;
  end;

  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('meting-nachtwerk', '15 2 * * *', 'select public.meting_nachtwerk()');
    raise notice 'Nachtelijke taak meting-nachtwerk staat ingepland.';
  end if;
end;
$$;
