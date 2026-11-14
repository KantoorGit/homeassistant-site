-- 007_categorieen_posities_media.sql
-- Beheerpaneel uitbreiden (versie 3):
--   1. Categorieën in de database, te wijzigen in het beheerpaneel
--      (W-ADM-07, W-ADM-13 t/m -16): hernoemen, volgorde, toevoegen,
--      verwijderen en terugzetten. "Overig" staat altijd vlak vóór "Forum",
--      "Forum" altijd als laatste.
--   2. Een vaste plek op de voorpagina per artikel (W-ADM-17): groot
--      bovenaan of één van de zes plekken in het raster eronder.
--   3. Opslag voor afbeeldingen en video's die je zelf uploadt (W-ADM-18,
--      W-ADM-19).
--
-- Uitvoeren: Supabase → SQL Editor → + New query → plakken → Run.
-- Veilig om vaker uit te voeren. Voegt alleen toe; de live site blijft werken.
--
-- Verwijderen van een categorie is "zacht": de categorie blijft bestaan met
-- een datum in verwijderd_op en de artikelen houden hun categorie. Op de
-- site staan die artikelen onder "Overig". Zet je de categorie terug, dan
-- staan ze weer op hun oude plek. Hernoemen verplaatst niets.

-- ---------------------------------------------------------------------------
-- 1. Categorieën
-- ---------------------------------------------------------------------------

create table if not exists public.categorieen (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  -- voorpagina en laatste-nieuws vullen zich vanzelf; overig vangt de
  -- artikelen van verwijderde categorieën op; forum heeft eigen pagina's.
  soort text not null default 'gewoon'
    check (soort in ('voorpagina', 'laatste-nieuws', 'gewoon', 'overig', 'forum')),
  -- Per taal: {"nl": "Hardware", "en": "Hardware", ...}
  naam jsonb not null,
  slug jsonb not null,
  -- Eerdere webadressen per taal, zodat oude links blijven werken:
  -- {"nl": ["oude-naam"], ...}
  vorige_slugs jsonb not null default '{}'::jsonb,
  volgorde integer not null default 500,
  verwijderd_op timestamptz,
  aangemaakt timestamptz not null default now(),
  bijgewerkt timestamptz not null default now(),
  bijgewerkt_door uuid references auth.users (id) on delete set null
);

