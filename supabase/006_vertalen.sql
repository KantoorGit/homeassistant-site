-- 006_vertalen.sql
-- Vertalen bij aanmaken en bewerken (besluit B-13) met een vertaalwachtrij
-- die door de Claude-app op de MacBook van Winston wordt afgewerkt
-- (besluit B-15). Alle zes talen staan direct aan (besluit B-14).
--
-- Uitvoeren: Supabase → SQL Editor → + New query → plakken → Run.
-- Veilig om vaker uit te voeren. Voegt alleen toe; de live site blijft werken.
--
-- Hoe het werkt:
--   1. Wie iets plaatst of op "Vertalen naar andere talen" klikt, zet per
--      taal een taak in vertaal_taken (status 'wachtend').
--   2. De geplande taak in de Claude-app haalt via /api/vertalen/wachtrij
--      taken op (status 'bezig'), vertaalt ze en stuurt ze terug naar
--      /api/vertalen/resultaat. De website schrijft de vertaling weg
--      (status 'klaar') of zet de taak op 'mislukt' met een foutmelding.
--   3. De tekst die vertaald wordt, staat niet in de wachtrij: die wordt
--      bij het ophalen uit het artikel of bericht zelf gelezen, dus altijd
--      de nieuwste versie.

-- ---------------------------------------------------------------------------
-- 1. Instellingen van de site: welke talen staan aan (W-TAAL-10)
-- ---------------------------------------------------------------------------

create table if not exists public.site_instellingen (
  sleutel text primary key,
  waarde jsonb not null,
  bijgewerkt timestamptz not null default now(),
  bijgewerkt_door uuid references auth.users (id) on delete set null
);

insert into public.site_instellingen (sleutel, waarde)
values ('actieve_talen', '["nl", "en", "zh", "fr", "de", "es"]'::jsonb)
on conflict (sleutel) do nothing;

alter table public.site_instellingen enable row level security;

drop policy if exists "Instellingen zijn leesbaar" on public.site_instellingen;
create policy "Instellingen zijn leesbaar" on public.site_instellingen
  for select to anon, authenticated using (true);

revoke insert, update, delete on public.site_instellingen from anon, authenticated;

create or replace function public.actieve_talen()
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select array(select jsonb_array_elements_text(waarde))
     from public.site_instellingen where sleutel = 'actieve_talen'),
    array['nl', 'en', 'zh', 'fr', 'de', 'es']
  );
$$;