-- De categorieën die tot nu toe in de code stonden, plus Overig.
insert into public.categorieen (id, soort, volgorde, naam, slug) values
  ('voorpagina', 'voorpagina', 0,
   '{"nl":"Voorpagina","en":"Home","zh":"首页","fr":"Accueil","de":"Startseite","es":"Inicio"}',
   '{"nl":"","en":"","zh":"","fr":"","de":"","es":""}'),
  ('laatste-nieuws', 'laatste-nieuws', 10,
   '{"nl":"Laatste nieuws","en":"Latest news","zh":"最新消息","fr":"Dernières nouvelles","de":"Neuigkeiten","es":"Últimas noticias"}',
   '{"nl":"laatste-nieuws","en":"latest-news","zh":"zuixin","fr":"dernieres-nouvelles","de":"neuigkeiten","es":"ultimas-noticias"}'),
  ('videos', 'gewoon', 20,
   '{"nl":"Video''s","en":"Videos","zh":"视频","fr":"Vidéos","de":"Videos","es":"Vídeos"}',
   '{"nl":"videos","en":"videos","zh":"shipin","fr":"videos","de":"videos","es":"videos"}'),
  ('aan-de-slag', 'gewoon', 30,
   '{"nl":"Aan de slag","en":"Getting started","zh":"入门","fr":"Premiers pas","de":"Erste Schritte","es":"Primeros pasos"}',
   '{"nl":"aan-de-slag","en":"getting-started","zh":"rumen","fr":"premiers-pas","de":"erste-schritte","es":"primeros-pasos"}'),
  ('training', 'gewoon', 40,
   '{"nl":"Training","en":"Training","zh":"教程","fr":"Formation","de":"Schulung","es":"Formación"}',
   '{"nl":"training","en":"training","zh":"jiaocheng","fr":"formation","de":"schulung","es":"formacion"}'),
  ('automatiseringen', 'gewoon', 50,
   '{"nl":"Automatiseringen","en":"Automations","zh":"自动化","fr":"Automatisations","de":"Automatisierungen","es":"Automatizaciones"}',
   '{"nl":"automatiseringen","en":"automations","zh":"zidonghua","fr":"automatisations","de":"automatisierungen","es":"automatizaciones"}'),
  ('dashboards', 'gewoon', 60,
   '{"nl":"Dashboards","en":"Dashboards","zh":"仪表板","fr":"Tableaux de bord","de":"Dashboards","es":"Paneles"}',
   '{"nl":"dashboards","en":"dashboards","zh":"yibiaopan","fr":"tableaux-de-bord","de":"dashboards","es":"paneles"}'),
  ('integraties', 'gewoon', 70,
   '{"nl":"Integraties","en":"Integrations","zh":"集成","fr":"Intégrations","de":"Integrationen","es":"Integraciones"}',
   '{"nl":"integraties","en":"integrations","zh":"jicheng","fr":"integrations","de":"integrationen","es":"integraciones"}'),
  ('claude-en-ai', 'gewoon', 80,
   '{"nl":"Claude & AI","en":"Claude & AI","zh":"Claude 与 AI","fr":"Claude & IA","de":"Claude & KI","es":"Claude e IA"}',
   '{"nl":"claude-en-ai","en":"claude-and-ai","zh":"claude-ai","fr":"claude-et-ia","de":"claude-und-ki","es":"claude-e-ia"}'),
  ('hardware', 'gewoon', 90,
   '{"nl":"Hardware","en":"Hardware","zh":"硬件","fr":"Matériel","de":"Hardware","es":"Hardware"}',
   '{"nl":"hardware","en":"hardware","zh":"yingjian","fr":"materiel","de":"hardware","es":"hardware"}'),
  ('overig', 'overig', 1000,
   '{"nl":"Overig","en":"Other","zh":"其他","fr":"Autres","de":"Sonstiges","es":"Otros"}',
   '{"nl":"overig","en":"other","zh":"qita","fr":"autres","de":"sonstiges","es":"otros"}'),
  ('forum', 'forum', 1001,
   '{"nl":"Forum","en":"Forum","zh":"论坛","fr":"Forum","de":"Forum","es":"Foro"}',
   '{"nl":"forum","en":"forum","zh":"forum","fr":"forum","de":"forum","es":"forum"}')
on conflict (id) do nothing;

alter table public.categorieen enable row level security;

-- Iedereen leest de categorieën (ook de verwijderde: nodig om te weten dat
-- een artikel onder Overig hoort). Schrijven alleen via de functies hieronder.
drop policy if exists "Categorieën zijn leesbaar" on public.categorieen;
create policy "Categorieën zijn leesbaar" on public.categorieen
  for select to anon, authenticated using (true);

grant select on public.categorieen to anon, authenticated;
revoke insert, update, delete on public.categorieen from anon, authenticated;

-- Adressen die de site zelf gebruikt en dus geen categorie mogen worden.
create or replace function public.gereserveerde_slug(p_slug text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_slug in ('forum', 'account', 'privacy', 'beheer', 'verbindingstest',
                    'api', 'auth', 'zoeken', 'nieuw', 'moderatie', 'regels');
$$;

-- Controleert naam en webadres van een categorie in alle zes talen en geeft
-- een foutmelding terug (of null als alles klopt).
create or replace function public.categorie_controle(
  p_id text, p_soort text, p_naam jsonb, p_slug jsonb
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  t text;
  s text;
begin
  foreach t in array array['nl', 'en', 'zh', 'fr', 'de', 'es'] loop
    if coalesce(btrim(p_naam ->> t), '') = '' then
      return 'naam_leeg:' || t;
    end if;
    if char_length(p_naam ->> t) > 40 then
      return 'naam_te_lang:' || t;
    end if;
    s := coalesce(p_slug ->> t, '');
    if p_soort = 'voorpagina' then
      if s <> '' then return 'slug_voorpagina'; end if;
      continue;
    end if;
    if p_soort = 'forum' then
      if s <> 'forum' then return 'slug_forum'; end if;
      continue;
    end if;
    if s !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(s) > 60 then
      return 'slug_ongeldig:' || t;
    end if;
    if public.gereserveerde_slug(s) then
      return 'slug_gereserveerd:' || t;
    end if;
    if exists (
      select 1 from public.categorieen c
      where c.id <> coalesce(p_id, '')
        and c.verwijderd_op is null
        and c.slug ->> t = s
    ) then
      return 'slug_bestaat:' || t;
    end if;
  end loop;
  return null;
end;
$$;

-- Nieuwe categorie (p_id null) of bestaande hernoemen. Hernoemen verplaatst
-- geen artikelen. Een gewijzigd webadres wordt bewaard in vorige_slugs, zodat
-- oude links doorsturen naar het nieuwe adres.
create or replace function public.categorie_opslaan(
  p_id text, p_naam jsonb, p_slug jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  oud public.categorieen;
  nieuw_id text;
  fout text;
  t text;
  vorige jsonb;
  lijst jsonb;
begin
  if not public.is_beheerder() then
    raise exception 'geen_toegang' using errcode = '42501';
  end if;

  if p_id is null or p_id = '' then
    fout := public.categorie_controle(null, 'gewoon', p_naam, p_slug);
    if fout is not null then raise exception '%', fout using errcode = '22023'; end if;
    nieuw_id := left(p_slug ->> 'nl', 40);
    -- Bestaat het id al (ook als verwijderde categorie), dan een nummer erachter.
    while exists (select 1 from public.categorieen where id = nieuw_id) loop
      nieuw_id := left(p_slug ->> 'nl', 36) || '-' || (floor(random() * 900) + 100)::int;
    end loop;
    insert into public.categorieen (id, soort, naam, slug, volgorde, bijgewerkt_door)
    values (
      nieuw_id, 'gewoon', p_naam, p_slug,
      coalesce((select max(volgorde) from public.categorieen
                where soort in ('gewoon', 'laatste-nieuws') and verwijderd_op is null), 10) + 10,
      auth.uid()
    );
    return nieuw_id;
  end if;

  select * into oud from public.categorieen where id = p_id for update;
  if not found then raise exception 'niet_gevonden' using errcode = 'P0002'; end if;

  fout := public.categorie_controle(p_id, oud.soort, p_naam, p_slug);
  if fout is not null then raise exception '%', fout using errcode = '22023'; end if;

  vorige := oud.vorige_slugs;
  foreach t in array array['nl', 'en', 'zh', 'fr', 'de', 'es'] loop
    if coalesce(oud.slug ->> t, '') <> '' and oud.slug ->> t <> p_slug ->> t then
      lijst := coalesce(vorige -> t, '[]'::jsonb);
      if not lijst ? (oud.slug ->> t) then
        lijst := lijst || to_jsonb(oud.slug ->> t);
      end if;
      vorige := jsonb_set(vorige, array[t], lijst, true);
    end if;
  end loop;

  update public.categorieen
  set naam = p_naam,
      slug = p_slug,
      vorige_slugs = vorige,
      bijgewerkt = now(),
      bijgewerkt_door = auth.uid()
  where id = p_id;
  return p_id;
end;
$$;

-- Volgorde van de categoriebalk. Voorpagina blijft eerste, Overig en Forum
-- blijven de laatste twee; de rest volgt de volgorde van p_ids.
create or replace function public.categorie_volgorde(p_ids text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  i integer;
begin
  if not public.is_beheerder() then
    raise exception 'geen_toegang' using errcode = '42501';
  end if;
  for i in 1 .. coalesce(array_length(p_ids, 1), 0) loop
    update public.categorieen
    set volgorde = i * 10, bijgewerkt = now(), bijgewerkt_door = auth.uid()
    where id = p_ids[i] and soort in ('gewoon', 'laatste-nieuws');
  end loop;
  update public.categorieen set volgorde = 0 where soort = 'voorpagina';
  update public.categorieen set volgorde = 1000 where soort = 'overig';
  update public.categorieen set volgorde = 1001 where soort = 'forum';
end;
$$;

-- Verwijderen: alleen gewone categorieën. De artikelen houden hun
-- categorie en staan op de site onder Overig.
create or replace function public.categorie_verwijderen(p_id text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  aantal integer;
begin
  if not public.is_beheerder() then
    raise exception 'geen_toegang' using errcode = '42501';
  end if;
  update public.categorieen
  set verwijderd_op = now(), bijgewerkt = now(), bijgewerkt_door = auth.uid()
  where id = p_id and soort = 'gewoon' and verwijderd_op is null;
  if not found then raise exception 'niet_verwijderbaar' using errcode = '22023'; end if;
  select count(*) into aantal from public.artikelen where categorie_id = p_id;
  return aantal;
end;
$$;

-- Terugzetten: de artikelen staan dan weer onder hun eigen categorie.
create or replace function public.categorie_terugzetten(p_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.categorieen;
  fout text;
begin
  if not public.is_beheerder() then
    raise exception 'geen_toegang' using errcode = '42501';
  end if;
  select * into c from public.categorieen where id = p_id and verwijderd_op is not null;
  if not found then raise exception 'niet_gevonden' using errcode = 'P0002'; end if;
  fout := public.categorie_controle(p_id, c.soort, c.naam, c.slug);
  if fout is not null then raise exception '%', fout using errcode = '22023'; end if;
  update public.categorieen
  set verwijderd_op = null,
      volgorde = coalesce((select max(volgorde) from public.categorieen
                           where soort in ('gewoon', 'laatste-nieuws') and verwijderd_op is null), 10) + 10,
      bijgewerkt = now(), bijgewerkt_door = auth.uid()
  where id = p_id;
end;
$$;

revoke execute on function public.categorie_controle(text, text, jsonb, jsonb) from public, anon;
revoke execute on function public.categorie_opslaan(text, jsonb, jsonb) from public, anon;
revoke execute on function public.categorie_volgorde(text[]) from public, anon;
revoke execute on function public.categorie_verwijderen(text) from public, anon;
revoke execute on function public.categorie_terugzetten(text) from public, anon;
grant execute on function public.categorie_opslaan(text, jsonb, jsonb) to authenticated;
grant execute on function public.categorie_volgorde(text[]) to authenticated;
grant execute on function public.categorie_verwijderen(text) to authenticated;
grant execute on function public.categorie_terugzetten(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Vaste plek op de voorpagina
-- ---------------------------------------------------------------------------
-- positie 1 = groot bovenaan; 2 t/m 7 = de zes plekken in het raster
-- (twee rijen van drie op een breed scherm). Leeg = de site kiest zelf
-- (nieuwste eerst). Elke plek hoort bij hoogstens één artikel.

alter table public.artikelen
  add column if not exists positie smallint check (positie between 1 and 7);

create unique index if not exists artikelen_positie_uniek
  on public.artikelen (positie) where positie is not null;

-- Het nieuwste uitgelichte artikel krijgt plek 1 (eenmalig).
update public.artikelen set positie = 1
where id = (
  select id from public.artikelen
  where uitgelicht and status = 'gepubliceerd'
  order by gepubliceerd_op desc nulls last limit 1
)
and not exists (select 1 from public.artikelen where positie = 1);

-- Zet een artikel op een plek (of haalt het eraf met null). Wie de plek
-- had, verliest hem. 'uitgelicht' loopt mee met plek 1.
create or replace function public.zet_artikel_positie(p_artikel uuid, p_positie smallint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  taal text;
begin
  select originele_taal into taal from public.artikelen where id = p_artikel;
  if not found then raise exception 'niet_gevonden' using errcode = 'P0002'; end if;
  if not public.mag_schrijven_in(taal) then
    raise exception 'geen_toegang' using errcode = '42501';
  end if;
  if p_positie is not null and (p_positie < 1 or p_positie > 7) then
    raise exception 'positie_ongeldig' using errcode = '22023';
  end if;
  if p_positie is not null then
    update public.artikelen set positie = null, uitgelicht = false
    where positie = p_positie and id <> p_artikel;
  end if;
  update public.artikelen
  set positie = p_positie, uitgelicht = coalesce(p_positie = 1, false)
  where id = p_artikel;
end;
$$;

revoke execute on function public.zet_artikel_positie(uuid, smallint) from public, anon;
grant execute on function public.zet_artikel_positie(uuid, smallint) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Opslag voor afbeeldingen en video's (Supabase Storage)
-- ---------------------------------------------------------------------------
-- Map "media", openbaar leesbaar (anders kunnen bezoekers de beelden niet
-- zien). Uploaden, vervangen en verwijderen alleen door de redactie met 2FA.
-- Grootte per bestand: 50 MB, de grens van het gratis niveau van Supabase.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
        'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Redactie uploadt media" on storage.objects;
create policy "Redactie uploadt media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_redactie());

drop policy if exists "Redactie wijzigt media" on storage.objects;
create policy "Redactie wijzigt media" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.is_redactie())
  with check (bucket_id = 'media' and public.is_redactie());

drop policy if exists "Redactie verwijdert media" on storage.objects;
create policy "Redactie verwijdert media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_redactie());

drop policy if exists "Redactie ziet media" on storage.objects;
create policy "Redactie ziet media" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and public.is_redactie());