create or replace function public.zet_actieve_talen(p_talen text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_beheerder() then
    raise exception 'GEEN_BEHEERDER';
  end if;
  if p_talen is null or array_length(p_talen, 1) is null
     or not ('nl' = any (p_talen))
     or exists (select 1 from unnest(p_talen) t where t not in ('nl', 'en', 'zh', 'fr', 'de', 'es')) then
    raise exception 'ONGELDIGE_TALEN';
  end if;
  update public.site_instellingen
  set waarde = to_jsonb(p_talen), bijgewerkt = now(), bijgewerkt_door = auth.uid()
  where sleutel = 'actieve_talen';
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. De vertaalwachtrij
-- ---------------------------------------------------------------------------

create table if not exists public.vertaal_taken (
  id bigint generated always as identity primary key,
  soort text not null check (soort in ('artikel', 'forum')),
  artikel_id uuid references public.artikelen (id) on delete cascade,
  bericht_id bigint references public.forum_berichten (id) on delete cascade,
  doel_taal text not null check (doel_taal in ('nl', 'en', 'zh', 'fr', 'de', 'es')),
  status text not null default 'wachtend'
    check (status in ('wachtend', 'bezig', 'klaar', 'mislukt')),
  -- Een handmatig verbeterde vertaling mag overschreven worden (W-TAAL-15).
  overschrijven boolean not null default false,
  fout text,
  pogingen integer not null default 0,
  aangevraagd_door uuid references auth.users (id) on delete set null,
  aangemaakt timestamptz not null default now(),
  bijgewerkt timestamptz not null default now(),
  opgehaald_op timestamptz,
  check ((soort = 'artikel') = (artikel_id is not null)),
  check ((soort = 'forum') = (bericht_id is not null))
);

-- Per artikel of bericht en taal hoogstens één openstaande taak.
create unique index if not exists vertaal_taken_artikel_open_idx
  on public.vertaal_taken (artikel_id, doel_taal)
  where soort = 'artikel' and status in ('wachtend', 'bezig');
create unique index if not exists vertaal_taken_bericht_open_idx
  on public.vertaal_taken (bericht_id, doel_taal)
  where soort = 'forum' and status in ('wachtend', 'bezig');
create index if not exists vertaal_taken_status_idx
  on public.vertaal_taken (status, aangemaakt);
create index if not exists vertaal_taken_artikel_idx
  on public.vertaal_taken (artikel_id, aangemaakt desc) where artikel_id is not null;
create index if not exists vertaal_taken_bericht_idx
  on public.vertaal_taken (bericht_id, aangemaakt desc) where bericht_id is not null;

alter table public.vertaal_taken enable row level security;
revoke insert, update, delete on public.vertaal_taken from anon, authenticated;

-- De redactie ziet alle taken; een forumlid ziet de taken van de eigen
-- berichten (voor de status bij het bericht); moderators zien ze ook.
drop policy if exists "Vertaaltaken leesbaar" on public.vertaal_taken;
create policy "Vertaaltaken leesbaar" on public.vertaal_taken
  for select to authenticated using (
    public.is_redactie()
    or public.is_moderator()
    or (soort = 'forum' and exists (
      select 1 from public.forum_berichten b
      where b.id = bericht_id and b.auteur_id = auth.uid()
    ))
  );

-- Zet taken in de wachtrij voor de opgegeven talen. Alleen talen die aan
-- staan en die niet de taal van het origineel zijn. Een handmatig
-- verbeterde artikelvertaling wordt alleen meegenomen met p_overschrijven.
create or replace function public._vertaal_in_wachtrij(
  p_soort text,
  p_artikel uuid,
  p_bericht bigint,
  p_bron_taal text,
  p_talen text[],
  p_overschrijven boolean
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_taal text;
  v_aantal integer := 0;
begin
  foreach v_taal in array coalesce(p_talen, '{}') loop
    continue when v_taal = p_bron_taal;
    continue when not (v_taal = any (public.actieve_talen()));
    if p_soort = 'artikel' and not p_overschrijven and exists (
      select 1 from public.artikel_vertalingen v
      where v.artikel_id = p_artikel and v.taal = v_taal and v.handmatig_gecorrigeerd
    ) then
      continue;
    end if;

    if p_soort = 'artikel' then
      insert into public.vertaal_taken (soort, artikel_id, doel_taal, overschrijven, aangevraagd_door)
      values ('artikel', p_artikel, v_taal, p_overschrijven, auth.uid())
      on conflict (artikel_id, doel_taal) where soort = 'artikel' and status in ('wachtend', 'bezig')
      do update set overschrijven = excluded.overschrijven or public.vertaal_taken.overschrijven,
                    bijgewerkt = now();
    else
      insert into public.vertaal_taken (soort, bericht_id, doel_taal, overschrijven, aangevraagd_door)
      values ('forum', p_bericht, v_taal, p_overschrijven, auth.uid())
      on conflict (bericht_id, doel_taal) where soort = 'forum' and status in ('wachtend', 'bezig')
      do update set overschrijven = excluded.overschrijven or public.vertaal_taken.overschrijven,
                    bijgewerkt = now();
    end if;
    v_aantal := v_aantal + 1;
  end loop;
  return v_aantal;
end;
$$;

revoke all on function public._vertaal_in_wachtrij(text, uuid, bigint, text, text[], boolean)
  from public, anon, authenticated;

-- Redactie: een artikel laten vertalen (W-TAAL-11, -14, -15).
create or replace function public.vertaal_artikel(
  p_artikel uuid,
  p_talen text[],
  p_overschrijven boolean default false
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bron text;
begin
  select originele_taal into v_bron from public.artikelen where id = p_artikel;
  if v_bron is null then
    raise exception 'ARTIKEL_ONBEKEND';
  end if;
  if not public.mag_schrijven_in(v_bron) then
    raise exception 'GEEN_REDACTIE';
  end if;
  return public._vertaal_in_wachtrij('artikel', p_artikel, null, v_bron, p_talen, p_overschrijven);
end;
$$;

-- Forum: de schrijver (of een moderator) laat een bericht vertalen
-- (W-FOR-03, W-TAAL-14).
create or replace function public.forum_vertaal(
  p_bericht bigint,
  p_talen text[],
  p_overschrijven boolean default false
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public._forum_controle_schrijver();
  b record;
begin
  select * into b from public.forum_berichten where id = p_bericht and status <> 'verwijderd';
  if not found or (b.auteur_id is distinct from uid and not public.is_moderator()) then
    raise exception 'NIET_TOEGESTAAN';
  end if;
  if (select count(*) from public.vertaal_taken t
      where t.aangevraagd_door = uid and t.aangemaakt > now() - interval '1 hour') >= 100 then
    raise exception 'LIMIET_BERICHTEN';
  end if;
  return public._vertaal_in_wachtrij('forum', null, p_bericht, b.taal, p_talen, p_overschrijven);
end;
$$;

-- Een lid bewerkt een eigen bericht (W-FOR-09). Daarna wordt niet vanzelf
-- vertaald; de bestaande vertalingen blijven staan tot de schrijver op
-- "Vertalen naar andere talen" klikt (W-TAAL-14).
create or replace function public.forum_bewerk_eigen(
  p_bericht bigint,
  p_tekst text,
  p_titel text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public._forum_controle_schrijver();
  b record;
  v_status text;
begin
  select * into b from public.forum_berichten
  where id = p_bericht and auteur_id = uid and status <> 'verwijderd';
  if not found then
    raise exception 'NIET_TOEGESTAAN';
  end if;
  if exists (select 1 from public.forum_draden d where d.id = b.draad_id and d.gesloten) then
    raise exception 'DRAAD_GESLOTEN';
  end if;
  if p_tekst is null or char_length(p_tekst) not between 2 and 20000 then
    raise exception 'TEKST';
  end if;
  if b.is_opening and p_titel is not null and char_length(btrim(p_titel)) not between 5 and 150 then
    raise exception 'TITEL';
  end if;

  -- Opnieuw door het spamfilter; een verborgen bericht blijft verborgen.
  v_status := b.status;
  if b.status = 'zichtbaar'
     and public._forum_spamstatus(uid, coalesce(p_titel, '') || ' ' || p_tekst) = 'wacht' then
    v_status := 'wacht';
  end if;

  update public.forum_berichten
  set tekst = p_tekst, bewerkt = now(), status = v_status
  where id = p_bericht;

  if b.is_opening then
    update public.forum_draden
    set titel = coalesce(nullif(btrim(p_titel), ''), titel),
        status = case when v_status = 'wacht' and status = 'zichtbaar' then 'wacht' else status end
    where id = b.draad_id;
  end if;
  return v_status;
end;
$$;

-- Beheerder: alle bestaande content naar een (nieuw aangezette) taal
-- laten vertalen (W-TAAL-17).
create or replace function public.vertaal_alles_naar(p_taal text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_aantal integer := 0;
  r record;
begin
  if not public.is_beheerder() then
    raise exception 'GEEN_BEHEERDER';
  end if;
  for r in
    select a.id, a.originele_taal from public.artikelen a
    where a.originele_taal <> p_taal
      and not exists (select 1 from public.artikel_vertalingen v where v.artikel_id = a.id and v.taal = p_taal)
  loop
    v_aantal := v_aantal + public._vertaal_in_wachtrij('artikel', r.id, null, r.originele_taal, array[p_taal], false);
  end loop;
  for r in
    select b.id, b.taal from public.forum_berichten b
    where b.status = 'zichtbaar' and b.taal <> p_taal
      and not exists (select 1 from public.forum_vertalingen v where v.bericht_id = b.id and v.taal = p_taal)
  loop
    v_aantal := v_aantal + public._vertaal_in_wachtrij('forum', null, r.id, r.taal, array[p_taal], false);
  end loop;
  return v_aantal;
end;
$$;

grant execute on function public.vertaal_artikel(uuid, text[], boolean) to authenticated;
grant execute on function public.forum_vertaal(bigint, text[], boolean) to authenticated;
grant execute on function public.forum_bewerk_eigen(bigint, text, text) to authenticated;
grant execute on function public.vertaal_alles_naar(text) to authenticated;
grant execute on function public.zet_actieve_talen(text[]) to authenticated;
grant execute on function public.actieve_talen() to anon, authenticated;
revoke all on function public.vertaal_artikel(uuid, text[], boolean) from anon;
revoke all on function public.forum_vertaal(bigint, text[], boolean) from anon;
revoke all on function public.forum_bewerk_eigen(bigint, text, text) from anon;
revoke all on function public.vertaal_alles_naar(text) from anon;
revoke all on function public.zet_actieve_talen(text[]) from anon;

-- ---------------------------------------------------------------------------
-- 3. Voor de server (geheime sleutel): taken ophalen en afronden
-- ---------------------------------------------------------------------------

-- Haalt taken op en zet ze op 'bezig'. Forumberichten gaan pas naar de
-- vertaler als ze zichtbaar zijn (niet als ze op een moderator wachten).
-- Taken die na twee uur nog 'bezig' zijn, gaan terug in de wachtrij.
create or replace function public.vertaal_ophalen(p_max integer default 10)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uit jsonb;
begin
  update public.vertaal_taken
  set status = case when pogingen >= 5 then 'mislukt' else 'wachtend' end,
      fout = case when pogingen >= 5 then 'Te vaak geprobeerd zonder resultaat.' else fout end,
      bijgewerkt = now()
  where status = 'bezig' and opgehaald_op < now() - interval '2 hours';

  with gekozen as (
    select t.id
    from public.vertaal_taken t
    left join public.forum_berichten b on b.id = t.bericht_id
    left join public.forum_draden d on d.id = b.draad_id
    where t.status = 'wachtend'
      and (t.soort = 'artikel' or (b.status = 'zichtbaar' and d.status = 'zichtbaar'))
    order by t.aangemaakt
    limit greatest(1, least(coalesce(p_max, 10), 25))
    for update of t skip locked
  ),
  bijgewerkt as (
    update public.vertaal_taken t
    set status = 'bezig', opgehaald_op = now(), pogingen = t.pogingen + 1, bijgewerkt = now()
    from gekozen g
    where t.id = g.id
    returning t.*
  )
  select coalesce(jsonb_agg(taak order by (taak ->> 'id')::bigint), '[]'::jsonb) into v_uit
  from (
    select jsonb_build_object(
      'id', t.id,
      'soort', t.soort,
      'doel_taal', t.doel_taal,
      'bron_taal', coalesce(a.originele_taal, b.taal),
      'context', case when t.soort = 'artikel' then 'artikel:' || a.categorie_id
                      else 'forum:' || d.onderwerp end,
      'velden', case
        when t.soort = 'artikel' then jsonb_build_object('kop', av.kop, 'intro', av.intro, 'tekst', av.tekst)
        when b.is_opening then jsonb_build_object('titel', d.titel, 'tekst', b.tekst)
        else jsonb_build_object('tekst', b.tekst)
      end
    ) as taak
    from bijgewerkt t
    left join public.artikelen a on a.id = t.artikel_id
    left join public.artikel_vertalingen av on av.artikel_id = a.id and av.taal = a.originele_taal
    left join public.forum_berichten b on b.id = t.bericht_id
    left join public.forum_draden d on d.id = b.draad_id
  ) x;

  return v_uit;
end;
$$;

-- De bron van één taak zoals hij nu is, en of hij na het ophalen is
-- gewijzigd. Nodig om codeblokken terug te zetten en om te voorkomen dat
-- een vertaling van een oude versie wordt opgeslagen.
create or replace function public.vertaal_bron(p_taak bigint)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', t.id,
    'soort', t.soort,
    'status', t.status,
    'doel_taal', t.doel_taal,
    'bron_taal', coalesce(a.originele_taal, b.taal),
    'bron_slug', av.slug,
    'gewijzigd', case
      when t.soort = 'artikel' then av.bijgewerkt > t.opgehaald_op
      else coalesce(b.bewerkt > t.opgehaald_op, false)
    end,
    'velden', case
      when t.soort = 'artikel' then jsonb_build_object('kop', av.kop, 'intro', av.intro, 'tekst', av.tekst)
      when b.is_opening then jsonb_build_object('titel', d.titel, 'tekst', b.tekst)
      else jsonb_build_object('tekst', b.tekst)
    end
  )
  from public.vertaal_taken t
  left join public.artikelen a on a.id = t.artikel_id
  left join public.artikel_vertalingen av on av.artikel_id = a.id and av.taal = a.originele_taal
  left join public.forum_berichten b on b.id = t.bericht_id
  left join public.forum_draden d on d.id = b.draad_id
  where t.id = p_taak;
$$;

-- Slaat een vertaling op en zet de taak op 'klaar'.
create or replace function public.vertaal_opslaan(
  p_taak bigint,
  p_velden jsonb,
  p_slug text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  t record;
  v_bestaand record;
  v_slug text;
  v_nummer integer := 1;
begin
  select * into t from public.vertaal_taken where id = p_taak for update;
  if not found or t.status <> 'bezig' then
    return 'onbekend';
  end if;

  if t.soort = 'artikel' then
    select * into v_bestaand from public.artikel_vertalingen
    where artikel_id = t.artikel_id and taal = t.doel_taal;

    if found and v_bestaand.handmatig_gecorrigeerd and not t.overschrijven then
      update public.vertaal_taken
      set status = 'klaar', fout = 'Overgeslagen: de vertaling is met de hand verbeterd.', bijgewerkt = now()
      where id = p_taak;
      return 'overgeslagen';
    end if;

    if found then
      -- Het webadres van een bestaande vertaling blijft gelijk.
      update public.artikel_vertalingen
      set kop = p_velden ->> 'kop',
          intro = coalesce(p_velden ->> 'intro', ''),
          tekst = coalesce(p_velden ->> 'tekst', ''),
          automatisch_vertaald = true,
          handmatig_gecorrigeerd = false,
          bijgewerkt = now(),
          bijgewerkt_door = null
      where artikel_id = t.artikel_id and taal = t.doel_taal;
    else
      v_slug := nullif(p_slug, '');
      if v_slug is null then
        select slug into v_slug from public.artikel_vertalingen v
        join public.artikelen a on a.id = v.artikel_id and a.originele_taal = v.taal
        where v.artikel_id = t.artikel_id;
      end if;
      -- Uniek maken binnen de taal: -2, -3, …
      while exists (
        select 1 from public.artikel_vertalingen
        where taal = t.doel_taal and slug = case when v_nummer = 1 then v_slug else v_slug || '-' || v_nummer end
      ) loop
        v_nummer := v_nummer + 1;
      end loop;
      if v_nummer > 1 then
        v_slug := v_slug || '-' || v_nummer;
      end if;

      insert into public.artikel_vertalingen (
        artikel_id, taal, slug, kop, intro, tekst, automatisch_vertaald, handmatig_gecorrigeerd, bijgewerkt
      ) values (
        t.artikel_id, t.doel_taal, v_slug, p_velden ->> 'kop',
        coalesce(p_velden ->> 'intro', ''), coalesce(p_velden ->> 'tekst', ''), true, false, now()
      );
    end if;
  else
    if not t.overschrijven and exists (
      select 1 from public.forum_vertalingen
      where bericht_id = t.bericht_id and taal = t.doel_taal and handmatig_gecorrigeerd
    ) then
      update public.vertaal_taken
      set status = 'klaar', fout = 'Overgeslagen: de vertaling is met de hand verbeterd.', bijgewerkt = now()
      where id = p_taak;
      return 'overgeslagen';
    end if;
    insert into public.forum_vertalingen (bericht_id, taal, titel, tekst, handmatig_gecorrigeerd, aangemaakt)
    values (t.bericht_id, t.doel_taal, p_velden ->> 'titel', p_velden ->> 'tekst', false, now())
    on conflict (bericht_id, taal) do update
      set titel = excluded.titel, tekst = excluded.tekst,
          handmatig_gecorrigeerd = false, aangemaakt = now();
  end if;

  update public.vertaal_taken set status = 'klaar', fout = null, bijgewerkt = now() where id = p_taak;
  return 'klaar';
end;
$$;

-- Zet een taak op 'mislukt' (met reden) of terug in de wachtrij.
create or replace function public.vertaal_afronden(
  p_taak bigint,
  p_status text,
  p_fout text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status not in ('wachtend', 'mislukt') then
    raise exception 'ONGELDIGE_STATUS';
  end if;
  update public.vertaal_taken
  set status = p_status, fout = left(p_fout, 500), bijgewerkt = now()
  where id = p_taak and status = 'bezig';
end;
$$;

revoke all on function public.vertaal_ophalen(integer) from public, anon, authenticated;
revoke all on function public.vertaal_bron(bigint) from public, anon, authenticated;
revoke all on function public.vertaal_opslaan(bigint, jsonb, text) from public, anon, authenticated;
revoke all on function public.vertaal_afronden(bigint, text, text) from public, anon, authenticated;
grant execute on function public.vertaal_ophalen(integer) to service_role;
grant execute on function public.vertaal_bron(bigint) to service_role;
grant execute on function public.vertaal_opslaan(bigint, jsonb, text) to service_role;
grant execute on function public.vertaal_afronden(bigint, text, text) to service_role;
